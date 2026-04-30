import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, markets } from '@/lib/db';
import { setMarketLiquidityConfig } from '@/lib/db/seed';

interface RouteContext {
  params: Promise<{ marketId: string }>;
}

function mapMarketConfig(market: typeof markets.$inferSelect) {
  return {
    marketId: market.id,
    liquidityPoolId: market.liquidityPoolId,
    positionTokenAssetId: market.positionTokenAssetId,
    liquidityShareScale: market.liquidityShareScale,
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { marketId } = await context.params;
    if (!marketId) {
      return NextResponse.json({ ok: false, error: 'marketId is required' }, { status: 400 });
    }

    const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
    if (!market) {
      return NextResponse.json({ ok: false, error: 'Market not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: false,
      error: 'Automatic liquidity reference creation is not supported. Update the market references manually.',
    }, { status: 400 });
  } catch (error) {
    console.error('Admin create liquidity reference error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { marketId } = await context.params;
    if (!marketId) {
      return NextResponse.json({ ok: false, error: 'marketId is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const liquidityPoolId = typeof body?.liquidityPoolId === 'string' ? body.liquidityPoolId.trim() : '';
    const positionTokenAssetId =
      typeof body?.positionTokenAssetId === 'string' ? body.positionTokenAssetId.trim() : '';
    const liquidityShareScaleRaw = body?.liquidityShareScale;
    const hasSupplyReference = liquidityPoolId.length > 0;
    const hasPositionTokenReference = positionTokenAssetId.length > 0;

    if (hasSupplyReference !== hasPositionTokenReference) {
      return NextResponse.json(
        {
          ok: false,
          error: 'liquidityPoolId and positionTokenAssetId must both be set or both be empty',
        },
        { status: 400 }
      );
    }

    let liquidityShareScale: number | null = null;
    if (liquidityShareScaleRaw !== undefined) {
      if (
        typeof liquidityShareScaleRaw !== 'number' ||
        !Number.isInteger(liquidityShareScaleRaw) ||
        liquidityShareScaleRaw <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: 'liquidityShareScale must be a positive integer when provided',
          },
          { status: 400 }
        );
      }
      liquidityShareScale = liquidityShareScaleRaw;
    }

    const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
    if (!market) {
      return NextResponse.json({ ok: false, error: 'Market not found' }, { status: 404 });
    }

    await setMarketLiquidityConfig(marketId, {
      liquidityPoolId: hasSupplyReference ? liquidityPoolId : null,
      positionTokenAssetId: hasPositionTokenReference ? positionTokenAssetId : null,
      liquidityShareScale: liquidityShareScale ?? market.liquidityShareScale,
    });

    const updated = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Market not found after update' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      market: mapMarketConfig(updated),
    });
  } catch (error) {
    console.error('Admin market reference PATCH error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
