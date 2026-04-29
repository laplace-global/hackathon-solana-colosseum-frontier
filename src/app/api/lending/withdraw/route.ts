import { NextRequest, NextResponse } from 'next/server';

import { processWithdraw } from '@/lib/lending/solana-service';
import { invalidateLendingReadCaches } from '@/lib/lending/cache';
import {
  getInvalidLendingBackendAddressMessage,
  isValidLendingBackendAddress,
  readAccountSecretFromPayload,
} from '@/lib/lending/request';

/**
 * POST /api/lending/withdraw
 *
 * Release collateral back to the user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, marketId, amount, idempotencyKey } = body;
    const accountSecret = readAccountSecretFromPayload(body as Record<string, unknown>);

    if (!userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_USER_ADDRESS', message: 'userAddress is required' },
        },
        { status: 400 }
      );
    }

    if (!marketId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_MARKET_ID', message: 'marketId is required' },
        },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_AMOUNT', message: 'amount must be a positive number' },
        },
        { status: 400 }
      );
    }

    if (!accountSecret) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_ACCOUNT_SECRET', message: 'accountSecret is required' },
        },
        { status: 400 }
      );
    }

    if (!isValidLendingBackendAddress(userAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ADDRESS', message: getInvalidLendingBackendAddressMessage() },
        },
        { status: 400 }
      );
    }

    const { result, error } = await processWithdraw({
      userAddress,
      marketId,
      amount,
      accountSecret,
      idempotencyKey,
    });

    if (error) {
      const status = error.code === 'MARKET_NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ success: false, error }, { status });
    }

    invalidateLendingReadCaches({ marketId, userAddress });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
