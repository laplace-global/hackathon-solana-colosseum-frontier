import { NextRequest, NextResponse } from 'next/server';
import Decimal from 'decimal.js';

import { getAllActiveMarkets } from '@/lib/db/seed';
import {
  getAccountBalances,
  getAssetBySymbol,
  isValidChainAddress,
  requestTestFunds,
  transferAsset,
  transferNativeAsset,
} from '@/lib/chain/client';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { replenishTreasurySolBestEffort } from '@/lib/chain/fee-topup';
import { getTreasuryAccount } from '@/lib/chain/service-account';
import { withDemoTokenAssetDefinitions } from '@/lib/assets/demo-token-assets';
import type { AssetBalance, AssetDefinition } from '@/lib/chain/types';

const ONBOARDING_SOL_TARGET = '0.05';
const ONBOARDING_USDC_TARGET = '500000';
const ONBOARDING_COLLATERAL_TARGET = '10';

function toBoolean(value: unknown): boolean {
  return value === true;
}

function getCollateralSymbols(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const symbol = item.trim().toUpperCase();
    if (!symbol || symbol === 'USDC') continue;
    seen.add(symbol);
  }

  return Array.from(seen);
}

function isTokenAsset(asset: AssetDefinition | null): asset is AssetDefinition & {
  kind: 'token';
  assetId: string;
} {
  return asset?.kind === 'token' && Boolean(asset.assetId);
}

function getBalanceAmount(balances: AssetBalance[], symbol: string): Decimal {
  const balance = balances.find((entry) => entry.symbol === symbol);
  return new Decimal(balance?.displayAmount ?? '0');
}

function getTopUpAmount(params: {
  balances: AssetBalance[];
  symbol: string;
  target: string;
}): string | null {
  const missingAmount = new Decimal(params.target).minus(
    getBalanceAmount(params.balances, params.symbol)
  );

  if (missingAmount.lte(0)) return null;
  return missingAmount.toFixed();
}

