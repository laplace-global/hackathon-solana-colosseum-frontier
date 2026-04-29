import { NextRequest, NextResponse } from 'next/server';
import {
  isValidChainAddress,
  transferNativeAsset,
} from '@/lib/chain/client';
import { getTreasuryAccount } from '@/lib/chain/service-account';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAddress = typeof body?.userAddress === 'string' ? body.userAddress.trim() : '';
    const amount =
      typeof body?.amount === 'number'
        ? String(body.amount)
        : typeof body?.amount === 'string'
          ? body.amount.trim()
          : '1';

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing required field: userAddress' },
        { status: 400 }
      );
    }

    if (!isValidChainAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const treasury = getTreasuryAccount();
    const transfer = await transferNativeAsset({
      sourceSecret: treasury.secret,
      destinationAddress: userAddress,
      amount,
    });

    return NextResponse.json({
      success: true,
      txHash: transfer.txHash,
      explorerUrl: transfer.explorerUrl,
      amount: transfer.amount,
      symbol: transfer.symbol,
    });
  } catch (error) {
    console.error('Admin SOL funding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
