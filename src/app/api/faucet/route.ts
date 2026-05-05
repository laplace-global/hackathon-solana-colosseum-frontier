import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveMarkets } from '@/lib/db/seed';
import { getAssetBySymbol, isValidChainAddress, transferAsset } from '@/lib/chain/client';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { getTreasuryAccount } from '@/lib/chain/service-account';

const TOKENS = {
  SAIL: {
    symbol: 'SAIL',
    amount: '100',
  },
  NYRA: {
    symbol: 'NYRA',
    amount: '100',
  },
  USDC: {
    symbol: 'USDC',
    amount: '1000',
  },
} as const;

type FaucetToken = keyof typeof TOKENS;

/**
 * @deprecated UI-based token faucets are deprecated.
 * Prefer `/api/onramp` for USDC funding and `/api/purchase` for USDC->RWA purchase flow.
 * This endpoint is kept for local/dev tooling.
 */
export async function POST(request: NextRequest) {
  try {
    const { userAddress, token } = await request.json();

    // 1. Validate inputs
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing required field: userAddress' },
        { status: 400 }
      );
    }

    const normalizedToken = typeof token === 'string' ? token.toUpperCase() : 'SAIL';
    if (!(normalizedToken in TOKENS)) {
      return NextResponse.json(
        { error: 'Unsupported token. Use SAIL, NYRA, or USDC.' },
        { status: 400 }
      );
    }

    const faucetToken = TOKENS[normalizedToken as FaucetToken];

    if (!isValidChainAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const markets = await getAllActiveMarkets();
    const assetDefinitions = buildAssetDefinitions(markets);
    const asset = getAssetBySymbol(assetDefinitions, faucetToken.symbol);
    if (!asset || asset.kind !== 'token' || !asset.assetId) {
      return NextResponse.json(
        { error: `${normalizedToken} asset is not configured for the active market set` },
        { status: 500 }
      );
    }

    const faucetAccount = getTreasuryAccount();
    const tx = await transferAsset({
      sourceSecret: faucetAccount.secret,
      destinationAddress: userAddress,
      asset,
      amount: faucetToken.amount,
    });

    return NextResponse.json({
      success: true,
      txHash: tx.txHash,
      explorerUrl: tx.explorerUrl,
      amount: faucetToken.amount,
      token: normalizedToken,
    });
  } catch (error) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
