import { NextResponse } from 'next/server';
import { getAllActiveMarkets, getMarketPrices } from '@/lib/db/seed';
import { buildAssetDefinitions, getChainRuntimeConfig } from '@/lib/chain/config';
import { getOperatorAddress, getTreasuryAddress } from '@/lib/chain/service-account';
import { getAssetSymbol } from '@/lib/assets/asset-symbols';
import { DEFAULT_LOAN_TERM_MONTHS } from '@/lib/lending/constants';

/**
 * GET /api/lending/config
 *
 * Returns active market configurations
 */
export async function GET() {
  try {
    const markets = await getAllActiveMarkets();
    const chainConfig = getChainRuntimeConfig();
    const assetDefinitions = buildAssetDefinitions(markets);
    const treasuryAddress = getTreasuryAddress();
    const operatorAddress = getOperatorAddress();

    const marketsWithPrices = await Promise.all(
      markets.map(async (market) => {
        const prices = await getMarketPrices(market.id);
        return {
          id: market.id,
          name: market.name,
          collateralCurrency: getAssetSymbol(market.collateral_currency),
          collateralIssuer: market.collateral_issuer,
          collateralAssetId: market.collateral_issuer,
          debtCurrency: getAssetSymbol(market.debt_currency),
          debtIssuer: market.debt_issuer,
          debtAssetId: market.debt_issuer,
          maxLtvRatio: market.max_ltv_ratio,
          liquidationLtvRatio: market.liquidation_ltv_ratio,
          baseInterestRate: market.base_interest_rate,
          collateralLockEnabled: true,
          minSupplyAmount: market.min_supply_amount,
          liquidityPoolId: market.liquidity_pool_id,
          liquidityReferenceId: market.liquidity_pool_id,
          positionTokenAssetId: market.position_token_asset_id,
          liquidityShareScale: market.liquidity_share_scale,
          reserveFactor: market.reserve_factor,
          loanTermMonths: DEFAULT_LOAN_TERM_MONTHS,
          totalSupplied: market.total_supplied,
          totalBorrowed: market.total_borrowed,
          globalYieldIndex: market.global_yield_index,
          prices: prices
            ? {
                collateralPriceUsd: prices.collateralPriceUsd,
                debtPriceUsd: prices.debtPriceUsd,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        markets: marketsWithPrices,
        treasuryAddress,
        operatorAddress,
        issuerAddress: treasuryAddress,
        backendAddress: operatorAddress,
        chain: chainConfig.chain,
        network: chainConfig.network,
        rpcUrl: chainConfig.rpcUrl,
        explorerUrl: chainConfig.explorerUrl,
        chainConfig,
        assetDefinitions,
      },
    });
  } catch (error) {
    console.error('Lending config error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load configuration',
        },
      },
      { status: 500 }
    );
  }
}
