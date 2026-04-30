import { NextRequest, NextResponse } from 'next/server';

import { getActiveLockedCollateralPositions } from '@/lib/lending/positions';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId')?.trim() || undefined;

    if (marketId && !UUID_REGEX.test(marketId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_MARKET_ID',
            message: 'marketId must be a valid UUID',
          },
        },
        { status: 400 }
      );
    }

    const positions = await getActiveLockedCollateralPositions(marketId, 20);

    return NextResponse.json({
      success: true,
      data: {
        positions,
      },
    });
  } catch (error) {
    console.error('Collateral locks route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load collateral locks',
        },
      },
      { status: 500 }
    );
  }
}
