import { NextRequest, NextResponse } from 'next/server';
import { processRepay } from '@/lib/lending/solana-service';
import { invalidateLendingReadCaches } from '@/lib/lending/cache';
import {
  getInvalidLendingBackendAddressMessage,
  isValidLendingBackendAddress,
  readAccountSecretFromPayload,
} from '@/lib/lending/request';

/**
 * POST /api/lending/repay
 *
 * Verify a repayment transaction and reduce debt
 *
 * Body:
 * - userAddress: User address for the current lending backend
 * - marketId: Target market ID
 * - amount: Repayment amount in debt token
 * - accountSecret: User wallet secret for the devnet demo flow
 * - repayKind?: One of regular|full|overpayment|late
 * - idempotencyKey?: Optional idempotency key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, marketId, amount, repayKind, idempotencyKey } = body;
    const accountSecret = readAccountSecretFromPayload(body as Record<string, unknown>);

    // Validate required fields
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
          error: { code: 'INVALID_AMOUNT', message: 'amount must be a number greater than 0' },
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

    const normalizedRepayKind =
      repayKind === 'full' || repayKind === 'overpayment' || repayKind === 'late' ? repayKind : 'regular';

    // Validate address format
    if (!isValidLendingBackendAddress(userAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ADDRESS', message: getInvalidLendingBackendAddressMessage() },
        },
        { status: 400 }
      );
    }

    const { result, error } = await processRepay({
      userAddress,
      marketId,
      amount,
      accountSecret,
      repayKind: normalizedRepayKind,
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
    console.error('Repay error:', error);
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
