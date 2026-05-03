import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, onchainTransactions, purchaseOrders } from '@/lib/db';
import { getAllActiveMarkets } from '@/lib/db/seed';
import {
  getAssetBySymbol,
  isValidChainAddress,
  restoreLocalAccount,
  transferAsset,
} from '@/lib/chain/client';
import { buildAssetDefinitions } from '@/lib/chain/config';
import { getTreasuryAccount, getTreasuryAddress } from '@/lib/chain/service-account';

const RWA_SYMBOL_BY_HOTEL_ID: Record<string, 'SAIL' | 'NYRA'> = {
  'the-sail': 'SAIL',
  nyra: 'NYRA',
};

type PurchaseStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'TOKEN_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

type PaymentMethod = 'wallet' | 'card' | 'wire';

function parsePositiveNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseAccountSecret(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length >= 10 ? value.trim() : null;
}

function parsePaymentMethod(value: unknown): PaymentMethod {
  if (value === 'card' || value === 'wire') return value;
  return 'wallet';
}

function toErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

async function updateOrderStatus(
  orderId: string,
  status: PurchaseStatus,
  extra?: {
    paymentTxHash?: string | null;
    tokenTxHash?: string | null;
    errorCode?: string;
    errorMessage?: string;
    completedAt?: Date;
  }
): Promise<void> {
  await db
    .update(purchaseOrders)
    .set({
      status,
      paymentTxHash: extra?.paymentTxHash ?? null,
      tokenTxHash: extra?.tokenTxHash ?? null,
      errorCode: extra?.errorCode ?? null,
      errorMessage: extra?.errorMessage ?? null,
      completedAt: extra?.completedAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, orderId));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAddress = body?.userAddress;
    const accountSecret = parseAccountSecret(body?.accountSecret ?? body?.walletSeed);
    const paymentMethod = parsePaymentMethod(body?.paymentMethod);
    const hotelId = typeof body?.hotelId === 'string' ? body.hotelId : '';
    const unitId = typeof body?.unitId === 'string' ? body.unitId : '';
    const tokenAmount = parsePositiveNumber(body?.tokenAmount);
    const pricePerTokenUsd = parsePositiveNumber(body?.pricePerToken);
    const totalPaymentAmount = parsePositiveNumber(body?.totalPrice);
    const idempotencyKey =
      typeof body?.idempotencyKey === 'string' && body.idempotencyKey.trim().length > 0
        ? body.idempotencyKey.trim()
        : randomUUID();

    if (!isValidChainAddress(userAddress)) {
      return toErrorResponse('INVALID_USER_ADDRESS', 'Invalid or missing userAddress', 400);
    }
    if (!hotelId || !unitId) {
      return toErrorResponse('INVALID_PURCHASE_TARGET', 'hotelId and unitId are required', 400);
    }
    if (tokenAmount === null || pricePerTokenUsd === null || totalPaymentAmount === null) {
      return toErrorResponse(
        'INVALID_PURCHASE_AMOUNT',
        'tokenAmount, pricePerToken, and totalPrice must be positive numbers',
        400
      );
    }

    const impliedTotal = tokenAmount * pricePerTokenUsd;
    if (Math.abs(impliedTotal - totalPaymentAmount) > 0.0001) {
      return toErrorResponse(
        'PRICE_MISMATCH',
        `totalPrice must match tokenAmount * pricePerToken (${impliedTotal.toFixed(4)})`,
        400
      );
    }

    const rwaSymbol = RWA_SYMBOL_BY_HOTEL_ID[hotelId];
    if (!rwaSymbol) {
      return toErrorResponse('UNSUPPORTED_HOTEL', `Unsupported hotelId: ${hotelId}`, 400);
    }

    const markets = await getAllActiveMarkets();
    const assetDefinitions = buildAssetDefinitions(markets);
    const treasuryAccount = getTreasuryAccount();
    const treasuryAddress = getTreasuryAddress();
    const paymentAsset = getAssetBySymbol(assetDefinitions, 'USDC');
    const rwaAsset = getAssetBySymbol(assetDefinitions, rwaSymbol);

    if (!paymentAsset || paymentAsset.kind !== 'token' || !paymentAsset.assetId) {
      return toErrorResponse('MISSING_PAYMENT_ASSET', 'USDC asset is not configured', 500);
    }
    if (!rwaAsset || rwaAsset.kind !== 'token' || !rwaAsset.assetId) {
      return toErrorResponse('MISSING_RWA_ASSET', `${rwaSymbol} asset is not configured`, 500);
    }

    const paymentCurrency = paymentMethod === 'wallet' ? paymentAsset.symbol : paymentMethod.toUpperCase();
    const paymentIssuer = paymentMethod === 'wallet' ? paymentAsset.assetId : 'OFFCHAIN';
    const rwaCurrency = rwaAsset.symbol;

    if (paymentMethod === 'wallet') {
      if (!accountSecret) {
        return toErrorResponse('INVALID_ACCOUNT_SECRET', 'Invalid or missing accountSecret', 400);
      }

      let userAccount;
      try {
        userAccount = restoreLocalAccount(accountSecret);
      } catch {
        return toErrorResponse('INVALID_ACCOUNT_SECRET', 'Invalid or missing accountSecret', 400);
      }

      if (userAccount.address !== userAddress) {
        return toErrorResponse('ADDRESS_SECRET_MISMATCH', 'accountSecret does not match userAddress', 400);
      }
    }

    const [insertedOrder] = await db
      .insert(purchaseOrders)
      .values({
        idempotencyKey,
        status: paymentMethod === 'wallet' ? 'PAYMENT_PENDING' : 'PAYMENT_CONFIRMED',
        userAddress,
        hotelId,
        unitId,
        rwaSymbol,
        rwaCurrency,
        rwaIssuer: rwaAsset.assetId,
        paymentCurrency,
        paymentIssuer,
        tokenAmount: tokenAmount.toString(),
        pricePerTokenUsd: pricePerTokenUsd.toString(),
        totalPaymentAmount: totalPaymentAmount.toString(),
      })
      .onConflictDoNothing({ target: purchaseOrders.idempotencyKey })
      .returning();

    const order =
      insertedOrder ??
      (await db.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.idempotencyKey, idempotencyKey),
      }));

    if (!order) {
      return toErrorResponse('ORDER_CREATION_FAILED', 'Failed to create or fetch purchase order', 500);
    }

    if (!insertedOrder) {
      if (order.status === 'COMPLETED') {
        return NextResponse.json({
          success: true,
          data: {
            orderId: order.id,
            idempotencyKey: order.idempotencyKey,
            status: order.status,
            paymentTxHash: order.paymentTxHash,
            tokenTxHash: order.tokenTxHash,
          },
        });
      }

      if (order.status === 'FAILED') {
        return toErrorResponse(
          order.errorCode ?? 'ORDER_FAILED',
          order.errorMessage ?? 'Order previously failed',
          409
        );
      }

      return toErrorResponse('ORDER_IN_PROGRESS', 'Order with this idempotency key is in progress', 409);
    }

    let paymentTxHash: string | null = null;
    if (paymentMethod === 'wallet') {
      if (!accountSecret) {
        await updateOrderStatus(order.id, 'FAILED', {
          errorCode: 'INVALID_ACCOUNT_SECRET',
          errorMessage: 'Invalid or missing accountSecret',
        });
        return toErrorResponse('INVALID_ACCOUNT_SECRET', 'Invalid or missing accountSecret', 400);
      }

      try {
        const paymentTx = await transferAsset({
          sourceSecret: accountSecret,
          destinationAddress: treasuryAddress,
          asset: paymentAsset,
          amount: totalPaymentAmount.toString(),
        });

        paymentTxHash = paymentTx.txHash;
        await db
          .insert(onchainTransactions)
          .values({
            txId: paymentTx.txHash,
            validated: true,
            txResult: 'confirmed',
            txType: 'spl-token-transfer',
            sourceAddress: userAddress,
            destinationAddress: treasuryAddress,
            currency: paymentAsset.symbol,
            issuer: paymentAsset.assetId,
            amount: totalPaymentAmount.toString(),
            rawTxJson: {
              chain: 'solana',
              explorerUrl: paymentTx.explorerUrl,
              rawAmount: paymentTx.rawAmount,
            },
            rawMetaJson: null,
          })
          .onConflictDoNothing({ target: onchainTransactions.txId });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Payment transfer failed';
        await updateOrderStatus(order.id, 'FAILED', {
          errorCode: 'PAYMENT_TX_FAILED',
          errorMessage: message,
        });
        return toErrorResponse('PAYMENT_TX_FAILED', message, 400);
      }
    }

    await updateOrderStatus(order.id, 'TOKEN_PENDING', { paymentTxHash });

    let tokenTxHash: string | null = null;
    try {
      const tokenTx = await transferAsset({
        sourceSecret: treasuryAccount.secret,
        destinationAddress: userAddress,
        asset: rwaAsset,
        amount: tokenAmount.toString(),
      });

      tokenTxHash = tokenTx.txHash;
      await db
        .insert(onchainTransactions)
        .values({
          txId: tokenTx.txHash,
          validated: true,
          txResult: 'confirmed',
          txType: 'spl-token-transfer',
          sourceAddress: treasuryAddress,
          destinationAddress: userAddress,
          currency: rwaCurrency,
          issuer: rwaAsset.assetId,
          amount: tokenAmount.toString(),
          rawTxJson: {
            chain: 'solana',
            explorerUrl: tokenTx.explorerUrl,
            rawAmount: tokenTx.rawAmount,
          },
          rawMetaJson: null,
        })
        .onConflictDoNothing({ target: onchainTransactions.txId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token transfer failed';
      await updateOrderStatus(order.id, 'FAILED', {
        paymentTxHash,
        errorCode: 'TOKEN_TX_FAILED',
        errorMessage: message,
      });
      return toErrorResponse('TOKEN_TX_FAILED', message, 502);
    }

    await updateOrderStatus(order.id, 'COMPLETED', {
      paymentTxHash,
      tokenTxHash,
      completedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        idempotencyKey,
        status: 'COMPLETED',
        paymentMethod,
        paymentTxHash,
        tokenTxHash,
        rwaSymbol,
        rwaAmount: tokenAmount,
      },
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return toErrorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to process purchase',
      500
    );
  }
}
