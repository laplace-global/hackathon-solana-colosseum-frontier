/**
 * Database Initialization Script
 *
 * Seeds the default Solana MVP markets and mock oracle prices.
 *
 * Required env vars:
 * - DATABASE_URL
 *
 * Optional env vars:
 * - SAIL_MINT_ADDRESS
 * - NYRA_MINT_ADDRESS
 * - ZAABEL_MINT_ADDRESS
 * - BURJV_MINT_ADDRESS
 * - AMANT_MINT_ADDRESS
 * - LEMARAIS_MINT_ADDRESS
 * - PARK432_MINT_ADDRESS
 * - USDC_MINT_ADDRESS
 *
 * Run with: pnpm db:seed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { getDemoTokenMintAddresses } from '../src/lib/assets/demo-token-assets';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not configured`);
  }
  return value.trim();
}

async function main() {
  requireEnv('DATABASE_URL');

  const {
    buildDefaultMarketConfigs,
    seedMarket,
    getMarketByName,
    getMarketPrices,
  } = await import('../src/lib/db/seed');

  console.log('='.repeat(60));
  console.log('Database Initialization (Solana MVP)');
  console.log('='.repeat(60));
  console.log();

  try {
    const demoMintAddresses = getDemoTokenMintAddresses();
    const defaultMarkets = buildDefaultMarketConfigs(demoMintAddresses);
    const marketId = await seedMarket(demoMintAddresses);

    console.log(`Primary market ID: ${marketId}`);
    console.log();

    for (const { name } of defaultMarkets) {
      const market = await getMarketByName(name);
      if (!market) {
        throw new Error(`Market ${name} was not created successfully`);
      }

      console.log('Market Configuration:');
      console.log(`  Name: ${market.name}`);
      console.log(`  Collateral Symbol: ${market.collateral_currency}`);
      console.log(`  Collateral Mint: ${market.collateral_issuer}`);
      console.log(`  Debt Symbol: ${market.debt_currency}`);
      console.log(`  Debt Mint: ${market.debt_issuer}`);
      console.log(`  Max LTV: ${market.max_ltv_ratio * 100}%`);
      console.log(`  Liquidation LTV: ${market.liquidation_ltv_ratio * 100}%`);
      console.log(`  Interest Rate: ${market.base_interest_rate * 100}% annual`);
      console.log(`  Liquidation Penalty: ${market.liquidation_penalty * 100}%`);

      const prices = await getMarketPrices(market.id);
      if (prices) {
        console.log('Price Oracle:');
        console.log(`  COLLATERAL: $${prices.collateralPriceUsd}`);
        console.log(`  DEBT: $${prices.debtPriceUsd}`);
      }

      console.log();
    }

    console.log('Database initialization complete.');
    console.log('Next steps:');
    console.log('  1. pnpm dev');
    console.log('  2. Open /admin and generate a local Solana wallet');
    console.log('  3. Use onramp / purchase / lend / borrow flows to prepare demo balances');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

void main();
