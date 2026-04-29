import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return NextResponse.json(
    {
      success: false,
      signedTxBlob: typeof body?.signedTxBlob === 'string' ? body.signedTxBlob : null,
      error: 'Credential acceptance is not available in the current Solana MVP.',
    },
    { status: 410 }
  );
}
