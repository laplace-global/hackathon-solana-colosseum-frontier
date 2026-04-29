import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return NextResponse.json(
    {
      success: false,
      subjectAddress: body?.subjectAddress ?? null,
      error: 'Credential issuance is not available in the current Solana MVP.',
    },
    { status: 410 }
  );
}
