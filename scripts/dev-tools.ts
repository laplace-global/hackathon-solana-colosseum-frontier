/**
 * Dev Tools — Interactive / CLI utility script for local Solana operations
 *
 * Interactive menu:
 *   1. Generate wallet (keypair)
 *   2. SOL airdrop
 *   3. Create SPL token (mint)
 *   4. Mint tokens to wallet
 *   5. Transfer SPL tokens
 *   6. Check balances
 *   7. Generate protocol service accounts
 *   8. Create standard demo mint set (SAIL / NYRA / USDC)
 *   9. Show service accounts / config
 *
 * CLI examples:
 *   npx tsx scripts/dev-tools.ts protocol-accounts
 *   npx tsx scripts/dev-tools.ts protocol-accounts --json
 *   npx tsx scripts/dev-tools.ts airdrop --address <wallet> --amount 2
 *   npx tsx scripts/dev-tools.ts demo-mints --payer-secret <bs58>
 *
 * Run interactive menu with:
 *   npx tsx scripts/dev-tools.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';
import bs58 from 'bs58';
import Decimal from 'decimal.js';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotent,
  createMint,
  getAssociatedTokenAddressSync,
  getMint,
  mintTo,
  transferChecked,
} from '@solana/spl-token';
import { APP_DEFAULTS } from '../src/lib/config/defaults';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

type CommitmentLevel = 'confirmed' | 'finalized';

interface ProtocolAccountConfig {
  role: 'TREASURY' | 'OPERATOR' | 'FAUCET';
  label: string;
  secretEnv: string;
  addressEnv: string;
  legacySecretEnv?: string[];
  legacyAddressEnv?: string[];
}

interface GeneratedProtocolAccount extends ProtocolAccountConfig {
  address: string;
  secret: string;
}

interface DemoMintConfig {
  symbol: 'SAIL' | 'NYRA' | 'USDC';
  envKey: string;
  treasuryBootstrapAmount: string;
  faucetBootstrapAmount: string;
}

interface DemoMintResult {
  symbol: DemoMintConfig['symbol'];
  mintAddress: string;
  decimals: number;
  treasuryAmount: string | null;
  faucetAmount: string | null;
}

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || APP_DEFAULTS.solana.rpcUrl;
const COMMITMENT =
  (process.env.NEXT_PUBLIC_SOLANA_COMMITMENT as CommitmentLevel | undefined) ||
  APP_DEFAULTS.solana.commitment;
const EXPLORER_BASE = process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || APP_DEFAULTS.solana.explorerUrl;
const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || APP_DEFAULTS.solana.cluster;

const PROTOCOL_ACCOUNT_CONFIGS: ProtocolAccountConfig[] = [
  {
    role: 'TREASURY',
    label: 'Treasury',
    secretEnv: 'TREASURY_WALLET_SECRET',
    addressEnv: 'TREASURY_ADDRESS',
    legacySecretEnv: ['TREASURY_SECRET', 'ISSUER_WALLET_SECRET', 'ISSUER_WALLET_SEED'],
    legacyAddressEnv: ['ISSUER_ADDRESS'],
  },
  {
    role: 'OPERATOR',
    label: 'Operator',
    secretEnv: 'OPERATOR_WALLET_SECRET',
    addressEnv: 'OPERATOR_ADDRESS',
    legacySecretEnv: ['OPERATOR_SECRET', 'BACKEND_WALLET_SECRET', 'BACKEND_WALLET_SEED'],
    legacyAddressEnv: ['BACKEND_ADDRESS'],
  },
  {
    role: 'FAUCET',
    label: 'Faucet',
    secretEnv: 'FAUCET_WALLET_SECRET',
    addressEnv: 'FAUCET_ADDRESS',
    legacySecretEnv: ['FAUCET_SECRET'],
    legacyAddressEnv: [],
  },
];

const DEMO_MINT_CONFIGS: DemoMintConfig[] = [
  {
    symbol: 'SAIL',
    envKey: 'SAIL_MINT_ADDRESS',
    treasuryBootstrapAmount: '2000',
    faucetBootstrapAmount: '200',
  },
  {
    symbol: 'NYRA',
    envKey: 'NYRA_MINT_ADDRESS',
    treasuryBootstrapAmount: '2000',
    faucetBootstrapAmount: '200',
  },
  {
    symbol: 'USDC',
    envKey: 'USDC_MINT_ADDRESS',
    treasuryBootstrapAmount: '200000',
    faucetBootstrapAmount: '10000',
  },
];

function explorerUrl(kind: 'address' | 'tx', value: string): string {
  return `${EXPLORER_BASE.replace(/\/+$/, '')}/${kind}/${value}?cluster=${CLUSTER}`;
}

let connection: Connection | null = null;
function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, COMMITMENT);
  }
  return connection;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function askWithDefault(prompt: string, defaultValue: string): Promise<string> {
  const answer = await ask(`${prompt} [${defaultValue}]: `);
  return answer || defaultValue;
}

async function askYesNo(prompt: string, defaultYes: boolean): Promise<boolean> {
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = (await ask(`${prompt} ${suffix}: `)).toLowerCase();
  if (!answer) return defaultYes;
  return answer === 'y' || answer === 'yes';
}

function parseKeypair(secret: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(secret));
}

function parsePublicKey(value: string): PublicKey {
  return new PublicKey(value);
}

async function askKeypair(prompt: string): Promise<Keypair> {
  while (true) {
    const secret = await ask(prompt);
    try {
      return parseKeypair(secret);
    } catch {
      console.log('  Invalid secret key. Please enter a bs58-encoded secret key.');
    }
  }
}

async function askPublicKey(prompt: string): Promise<PublicKey> {
  while (true) {
    const input = await ask(prompt);
    try {
      return parsePublicKey(input);
    } catch {
      console.log('  Invalid address. Please enter a valid Solana address.');
    }
  }
}

function separator() {
  console.log('-'.repeat(60));
}

function header(title: string) {
  console.log();
  separator();
  console.log(`  ${title}`);
  separator();
}

function toRawAmount(amount: string | number, decimals: number): bigint {
  return BigInt(
    new Decimal(amount)
      .mul(new Decimal(10).pow(decimals))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toFixed(0)
  );
}

function readFirstEnv(names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function resolveConfiguredAddress(config: ProtocolAccountConfig): string | null {
  const explicitAddress = readFirstEnv([config.addressEnv, ...(config.legacyAddressEnv ?? [])]);
  if (explicitAddress) {
    return explicitAddress;
  }

  const secret = readFirstEnv([config.secretEnv, ...(config.legacySecretEnv ?? [])]);
  if (!secret) {
    return null;
  }

  try {
    return parseKeypair(secret).publicKey.toBase58();
  } catch {
    return null;
  }
}

function generateProtocolAccountsBundle(): GeneratedProtocolAccount[] {
  return PROTOCOL_ACCOUNT_CONFIGS.map((config) => {
    const keypair = Keypair.generate();
    return {
      ...config,
      address: keypair.publicKey.toBase58(),
      secret: bs58.encode(keypair.secretKey),
    };
  });
}

function printProtocolAccounts(bundle: GeneratedProtocolAccount[]) {
  console.log();
  console.log('  Generated protocol service accounts:');
  console.log();

  for (const account of bundle) {
    console.log(`  ${account.label}`);
    console.log(`    Address: ${account.address}`);
    console.log(`    Secret:  ${account.secret}`);
    console.log(`    Explorer: ${explorerUrl('address', account.address)}`);
    console.log();
  }

  console.log('  Suggested .env.local snippet:');
  console.log();
  for (const account of bundle) {
    console.log(`  ${account.secretEnv}=${account.secret}`);
    console.log(`  ${account.addressEnv}=${account.address}`);
  }
}

async function requestSolAirdrop(address: PublicKey, amount: number) {
  const conn = getConnection();
  const signature = await conn.requestAirdrop(address, Math.round(amount * LAMPORTS_PER_SOL));
  await conn.confirmTransaction(signature, COMMITMENT);
  return signature;
}

async function transferSol(
  sender: Keypair,
  destination: PublicKey,
  solAmount: number
): Promise<string> {
  const conn = getConnection();
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: destination,
      lamports: Math.round(solAmount * LAMPORTS_PER_SOL),
    })
  );
  return sendAndConfirmTransaction(conn, tx, [sender], { commitment: COMMITMENT });
}

async function generateWallet() {
  header('Generate Wallet (Keypair)');
  const kp = Keypair.generate();
  const address = kp.publicKey.toBase58();
  const secret = bs58.encode(kp.secretKey);

  console.log();
  console.log(`  Address:    ${address}`);
  console.log(`  Secret Key: ${secret}`);
  console.log();
  console.log(`  Explorer: ${explorerUrl('address', address)}`);
  console.log();
  console.log('  ** Save the secret key securely — it cannot be recovered. **');
}

async function solAirdrop() {
  header('SOL Airdrop (Devnet)');
  const address = await askPublicKey('  Wallet address: ');
  const amount = Number(await askWithDefault('  SOL amount', '2'));

  if (isNaN(amount) || amount <= 0) {
    console.log('  Invalid amount.');
    return;
  }

  console.log(`  Requesting ${amount} SOL airdrop...`);
  try {
    const signature = await requestSolAirdrop(address, amount);
    console.log('  Airdrop confirmed!');
    console.log(`  Signature: ${signature}`);
    console.log(`  Explorer:  ${explorerUrl('tx', signature)}`);
  } catch (err) {
    console.error('  Airdrop failed:', (err as Error).message);
  }
}

async function createToken() {
  header('Create SPL Token (Mint)');
  console.log('  The payer wallet will be the mint authority.');
  console.log();
  const payer = await askKeypair('  Payer secret key (bs58): ');
  const decimals = Number(await askWithDefault('  Token decimals', '8'));

  if (isNaN(decimals) || decimals < 0 || decimals > 18) {
    console.log('  Invalid decimals (0-18).');
    return;
  }

  console.log(`  Creating token with ${decimals} decimals...`);
  try {
    const conn = getConnection();
    const mint = await createMint(
      conn,
      payer,
      payer.publicKey,
      payer.publicKey,
      decimals
    );
    console.log();
    console.log(`  Mint Address: ${mint.toBase58()}`);
    console.log(`  Authority:    ${payer.publicKey.toBase58()}`);
    console.log(`  Decimals:     ${decimals}`);
    console.log(`  Explorer:     ${explorerUrl('address', mint.toBase58())}`);
  } catch (err) {
    console.error('  Token creation failed:', (err as Error).message);
  }
}

async function mintTokens() {
  header('Mint Tokens');
  const authority = await askKeypair('  Mint authority secret key (bs58): ');
  const mintAddress = await askPublicKey('  Mint address: ');
  const destination = await askPublicKey('  Destination wallet address: ');
  const amount = await ask('  Amount (display units, e.g. 1000): ');

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    console.log('  Invalid amount.');
    return;
  }

  console.log('  Minting...');
  try {
    const conn = getConnection();
    const mintInfo = await getMint(conn, mintAddress, COMMITMENT);
    const ata = await createAssociatedTokenAccountIdempotent(
      conn,
      authority,
      mintAddress,
      destination
    );

    const rawAmount = toRawAmount(amount, mintInfo.decimals);
    const signature = await mintTo(
      conn,
      authority,
      mintAddress,
      ata,
      authority,
      rawAmount
    );

    console.log();
    console.log(`  Minted ${amount} tokens to ${destination.toBase58()}`);
    console.log(`  ATA:       ${ata.toBase58()}`);
    console.log(`  Signature: ${signature}`);
    console.log(`  Explorer:  ${explorerUrl('tx', signature)}`);
  } catch (err) {
    console.error('  Minting failed:', (err as Error).message);
  }
}

async function sendSol() {
  header('Transfer SOL');
  const sender = await askKeypair('  Sender secret key (bs58): ');
  const destination = await askPublicKey('  Destination address: ');
  const amount = Number(await askWithDefault('  SOL amount', '1'));

  if (isNaN(amount) || amount <= 0) {
    console.log('  Invalid amount.');
    return;
  }

  console.log(`  Transferring ${amount} SOL...`);
  try {
    const signature = await transferSol(sender, destination, amount);
    console.log();
    console.log(`  Transferred ${amount} SOL`);
    console.log(`  From: ${sender.publicKey.toBase58()}`);
    console.log(`  To:   ${destination.toBase58()}`);
    console.log(`  Signature: ${signature}`);
    console.log(`  Explorer:  ${explorerUrl('tx', signature)}`);
  } catch (err) {
    console.error('  SOL transfer failed:', (err as Error).message);
  }
}

async function transferTokens() {
  header('Transfer SPL Tokens');
  const sender = await askKeypair('  Sender secret key (bs58): ');
  const mintAddress = await askPublicKey('  Mint address: ');
  const destination = await askPublicKey('  Destination address: ');
  const amount = await ask('  Amount (display units): ');

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    console.log('  Invalid amount.');
    return;
  }

  console.log('  Transferring...');
  try {
    const conn = getConnection();
    const mintInfo = await getMint(conn, mintAddress, COMMITMENT);
    const sourceAta = getAssociatedTokenAddressSync(mintAddress, sender.publicKey);
    const destAta = await createAssociatedTokenAccountIdempotent(
      conn,
      sender,
      mintAddress,
      destination
    );

    const rawAmount = toRawAmount(amount, mintInfo.decimals);
    const signature = await transferChecked(
      conn,
      sender,
      sourceAta,
      mintAddress,
      destAta,
      sender,
      rawAmount,
      mintInfo.decimals
    );

    console.log();
    console.log(`  Transferred ${amount} tokens`);
    console.log(`  From: ${sender.publicKey.toBase58()}`);
    console.log(`  To:   ${destination.toBase58()}`);
    console.log(`  Signature: ${signature}`);
    console.log(`  Explorer:  ${explorerUrl('tx', signature)}`);
  } catch (err) {
    console.error('  Token transfer failed:', (err as Error).message);
  }
}

async function checkBalances() {
  header('Check Balances');
  const address = await askPublicKey('  Wallet address: ');

  try {
    const conn = getConnection();
    const lamports = await conn.getBalance(address, COMMITMENT);
    console.log();
    console.log(`  SOL: ${lamports / LAMPORTS_PER_SOL}`);

    const knownMints: { symbol: string; address: string }[] = [];
    for (const config of DEMO_MINT_CONFIGS) {
      const addr = process.env[config.envKey];
      if (addr && addr.trim()) {
        knownMints.push({ symbol: config.symbol, address: addr.trim() });
      }
    }

    const custom = await ask('  Additional mint address to check (empty to skip): ');
    if (custom) {
      try {
        parsePublicKey(custom);
        knownMints.push({ symbol: 'CUSTOM', address: custom });
      } catch {
        console.log('  Invalid mint address, skipping.');
      }
    }

    for (const mint of knownMints) {
      try {
        const ata = getAssociatedTokenAddressSync(parsePublicKey(mint.address), address);
        const balance = await conn.getTokenAccountBalance(ata, COMMITMENT);
        console.log(`  ${mint.symbol}: ${balance.value.uiAmountString ?? '0'} (mint: ${mint.address})`);
      } catch {
        console.log(`  ${mint.symbol}: 0 (no account)`);
      }
    }

    console.log();
    console.log(`  Explorer: ${explorerUrl('address', address.toBase58())}`);
  } catch (err) {
    console.error('  Balance check failed:', (err as Error).message);
  }
}

async function generateProtocolAccounts() {
  header('Generate Protocol Service Accounts');
  printProtocolAccounts(generateProtocolAccountsBundle());
}

async function createStandardDemoMintSet(params: {
  payer: Keypair;
  decimals: number;
  treasuryAddress: PublicKey | null;
  faucetAddress: PublicKey | null;
  bootstrapBalances: boolean;
}): Promise<DemoMintResult[]> {
  const conn = getConnection();
  const results: DemoMintResult[] = [];

  for (const config of DEMO_MINT_CONFIGS) {
    const mint = await createMint(
      conn,
      params.payer,
      params.payer.publicKey,
      params.payer.publicKey,
      params.decimals
    );

    let treasuryAmount: string | null = null;
    let faucetAmount: string | null = null;

    if (params.bootstrapBalances && params.treasuryAddress) {
      const treasuryAta = await createAssociatedTokenAccountIdempotent(
        conn,
        params.payer,
        mint,
        params.treasuryAddress
      );
      await mintTo(
        conn,
        params.payer,
        mint,
        treasuryAta,
        params.payer,
        toRawAmount(config.treasuryBootstrapAmount, params.decimals)
      );
      treasuryAmount = config.treasuryBootstrapAmount;
    }

    if (params.bootstrapBalances && params.faucetAddress) {
      const faucetAta = await createAssociatedTokenAccountIdempotent(
        conn,
        params.payer,
        mint,
        params.faucetAddress
      );
      await mintTo(
        conn,
        params.payer,
        mint,
        faucetAta,
        params.payer,
        toRawAmount(config.faucetBootstrapAmount, params.decimals)
      );
      faucetAmount = config.faucetBootstrapAmount;
    }

    results.push({
      symbol: config.symbol,
      mintAddress: mint.toBase58(),
      decimals: params.decimals,
      treasuryAmount,
      faucetAmount,
    });
  }

  return results;
}

function printDemoMintResults(results: DemoMintResult[]) {
  console.log();
  console.log('  Demo mint set created:');
  console.log();

  for (const result of results) {
    console.log(`  ${result.symbol}`);
    console.log(`    Mint: ${result.mintAddress}`);
    console.log(`    Decimals: ${result.decimals}`);
    console.log(`    Explorer: ${explorerUrl('address', result.mintAddress)}`);
    if (result.treasuryAmount) {
      console.log(`    Treasury bootstrap: ${result.treasuryAmount}`);
    }
    if (result.faucetAmount) {
      console.log(`    Faucet bootstrap:   ${result.faucetAmount}`);
    }
    console.log();
  }

  console.log('  Suggested .env.local snippet:');
  console.log();
  for (const result of results) {
    const config = DEMO_MINT_CONFIGS.find((item) => item.symbol === result.symbol);
    if (config) {
      console.log(`  ${config.envKey}=${result.mintAddress}`);
    }
  }
}

async function createDemoMintSet() {
  header('Create Standard Demo Mint Set');
  console.log('  Creates SAIL / NYRA / USDC and optionally bootstraps Treasury / Faucet balances.');
  console.log();

  const payer = await askKeypair('  Payer / mint authority secret key (bs58): ');
  const decimals = Number(await askWithDefault('  Token decimals for all demo mints', '8'));
  if (isNaN(decimals) || decimals < 0 || decimals > 18) {
    console.log('  Invalid decimals (0-18).');
    return;
  }

  const bootstrapBalances = await askYesNo(
    '  Mint bootstrap balances to Treasury / Faucet?',
    true
  );

  const configuredTreasury = resolveConfiguredAddress(PROTOCOL_ACCOUNT_CONFIGS[0]);
  const configuredFaucet = resolveConfiguredAddress(PROTOCOL_ACCOUNT_CONFIGS[2]);

  let treasuryAddress: PublicKey | null = null;
  let faucetAddress: PublicKey | null = null;

  if (bootstrapBalances) {
    const treasuryInput = configuredTreasury
      ? await askWithDefault('  Treasury wallet address', configuredTreasury)
      : await ask('  Treasury wallet address (empty to skip): ');
    if (treasuryInput) {
      treasuryAddress = parsePublicKey(treasuryInput);
    }

    const faucetInput = configuredFaucet
      ? await askWithDefault('  Faucet wallet address', configuredFaucet)
      : await ask('  Faucet wallet address (empty to skip): ');
    if (faucetInput) {
      faucetAddress = parsePublicKey(faucetInput);
    }
  }

  console.log('  Creating demo mint set...');
  try {
    const results = await createStandardDemoMintSet({
      payer,
      decimals,
      treasuryAddress,
      faucetAddress,
      bootstrapBalances,
    });
    printDemoMintResults(results);
  } catch (err) {
    console.error('  Demo mint creation failed:', (err as Error).message);
  }
}

async function showServiceAccounts() {
  header('Service Accounts / Config');

  for (const config of PROTOCOL_ACCOUNT_CONFIGS) {
    const address = resolveConfiguredAddress(config);
    console.log(`  ${config.label}: ${address ?? 'not configured'}`);
  }

  console.log();
  for (const { symbol, envKey } of DEMO_MINT_CONFIGS) {
    const value = process.env[envKey];
    console.log(`  ${symbol} Mint: ${value?.trim() || 'not configured'}`);
  }

  console.log();
  console.log(`  RPC URL:  ${RPC_URL}`);
  console.log(`  Cluster:  ${CLUSTER}`);
}

const MENU_ITEMS = [
  { key: '1', label: 'Generate Wallet (Keypair)', action: generateWallet },
  { key: '2', label: 'SOL Airdrop (Devnet)', action: solAirdrop },
  { key: '3', label: 'Create SPL Token (Mint)', action: createToken },
  { key: '4', label: 'Mint Tokens to Wallet', action: mintTokens },
  { key: '5', label: 'Transfer SOL', action: sendSol },
  { key: '6', label: 'Transfer SPL Tokens', action: transferTokens },
  { key: '7', label: 'Check Balances', action: checkBalances },
  { key: '8', label: 'Generate Protocol Service Accounts', action: generateProtocolAccounts },
  { key: '9', label: 'Create Standard Demo Mint Set', action: createDemoMintSet },
  { key: '0', label: 'Show Service Accounts / Config', action: showServiceAccounts },
] as const;

function showMenu() {
  console.log();
  console.log('='.repeat(60));
  console.log('  Laplace Dev Tools (Solana Devnet)');
  console.log('='.repeat(60));
  console.log();
  for (const item of MENU_ITEMS) {
    console.log(`  ${item.key}) ${item.label}`);
  }
  console.log('  q) Quit');
  console.log();
}

function parseCliArgs(argv: string[]) {
  const flags = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith('--')) continue;

    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags.set(key, true);
      continue;
    }

    flags.set(key, next);
    index += 1;
  }

  return flags;
}

function requireStringFlag(flags: Map<string, string | boolean>, name: string): string {
  const value = flags.get(name);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required flag: --${name}`);
  }
  return value.trim();
}

function optionalStringFlag(flags: Map<string, string | boolean>, name: string): string | null {
  const value = flags.get(name);
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function hasFlag(flags: Map<string, string | boolean>, name: string): boolean {
  return flags.has(name);
}

function printCliUsage() {
  console.log(`
Laplace Dev Tools CLI

Commands:
  protocol-accounts [--json]
  airdrop --address <wallet> [--amount 2]
  demo-mints --payer-secret <bs58> [--decimals 8] [--treasury-address <wallet>] [--faucet-address <wallet>] [--skip-bootstrap] [--json]
`);
}

async function runCliCommand(): Promise<boolean> {
  const rawArgs = process.argv.slice(2);
  const normalizedArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
  const [command, ...rest] = normalizedArgs;
  if (!command) {
    return false;
  }

  const flags = parseCliArgs(rest);

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printCliUsage();
      return true;

    case 'protocol-accounts': {
      const bundle = generateProtocolAccountsBundle();
      if (hasFlag(flags, 'json')) {
        console.log(JSON.stringify(bundle, null, 2));
      } else {
        printProtocolAccounts(bundle);
      }
      return true;
    }

    case 'airdrop': {
      const address = parsePublicKey(requireStringFlag(flags, 'address'));
      const amount = Number(optionalStringFlag(flags, 'amount') ?? '2');
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Flag --amount must be a positive number');
      }

      const signature = await requestSolAirdrop(address, amount);
      console.log(JSON.stringify({
        address: address.toBase58(),
        amount,
        signature,
        explorerUrl: explorerUrl('tx', signature),
      }, null, 2));
      return true;
    }

    case 'demo-mints': {
      const payer = parseKeypair(requireStringFlag(flags, 'payer-secret'));
      const decimals = Number(optionalStringFlag(flags, 'decimals') ?? '8');
      if (!Number.isFinite(decimals) || decimals < 0 || decimals > 18) {
        throw new Error('Flag --decimals must be between 0 and 18');
      }

      const bootstrapBalances = !hasFlag(flags, 'skip-bootstrap');
      const treasuryAddress = optionalStringFlag(flags, 'treasury-address') ?? resolveConfiguredAddress(PROTOCOL_ACCOUNT_CONFIGS[0]);
      const faucetAddress = optionalStringFlag(flags, 'faucet-address') ?? resolveConfiguredAddress(PROTOCOL_ACCOUNT_CONFIGS[2]);

      const results = await createStandardDemoMintSet({
        payer,
        decimals,
        treasuryAddress: treasuryAddress ? parsePublicKey(treasuryAddress) : null,
        faucetAddress: faucetAddress ? parsePublicKey(faucetAddress) : null,
        bootstrapBalances,
      });

      if (hasFlag(flags, 'json')) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        printDemoMintResults(results);
      }
      return true;
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function main() {
  while (true) {
    showMenu();
    const choice = await ask('  Select: ');

    if (choice === 'q' || choice === 'Q') {
      console.log('  Bye!');
      rl.close();
      process.exit(0);
    }

    const selected = MENU_ITEMS.find((item) => item.key === choice);
    if (!selected) {
      console.log('  Invalid choice.');
      continue;
    }

    try {
      await selected.action();
    } catch (err) {
      console.error('  Error:', (err as Error).message);
    }
  }
}

async function entrypoint() {
  try {
    const handled = await runCliCommand();
    if (handled) {
      rl.close();
      return;
    }

    await main();
  } catch (error) {
    console.error((error as Error).message);
    rl.close();
    process.exit(1);
  }
}

void entrypoint();
