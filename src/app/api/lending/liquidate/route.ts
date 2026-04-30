import { NextResponse } from 'next/server';

/**
 * POST /api/lending/liquidate
 *
 * Liquidation is outside the current Solana MVP scope.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNSUPPORTED_OPERATION',
        message: 'Liquidation is outside the current Solana MVP scope',
      },
    },
    { status: 501 }
  );
}
