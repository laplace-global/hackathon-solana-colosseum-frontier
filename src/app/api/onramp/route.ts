import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveMarkets } from '@/lib/db/seed';
import { getAssetBySymbol, isValidChainAddress, transferAsset } from '@/lib/chain/client';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { getTreasuryAccount } from '@/lib/chain/service-account';

function parseAmount(rawAmount: unknown): number | null {
  const amount = typeof rawAmount === 'string' ? Number(rawAmount) : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAddress = body?.userAddress;
    const amount = parseAmount(body?.amount);

    if (!isValidChainAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing userAddress' },
        { status: 400 }
      );
    }

    if (amount === null) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const markets = await getAllActiveMarkets();
    const assetDefinitions = buildAssetDefinitions(markets);
    const paymentAsset = getAssetBySymbol(assetDefinitions, 'USDC');
    if (!paymentAsset || paymentAsset.kind !== 'token' || !paymentAsset.assetId) {
      return NextResponse.json(
        { success: false, error: 'USDC asset is not configured for the active market set' },
        { status: 500 }
      );
    }

    const treasuryAccount = getTreasuryAccount();
    const tx = await transferAsset({
      sourceSecret: treasuryAccount.secret,
      destinationAddress: userAddress,
      asset: paymentAsset,
      amount: amount.toString(),
    });

    return NextResponse.json({
      success: true,
      txHash: tx.txHash,
      explorerUrl: tx.explorerUrl,
      amount,
    });
  } catch (error) {
    console.error('Onramp error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
