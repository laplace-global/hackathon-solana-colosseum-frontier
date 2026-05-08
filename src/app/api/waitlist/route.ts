import { NextRequest, NextResponse } from 'next/server';

import { saveWaitlistEntry } from '@/lib/db/waitlist';
import { getWaitlistEmailError, normalizeWaitlistEmail } from '@/lib/waitlist';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailError = getWaitlistEmailError(body?.email);

    if (emailError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: emailError,
          },
        },
        { status: 400 }
      );
    }

    const email = normalizeWaitlistEmail(body.email);
    await saveWaitlistEntry({
      email,
      source: typeof body?.source === 'string' ? body.source : null,
    });

    return NextResponse.json({
      success: true,
      data: { email },
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WAITLIST_ERROR',
          message: 'Failed to join waitlist. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
