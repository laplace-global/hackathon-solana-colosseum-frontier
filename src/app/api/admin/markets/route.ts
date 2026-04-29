import { NextResponse } from 'next/server';

import { getAllMarkets } from '@/lib/db/seed';

export async function GET() {
  try {
    const markets = await getAllMarkets();
    return NextResponse.json({ ok: true, markets });
  } catch (error) {
    console.error('Admin markets GET error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
