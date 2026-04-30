import { NextRequest, NextResponse } from 'next/server';

import { processSupply } from '@/lib/lending/solana-service';
import {
  getInvalidLendingBackendAddressMessage,
  isValidLendingBackendAddress,
  readAccountSecretFromPayload,
} from '@/lib/lending/request';

interface RouteContext {
  params: Promise<{ marketId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { marketId } = await context.params;
    const body = await request.json();
    const { senderAddress, amount, idempotencyKey } = body;
    const accountSecret = readAccountSecretFromPayload(body as Record<string, unknown>);

    if (!marketId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_MARKET_ID', message: 'marketId is required' },
        },
        { status: 400 }
      );
    }

    if (!senderAddress || typeof senderAddress !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_SENDER_ADDRESS', message: 'senderAddress is required' },
        },
        { status: 400 }
      );
    }

    if (!isValidLendingBackendAddress(senderAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ADDRESS', message: getInvalidLendingBackendAddressMessage() },
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

    const { result, error } = await processSupply({
      senderAddress,
      marketId,
      amount,
      accountSecret,
      idempotencyKey,
    });

    if (error) {
      let status = 400;
      if (error.code === 'MARKET_NOT_FOUND') status = 404;
      if (error.code === 'SUPPLY_FAILED') status = 500;
      return NextResponse.json({ success: false, error }, { status });
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Supply result missing' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        marketId: result.marketId,
        supplyPositionId: result.supplyPositionId,
        suppliedAmount: result.suppliedAmount.toFixed(8),
      },
    });
  } catch (error) {
    console.error('Supply route error:', error);
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
