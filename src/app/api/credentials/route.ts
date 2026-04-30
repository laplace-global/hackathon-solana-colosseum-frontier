import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  return NextResponse.json(
    {
      success: false,
      address,
      error: 'Credential features are not available in the current Solana MVP.',
    },
    { status: 410 }
  );
}
