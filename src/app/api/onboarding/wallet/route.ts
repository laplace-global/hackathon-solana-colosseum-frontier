import { NextRequest, NextResponse } from 'next/server';
import Decimal from 'decimal.js';

import { getAllActiveMarkets } from '@/lib/db/seed';
import {
  getAccountBalances,
  getAssetBySymbol,
  isValidChainAddress,
  transferAsset,
  transferNativeAsset,
} from '@/lib/chain/client';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { getTreasuryAccount } from '@/lib/chain/service-account';
import { withDemoTokenAssetDefinitions } from '@/lib/assets/demo-token-assets';
import type { AssetBalance } from '@/lib/chain/types';

const ONBOARDING_SOL_TARGET = '1.0';
const ONBOARDING_USDC_TARGET = '10000';

function toBoolean(value: unknown): boolean {
  return value === true;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAddress = typeof body?.userAddress === 'string' ? body.userAddress.trim() : '';
    const fundSol = toBoolean(body?.fundSol);
    const fundUsdc = toBoolean(body?.fundUsdc);
    const assumeEmptyWallet = toBoolean(body?.assumeEmptyWallet);

    if (!isValidChainAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing userAddress' },
        { status: 400 }
      );
    }

    const treasuryAccount = getTreasuryAccount();
    let usdcAsset: NonNullable<ReturnType<typeof getAssetBySymbol>> | null = null;

    if (fundUsdc) {
      const markets = await getAllActiveMarkets();
      const assetDefinitions = withDemoTokenAssetDefinitions(buildAssetDefinitions(markets));
      usdcAsset = getAssetBySymbol(assetDefinitions, 'USDC');

      if (!usdcAsset || usdcAsset.kind !== 'token' || !usdcAsset.assetId) {
        return NextResponse.json(
          { success: false, error: 'USDC asset is not configured for onboarding' },
          { status: 500 }
        );
      }
    }

    const balanceAssetDefinitions = usdcAsset ? [usdcAsset] : [];
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

    const [solTransfer, usdcTransfer] = await Promise.all([
      solTopUpAmount
        ? transferNativeAsset({
            sourceSecret: treasuryAccount.secret,
            destinationAddress: userAddress,
            amount: solTopUpAmount,
          })
        : Promise.resolve(null),
      usdcTopUpAmount && usdcAsset
        ? transferAsset({
            sourceSecret: treasuryAccount.secret,
            destinationAddress: userAddress,
            asset: usdcAsset,
            amount: usdcTopUpAmount,
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        solTarget: ONBOARDING_SOL_TARGET,
        usdcTarget: ONBOARDING_USDC_TARGET,
        solAmount: solTopUpAmount ?? '0',
        usdcAmount: usdcTopUpAmount ?? '0',
        solTxHash: solTransfer?.txHash ?? null,
        usdcTxHash: usdcTransfer?.txHash ?? null,
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
