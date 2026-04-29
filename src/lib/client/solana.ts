import bs58 from 'bs58';
import Decimal from 'decimal.js';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type Commitment,
  type TransactionInstruction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import {
  buildSolanaExplorerUrl,
  getSolanaCommitment,
  getSolanaRpcUrl,
} from '@/lib/config/runtime';

export interface SolanaWalletInfo {
  address: string;
  secretKey: string;
}

export interface SolAirdropResult {
  signature: string;
  lamports: number;
  solAmount: number;
  explorerUrl: string;
}

export interface SolBalance {
  lamports: number;
  solAmount: number;
}

export interface SplTokenBalance {
  mintAddress: string;
  ataAddress: string;
  amount: string;
  decimals: number;
  uiAmount: string;
}

export interface SplTokenTransferResult {
  signature: string;
  explorerUrl: string;
  mintAddress: string;
  sourceTokenAddress: string;
  destinationTokenAddress: string;
  amount: string;
  rawAmount: string;
  decimals: number;
}

export interface SolTransferResult {
  signature: string;
  explorerUrl: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  rawAmount: string;
}

export interface SolBalanceConnection {
  getBalance(address: PublicKey, commitment?: Commitment): Promise<number>;
}

export interface SplTokenBalanceConnection {
  getTokenAccountBalance(
    address: PublicKey,
    commitment?: Commitment
  ): Promise<{
    value: {
      amount: string;
      decimals: number;
      uiAmountString?: string | null;
    };
  }>;
}

export interface SplTokenAccountStatusConnection {
  getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<unknown | null>;
}

let connectionInstance: Connection | null = null;
const RPC_RETRY_DELAYS_MS = [500, 1_000, 2_000, 4_000] as const;
const SIGNATURE_CONFIRMATION_TIMEOUT_MS = 90_000;

export function getSolanaConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(getSolanaRpcUrl(), getSolanaCommitment());
  }

  return connectionInstance;
}

export function serializeSecretKey(secretKey: Uint8Array): string {
  return bs58.encode(secretKey);
}

export function deserializeSecretKey(secretKey: string): Uint8Array {
  return bs58.decode(secretKey);
}

export function generateSolanaWallet(): SolanaWalletInfo {
  const wallet = Keypair.generate();
  return {
    address: wallet.publicKey.toBase58(),
    secretKey: serializeSecretKey(wallet.secretKey),
  };
}

export function getSolanaWalletFromSecretKey(secretKey: string): SolanaWalletInfo {
  const wallet = Keypair.fromSecretKey(deserializeSecretKey(secretKey));
  return {
    address: wallet.publicKey.toBase58(),
    secretKey,
  };
}

export function getSolanaKeypairFromSecretKey(secretKey: string): Keypair {
  return Keypair.fromSecretKey(deserializeSecretKey(secretKey));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRpcRateLimitError(error: unknown): boolean {
  return error instanceof Error && /429|too many requests/i.test(error.message);
}

async function withRpcRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RPC_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRpcRateLimitError(error) || attempt === RPC_RETRY_DELAYS_MS.length) {
        throw error;
      }
      await sleep(RPC_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('RPC request failed');
}

async function waitForConfirmedSignature(
  connection: Connection,
  signature: string,
  timeoutMs = SIGNATURE_CONFIRMATION_TIMEOUT_MS
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await withRpcRetry(() => connection.getSignatureStatuses([signature]));
    const status = response.value[0];

    if (status?.err) {
      throw new Error(`Transaction ${signature} failed: ${JSON.stringify(status.err)}`);
    }

    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      return;
    }

    await sleep(status ? 1_000 : 2_000);
  }

  throw new Error(`Timed out while waiting for transaction confirmation: ${signature}`);
}