async function fundSolTopUp(params: {
  userAddress: string;
  amount: string;
  getTreasurySecret: () => string;
}): Promise<{ txHash: string }> {
  const { userAddress, amount, getTreasurySecret } = params;

  try {
    await replenishTreasurySolBestEffort();
    const treasuryTransfer = await transferNativeAsset({
      sourceSecret: getTreasurySecret(),
      destinationAddress: userAddress,
      amount,
    });
    return { txHash: treasuryTransfer.txHash };
  } catch (treasuryError) {
    console.warn('Onboarding SOL Treasury transfer failed; falling back to devnet airdrop:', treasuryError);
    const airdrop = await requestTestFunds(userAddress, Number(amount));
    return { txHash: airdrop.signature };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAddress = typeof body?.userAddress === 'string' ? body.userAddress.trim() : '';
    const fundSol = toBoolean(body?.fundSol);
    const fundUsdc = toBoolean(body?.fundUsdc);
    const collateralSymbols = getCollateralSymbols(body?.collateralSymbols);
    const assumeEmptyWallet = toBoolean(body?.assumeEmptyWallet);

    if (!isValidChainAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing userAddress' },
        { status: 400 }
      );
    }

    let treasurySecret: string | null = null;
    const getTreasurySecret = () => {
      treasurySecret ??= getTreasuryAccount().secret;
      return treasurySecret;
    };
    let usdcAsset: (AssetDefinition & { kind: 'token'; assetId: string }) | null = null;
    const collateralAssets: Array<AssetDefinition & { kind: 'token'; assetId: string }> = [];

    if (fundUsdc || collateralSymbols.length > 0) {
      const markets = await getAllActiveMarkets();
      const assetDefinitions = withDemoTokenAssetDefinitions(buildAssetDefinitions(markets));
      const configuredUsdcAsset = getAssetBySymbol(assetDefinitions, 'USDC');
      usdcAsset = isTokenAsset(configuredUsdcAsset) ? configuredUsdcAsset : null;

      if (fundUsdc && !usdcAsset) {
        return NextResponse.json(
          { success: false, error: 'USDC asset is not configured for onboarding' },
          { status: 500 }
        );
      }

      for (const symbol of collateralSymbols) {
        const asset = getAssetBySymbol(assetDefinitions, symbol);
        if (isTokenAsset(asset)) {
          collateralAssets.push(asset);
        }
      }
    }

    const balanceAssetDefinitions = Array.from(
      new Map(
        [
          ...(usdcAsset ? [usdcAsset] : []),
          ...collateralAssets,
        ].map((asset) => [asset.symbol, asset])
      ).values()
    );
    const currentBalances = assumeEmptyWallet
      ? []
      : await getAccountBalances(userAddress, balanceAssetDefinitions);
    const solTopUpAmount = fundSol
      ? getTopUpAmount({
          balances: currentBalances,
          symbol: 'SOL',
          target: ONBOARDING_SOL_TARGET,
        })
      : null;
    const usdcTopUpAmount = fundUsdc
      ? getTopUpAmount({
          balances: currentBalances,
          symbol: 'USDC',
          target: ONBOARDING_USDC_TARGET,
        })
      : null;
    const collateralTopUps = collateralAssets
      .map((asset) => ({
        asset,
        amount: getTopUpAmount({
          balances: currentBalances,
          symbol: asset.symbol,
          target: ONBOARDING_COLLATERAL_TARGET,
        }),
      }))
      .filter((entry): entry is { asset: AssetDefinition & { kind: 'token'; assetId: string }; amount: string } =>
        Boolean(entry.amount)
      );
    const tokenTopUps = [
      ...(usdcTopUpAmount && usdcAsset
        ? [{ kind: 'usdc' as const, asset: usdcAsset, amount: usdcTopUpAmount }]
        : []),
      ...collateralTopUps.map((entry) => ({
        kind: 'collateral' as const,
        asset: entry.asset,
        amount: entry.amount,
      })),
    ];

    const [solTransfer, tokenTransfers] = await Promise.all([
      solTopUpAmount
        ? fundSolTopUp({
            userAddress,
            amount: solTopUpAmount,
            getTreasurySecret,
          })
        : Promise.resolve(null),
      tokenTopUps.length > 0
        ? (async () => {
            await replenishTreasurySolBestEffort();
            return Promise.all(
              tokenTopUps.map(async (topUp) => ({
                topUp,
                receipt: await transferAsset({
                  sourceSecret: getTreasurySecret(),
                  destinationAddress: userAddress,
                  asset: topUp.asset,
                  amount: topUp.amount,
                }),
              }))
            );
          })()
        : Promise.resolve([]),
    ]);
    const usdcTransfer = tokenTransfers.find((entry) => entry.topUp.kind === 'usdc')?.receipt ?? null;
    const collateralTransfers = tokenTransfers.filter((entry) => entry.topUp.kind === 'collateral');

    return NextResponse.json({
      success: true,
      data: {
        solTarget: ONBOARDING_SOL_TARGET,
        usdcTarget: ONBOARDING_USDC_TARGET,
        solAmount: solTopUpAmount ?? '0',
        usdcAmount: usdcTopUpAmount ?? '0',
        collateralTarget: ONBOARDING_COLLATERAL_TARGET,
        collateralAmounts: Object.fromEntries(
          collateralAssets.map((asset) => [
            asset.symbol,
            collateralTopUps.find((entry) => entry.asset.symbol === asset.symbol)?.amount ?? '0',
          ])
        ),
        solTxHash: solTransfer?.txHash ?? null,
        usdcTxHash: usdcTransfer?.txHash ?? null,
        collateralTxHashes: Object.fromEntries(
          collateralTransfers.map((entry) => [entry.topUp.asset.symbol, entry.receipt.txHash])
        ),
      },
    });
  } catch (error) {
    console.error('Onboarding wallet funding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare local wallet',
      },
      { status: 500 }
    );
  }
}
