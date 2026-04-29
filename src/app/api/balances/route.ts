import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { getAccountBalances } from '@/lib/chain/client';
import type { AssetBalance } from '@/lib/chain/types';
import { getAllActiveMarkets } from '@/lib/db/seed';

type LegacyCompatibleBalance = AssetBalance & {
  currency: string;
  value: string;
  issuer?: string;
};

function toLegacyCompatibleBalance(balance: AssetBalance): LegacyCompatibleBalance {
  return {
    ...balance,
    currency: balance.symbol,
    value: balance.displayAmount,
    issuer: balance.assetId ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    try {
      new PublicKey(address);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    const markets = await getAllActiveMarkets();
    const assetDefinitions = buildAssetDefinitions(markets);
    const balances = await getAccountBalances(address, assetDefinitions);

    return NextResponse.json({
      success: true,
      address,
      balances: balances.map(toLegacyCompatibleBalance),
    });
  } catch (error) {
    console.error('Balances error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
