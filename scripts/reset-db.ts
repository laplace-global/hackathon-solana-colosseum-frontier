/**
 * Database Reset Script
 *
 * Truncates application data tables and reseeds the default Solana MVP markets.
 *
 * Required env vars:
 * - DATABASE_URL
 *
 * Optional env vars:
 * - SAIL_MINT_ADDRESS
 * - NYRA_MINT_ADDRESS
 * - USDC_MINT_ADDRESS
 *
 * Run with: pnpm db:reset
 * Non-interactive: pnpm db:reset:yes
 */

import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import * as path from 'path';
import { stdin as input, stdout as output } from 'process';
import { createInterface } from 'readline/promises';
import { APP_DEFAULTS } from '../src/lib/config/defaults';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const RESET_TABLES = [
  '"app_events"',
  '"positions"',
  '"supply_positions"',
  '"price_oracle"',
  '"purchase_orders"',
  '"onchain_transactions"',
  '"users"',
  '"markets"',
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not configured`);
  }
  return value.trim();
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

function getDatabaseLabel(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    const database = parsed.pathname.replace(/^\//, '') || '(default database)';
    return `${parsed.hostname}/${database}`;
  } catch {
    return '(configured database)';
  }
}

async function confirmReset(databaseLabel: string) {
  const args = new Set(process.argv.slice(2));
  if (args.has('--yes') || args.has('-y')) {
    return;
  }

  if (!input.isTTY) {
    throw new Error('Database reset requires an interactive terminal or --yes.');
  }

  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question(
      `This will delete application data in ${databaseLabel} and reseed demo markets. Type RESET to continue: `
    );

    if (answer !== 'RESET') {
      console.log('Database reset aborted.');
      process.exit(0);
    }
  } finally {
    readline.close();
  }
}

async function main() {
  const databaseUrl = requireEnv('DATABASE_URL');
  const databaseLabel = getDatabaseLabel(databaseUrl);
  await confirmReset(databaseLabel);

  const { db } = await import('../src/lib/db');
  const { seedMarket } = await import('../src/lib/db/seed');

  console.log('='.repeat(60));
  console.log('Database Reset (Solana MVP)');
  console.log('='.repeat(60));
  console.log(`Target: ${databaseLabel}`);
  console.log();

  await db.execute(sql.raw(`TRUNCATE TABLE ${RESET_TABLES.join(', ')} RESTART IDENTITY CASCADE`));
  console.log('Application data tables truncated.');

  const marketId = await seedMarket({
    sailMintAddress: optionalEnv('SAIL_MINT_ADDRESS') ?? APP_DEFAULTS.demoMintAddresses.SAIL,
    nyraMintAddress: optionalEnv('NYRA_MINT_ADDRESS') ?? APP_DEFAULTS.demoMintAddresses.NYRA,
    usdcMintAddress: optionalEnv('USDC_MINT_ADDRESS') ?? APP_DEFAULTS.demoMintAddresses.USDC,
  });

  console.log(`Primary market ID: ${marketId}`);
  console.log('Database reset complete.');
}

void main().catch((error) => {
  console.error('Error resetting database:', error);
  process.exit(1);
});
