import { NextRequest, NextResponse } from 'next/server';

import { getAllActiveMarkets } from '@/lib/db/seed';
import {
  getAssetBySymbol,
  isValidChainAddress,
  transferAsset,
  transferNativeAsset,
} from '@/lib/chain/client';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { getTreasuryAccount } from '@/lib/chain/service-account';
import { withDemoTokenAssetDefinitions } from '@/lib/assets/demo-token-assets';

const ONBOARDING_SOL_AMOUNT = '0.25';
const ONBOARDING_USDC_AMOUNT = '10000';

function toBoolean(value: unknown): boolean {
  return value === true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAddress = typeof body?.userAddress === 'string' ? body.userAddress.trim() : '';
    const fundSol = toBoolean(body?.fundSol);
    const fundUsdc = toBoolean(body?.fundUsdc);

    if (!isValidChainAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing userAddress' },
        { status: 400 }
      );
    }

    const treasuryAccount = getTreasuryAccount();
    let solTxHash: string | null = null;
    let usdcTxHash: string | null = null;
    let usdcAsset: NonNullable<ReturnType<typeof getAssetBySymbol>> | null = null;

    if (fundUsdc) {
      const markets = await getAllActiveMarkets();
      const assetDefinitions = withDemoTokenAssetDefinitions(buildAssetDefinitions(markets));
      usdcAsset = getAssetBySymbol(assetDefinitions, 'USDC');

      if (!usdcAsset || usdcAsset.kind !== 'token' || !usdcAsset.assetId) {
        return NextResponse.json(
          { success: false, error: 'USDC asset is not configured for onboarding' },
          { status: 500 }
        );
      }
    }

    if (fundSol) {
      const transfer = await transferNativeAsset({
        sourceSecret: treasuryAccount.secret,
        destinationAddress: userAddress,
        amount: ONBOARDING_SOL_AMOUNT,
      });
      solTxHash = transfer.txHash;
    }

    if (fundUsdc && usdcAsset) {
      const transfer = await transferAsset({
        sourceSecret: treasuryAccount.secret,
        destinationAddress: userAddress,
        asset: usdcAsset,
        amount: ONBOARDING_USDC_AMOUNT,
      });
      usdcTxHash = transfer.txHash;
    }

    return NextResponse.json({
      success: true,
      data: {
        solAmount: fundSol ? ONBOARDING_SOL_AMOUNT : '0',
        usdcAmount: fundUsdc ? ONBOARDING_USDC_AMOUNT : '0',
        solTxHash,
        usdcTxHash,
      },
    });
  } catch (error) {
    console.error('Onboarding wallet funding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare local wallet',
      },
      { status: 500 }
    );
  }
}