async function sendTransactionWithConfirmation(params: {
  connection?: Connection;
  payer: Keypair;
  instructions: TransactionInstruction[];
}): Promise<string> {
  const connection = params.connection ?? getSolanaConnection();
  const latestBlockhash = await withRpcRetry(() =>
    connection.getLatestBlockhash(getSolanaCommitment())
  );

  const transaction = new Transaction({
    feePayer: params.payer.publicKey,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  for (const instruction of params.instructions) {
    transaction.add(instruction);
  }

  transaction.sign(params.payer);

  const signature = await withRpcRetry(() =>
    connection.sendRawTransaction(transaction.serialize(), {
      preflightCommitment: getSolanaCommitment(),
    })
  );

  await waitForConfirmedSignature(connection, signature);
  return signature;
}

export async function requestSolAirdrop(
  address: string,
  solAmount = 1,
  connection: Connection = getSolanaConnection()
): Promise<SolAirdropResult> {
  const publicKey = new PublicKey(address);
  const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);
  const signature = await withRpcRetry(() => connection.requestAirdrop(publicKey, lamports));
  await waitForConfirmedSignature(connection, signature);

  return {
    signature,
    lamports,
    solAmount: lamports / LAMPORTS_PER_SOL,
    explorerUrl: buildSolanaExplorerUrl('tx', signature),
  };
}

export async function getSolBalance(
  address: string,
  connection: SolBalanceConnection = getSolanaConnection()
): Promise<SolBalance> {
  const lamports = await withRpcRetry(() =>
    connection.getBalance(new PublicKey(address), getSolanaCommitment())
  );
  return {
    lamports,
    solAmount: lamports / LAMPORTS_PER_SOL,
  };
}

export async function getSplTokenBalance(
  ownerAddress: string,
  mintAddress: string,
  connection: SplTokenBalanceConnection = getSolanaConnection()
): Promise<SplTokenBalance> {
  const owner = new PublicKey(ownerAddress);
  const mint = new PublicKey(mintAddress);
  const ata = getAssociatedTokenAddressSync(mint, owner);

  try {
    const balance = await withRpcRetry(() =>
      connection.getTokenAccountBalance(ata, getSolanaCommitment())
    );
    return {
      mintAddress: mint.toBase58(),
      ataAddress: ata.toBase58(),
      amount: balance.value.amount,
      decimals: balance.value.decimals,
      uiAmount: balance.value.uiAmountString ?? '0',
    };
  } catch {
    return {
      mintAddress: mint.toBase58(),
      ataAddress: ata.toBase58(),
      amount: '0',
      decimals: 0,
      uiAmount: '0',
    };
  }
}

export async function getSplTokenBalances(
  ownerAddress: string,
  mintAddresses: string[],
  connection: SplTokenBalanceConnection = getSolanaConnection()
): Promise<SplTokenBalance[]> {
  const balances: SplTokenBalance[] = [];

  for (const mintAddress of mintAddresses) {
    balances.push(await getSplTokenBalance(ownerAddress, mintAddress, connection));
  }

  return balances;
}

export async function hasSplTokenAccount(
  ownerAddress: string,
  mintAddress: string,
  connection: SplTokenAccountStatusConnection = getSolanaConnection()
): Promise<boolean> {
  const owner = new PublicKey(ownerAddress);
  const mint = new PublicKey(mintAddress);
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const accountInfo = await withRpcRetry(() =>
    connection.getAccountInfo(ata, getSolanaCommitment())
  );
  return Boolean(accountInfo);
}

function toRawTokenAmount(amount: string, decimals: number): bigint {
  const scaled = new Decimal(amount).mul(new Decimal(10).pow(decimals));
  if (!scaled.isInteger()) {
    throw new Error(`Amount ${amount} exceeds supported precision for token with ${decimals} decimals`);
  }
  return BigInt(scaled.toFixed(0));
}

export async function transferSplToken(
  ownerSecretKey: string,
  destinationAddress: string,
  mintAddress: string,
  amount: string,
  connection: Connection = getSolanaConnection()
): Promise<SplTokenTransferResult> {
  const owner = getSolanaKeypairFromSecretKey(ownerSecretKey);
  const destination = new PublicKey(destinationAddress);
  const mint = new PublicKey(mintAddress);
  const mintInfo = await withRpcRetry(() => getMint(connection, mint, getSolanaCommitment()));
  const sourceTokenAddress = getAssociatedTokenAddressSync(mint, owner.publicKey);
  const destinationTokenAddress = getAssociatedTokenAddressSync(mint, destination);
  const rawAmount = toRawTokenAmount(amount, mintInfo.decimals);

  const signature = await sendTransactionWithConfirmation({
    connection,
    payer: owner,
    instructions: [
      createAssociatedTokenAccountIdempotentInstruction(
        owner.publicKey,
        destinationTokenAddress,
        destination,
        mint
      ),
      createTransferCheckedInstruction(
        sourceTokenAddress,
        mint,
        destinationTokenAddress,
        owner.publicKey,
        rawAmount,
        mintInfo.decimals
      ),
    ],
  });

  return {
    signature,
    explorerUrl: buildSolanaExplorerUrl('tx', signature),
    mintAddress: mint.toBase58(),
    sourceTokenAddress: sourceTokenAddress.toBase58(),
    destinationTokenAddress: destinationTokenAddress.toBase58(),
    amount,
    rawAmount: rawAmount.toString(),
    decimals: mintInfo.decimals,
  };
}

export async function transferSol(
  ownerSecretKey: string,
  destinationAddress: string,
  amount: string,
  connection: Connection = getSolanaConnection()
): Promise<SolTransferResult> {
  const owner = getSolanaKeypairFromSecretKey(ownerSecretKey);
  const destination = new PublicKey(destinationAddress);
  const lamports = toRawTokenAmount(amount, 9);
  const signature = await sendTransactionWithConfirmation({
    connection,
    payer: owner,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: owner.publicKey,
        toPubkey: destination,
        lamports,
      }),
    ],
  });

  return {
    signature,
    explorerUrl: buildSolanaExplorerUrl('tx', signature),
    sourceAddress: owner.publicKey.toBase58(),
    destinationAddress: destination.toBase58(),
    amount,
    rawAmount: lamports.toString(),
  };
}
