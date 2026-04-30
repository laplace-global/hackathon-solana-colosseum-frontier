import { expect, type Page, test } from '@playwright/test';

const THE_SAIL_UNIT_URL = '/hotel/the-sail/unit/sail-a';
const PURCHASE_AMOUNT = '10';
const SUPPLY_AMOUNT = '200';
const DEPOSIT_AMOUNT = '10';
const BORROW_AMOUNT = '50';
const WITHDRAW_AMOUNT = '10';

const MARKET_ID = 'market-sail';
const ASSETS = {
  SAIL: 'sail-mint',
  RLUSD: 'rlusd-mint',
  NYRA: 'nyra-mint',
} as const;

interface OperationState {
  address: string | null;
  sol: number;
  rlusd: number;
  sail: number;
  nyra: number;
  supplied: number;
  collateral: number;
  loan: number;
  purchaseCreated: boolean;
}

function createState(): OperationState {
  return {
    address: null,
    sol: 0,
    rlusd: 0,
    sail: 0,
    nyra: 0,
    supplied: 0,
    collateral: 0,
    loan: 0,
    purchaseCreated: false,
  };
}

function market(state: OperationState) {
  return {
    id: MARKET_ID,
    name: 'SAIL-RLUSD',
    isActive: true,
    collateralCurrency: 'SAIL',
    collateralIssuer: ASSETS.SAIL,
    collateralAssetId: ASSETS.SAIL,
    collateralLockEnabled: true,
    debtCurrency: 'RLUSD',
    debtIssuer: ASSETS.RLUSD,
    debtAssetId: ASSETS.RLUSD,
    liquidityPoolId: null,
    positionTokenAssetId: null,
    liquidityShareScale: 6,
    maxLtvRatio: 0.5,
    liquidationLtvRatio: 0.85,
    baseInterestRate: 0.04,
    minSupplyAmount: 5,
    minCollateralAmount: 5,
    minBorrowAmount: 5,
    reserveFactor: 0.1,
    loanTermMonths: 3,
    totalSupplied: 1_000 + state.supplied,
    totalBorrowed: state.loan,
    prices: {
      collateralPriceUsd: 100,
      debtPriceUsd: 1,
    },
  };
}

function balance(symbol: 'SOL' | 'SAIL' | 'RLUSD' | 'NYRA', amount: number) {
  const assetId = symbol === 'SOL' ? null : ASSETS[symbol];
  return {
    symbol,
    currency: symbol,
    assetId,
    issuer: assetId ?? undefined,
    kind: symbol === 'SOL' ? 'native' : 'token',
    amount: String(amount),
    displayAmount: amount.toFixed(4),
    value: String(amount),
  };
}

function balances(state: OperationState) {
  return [
    balance('SOL', state.sol),
    balance('RLUSD', state.rlusd),
    balance('SAIL', state.sail),
    balance('NYRA', state.nyra),
  ];
}

function lendingConfig(state: OperationState) {
  return {
    success: true,
    data: {
      markets: [market(state)],
      treasuryAddress: 'treasury',
      operatorAddress: 'operator',
      issuerAddress: 'issuer',
      backendAddress: 'backend',
      explorerUrl: 'https://explorer.solana.com',
      chain: 'solana',
      rpcUrl: 'https://api.devnet.solana.com',
      chainConfig: {
        chain: 'solana',
        network: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        explorerUrl: 'https://explorer.solana.com',
        commitment: 'confirmed',
        nativeAssetSymbol: 'SOL',
      },
      assetDefinitions: [],
    },
  };
}

function pool(state: OperationState) {
  return {
    marketId: MARKET_ID,
    totalSupplied: 1_000 + state.supplied,
    totalBorrowed: state.loan,
    totalCollateralLocked: state.collateral,
    totalShares: 1_000 + state.supplied,
    availableLiquidity: 5_000,
    utilizationRate: state.loan / 5_000,
    borrowApr: 0.04,
    supplyApr: 0.025,
    supplyApy: 0.025,
    globalYieldIndex: 1,
  };
}

function supplyPosition(state: OperationState) {
  return {
    position: {
      id: 'supply-position-1',
      status: 'ACTIVE',
      supplyAmount: state.supplied,
      suppliedAt: '2026-04-30T00:00:00.000Z',
    },
    metrics: {
      accruedYield: 0,
      withdrawableAmount: state.supplied,
      availableLiquidity: 5_000,
      utilizationRate: state.loan / 5_000,
      supplyApr: 0.025,
      supplyApy: 0.025,
    },
  };
}

function borrowPosition(state: OperationState) {
  const collateralValueUsd = state.collateral * 100;
  const totalDebt = state.loan;
  return {
    position: {
      id: 'borrow-position-1',
      status: totalDebt > 0 ? 'ACTIVE' : 'LOCKED',
      collateralAmount: state.collateral,
      loanPrincipal: state.loan,
      interestAccrued: 0,
      interestRateAtOpen: 0.04,
      openedAt: '2026-04-30T00:00:00.000Z',
    },
    metrics: {
      totalDebt,
      collateralValueUsd,
      debtValueUsd: totalDebt,
      currentLtv: collateralValueUsd > 0 ? totalDebt / collateralValueUsd : 0,
      healthFactor: totalDebt > 0 ? (collateralValueUsd * 0.85) / totalDebt : 99,
      liquidatable: false,
      maxBorrowableAmount: Math.max(0, collateralValueUsd * 0.5 - totalDebt),
      maxWithdrawableAmount: totalDebt > 0 ? 0 : state.collateral,
      availableLiquidity: 5_000,
    },
    loan: totalDebt > 0
      ? {
          loanId: 'loan-1',
          minimumRepayment: totalDebt,
          fullRepayment: totalDebt,
          suggestedOverpayment: totalDebt,
          periodicPayment: null,
          paymentRemaining: null,
          nextPaymentDueDate: '2026-05-30T00:00:00.000Z',
          isPastDue: false,
        }
      : null,
    events: [],
  };
}

async function installOperationMocks(page: Page, state: OperationState) {
  await page.addInitScript(() => {
    const key = 'laplace-e2e-storage-cleared';
    if (window.sessionStorage.getItem(key)) return;
    window.localStorage.clear();
    window.sessionStorage.setItem(key, '1');
  });

  await page.route('**/api/admin/sol', async (route) => {
    const body = route.request().postDataJSON() as { userAddress?: string; amount?: string };
    state.address = body.userAddress ?? state.address;
    state.sol += Number(body.amount ?? '0.05');
    await route.fulfill({
      json: {
        success: true,
        txHash: 'sol-fund-tx',
      },
    });
  });

  await page.route('**/api/admin/markets', async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        markets: [market(state)],
      },
    });
  });

  await page.route('**/api/faucet', async (route) => {
    const body = route.request().postDataJSON() as { token?: keyof typeof ASSETS };
    const token = body.token ?? 'RLUSD';
    if (token === 'RLUSD') state.rlusd += 1_000;
    if (token === 'SAIL') state.sail += 1_000;
    if (token === 'NYRA') state.nyra += 1_000;

    await route.fulfill({
      json: {
        success: true,
        amount: 1_000,
        token,
      },
    });
  });

  await page.route('**/api/balances**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        address: state.address,
        balances: balances(state),
      },
    });
  });

  await page.route('**/api/purchase', async (route) => {
    const body = route.request().postDataJSON() as { tokenAmount?: number };
    const tokenAmount = Number(body.tokenAmount ?? 0);
    state.sail += tokenAmount;
    state.purchaseCreated = true;

    await route.fulfill({
      json: {
        success: true,
        data: {
          orderId: 'purchase-1',
          paymentTxHash: 'payment-tx',
          tokenTxHash: 'token-tx',
        },
      },
    });
  });

  await page.route('**/api/portfolio**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: state.purchaseCreated
          ? [
              {
                id: 'purchase-1',
                hotelId: 'the-sail',
                hotelName: 'THE SAIL Hotel Tower',
                unitId: 'sail-a',
                unitType: 'Studio Deluxe',
                tokenAmount: Number(PURCHASE_AMOUNT),
                pricePerToken: 100,
                totalPrice: 1_000,
                purchaseDate: '2026-04-30T00:00:00.000Z',
                estimatedROI: 8,
                status: 'confirmed',
                currentValue: 1_000,
              },
            ]
          : [],
      },
    });
  });

  await page.route('**/api/lending/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === '/api/lending/config') {
      await route.fulfill({ json: lendingConfig(state) });
      return;
    }

    if (path === `/api/lending/markets/${MARKET_ID}`) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            market: market(state),
            pool: pool(state),
          },
        },
      });
      return;
    }

    if (path === `/api/lending/markets/${MARKET_ID}/supply-positions/${state.address}`) {
      if (state.supplied <= 0) {
        await route.fulfill({
          status: 404,
          json: {
            success: false,
            error: { code: 'SUPPLY_POSITION_NOT_FOUND' },
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          success: true,
          data: supplyPosition(state),
        },
      });
      return;
    }

    if (path.includes('/api/lending/lenders/') && path.endsWith('/supply-positions')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            events: [],
          },
        },
      });
      return;
    }

    if (path === `/api/lending/markets/${MARKET_ID}/supply`) {
      const body = route.request().postDataJSON() as { amount?: number };
      const amount = Number(body.amount ?? 0);
      state.supplied += amount;
      state.rlusd -= amount;

      await route.fulfill({
        json: {
          success: true,
          data: {
            suppliedAmount: amount,
            positionId: 'supply-position-1',
          },
        },
      });
      return;
    }

    if (path === '/api/lending/deposit') {
      const body = route.request().postDataJSON() as { amount?: number };
      const amount = Number(body.amount ?? 0);
      state.collateral += amount;
      state.sail = Math.max(0, state.sail - amount);

      await route.fulfill({
        json: {
          success: true,
          data: {
            positionId: 'borrow-position-1',
            collateralAmount: amount,
            newCollateralTotal: state.collateral,
          },
        },
      });
      return;
    }

    if (path === '/api/lending/borrow') {
      const body = route.request().postDataJSON() as { amount?: number };
      const amount = Number(body.amount ?? 0);
      state.loan += amount;
      state.rlusd += amount;

      await route.fulfill({
        json: {
          success: true,
          data: {
            positionId: 'borrow-position-1',
            borrowedAmount: amount,
            newLoanPrincipal: state.loan,
            txHash: 'borrow-tx',
          },
        },
      });
      return;
    }

    if (path === '/api/lending/repay') {
      const body = route.request().postDataJSON() as { amount?: number };
      const amount = Number(body.amount ?? 0);
      state.loan = Math.max(0, state.loan - amount);
      state.rlusd = Math.max(0, state.rlusd - amount);

      await route.fulfill({
        json: {
          success: true,
          data: {
            positionId: 'borrow-position-1',
            amountRepaid: amount,
            remainingDebt: state.loan,
          },
        },
      });
      return;
    }

    if (path === '/api/lending/withdraw') {
      const body = route.request().postDataJSON() as { amount?: number };
      const amount = Number(body.amount ?? 0);
      state.collateral = Math.max(0, state.collateral - amount);
      state.sail += amount;

      await route.fulfill({
        json: {
          success: true,
          data: {
            positionId: 'borrow-position-1',
            withdrawnAmount: amount,
            remainingCollateral: state.collateral,
            txHash: 'withdraw-tx',
          },
        },
      });
      return;
    }

    if (path === '/api/lending/position') {
      await route.fulfill({
        json: {
          success: true,
          data: borrowPosition(state),
        },
      });
      return;
    }

    await route.fulfill({
      status: 404,
      json: {
        success: false,
        error: { message: `Unhandled mock route: ${path}` },
      },
    });
  });
}

async function waitForToast(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible({ timeout: 30_000 });
}

test('local operation flow reaches purchase, lend, borrow, repay, and withdraw checks', async ({ page }) => {
  test.slow();
  const state = createState();
  await installOperationMocks(page, state);

  await page.goto('/admin');
  await page.getByTestId('admin-clear-local-wallet').click();
  await page.getByTestId('admin-generate-wallet').click();
  await expect(page.getByTestId('admin-wallet-loaded')).toBeVisible({ timeout: 30_000 });

  await page.getByTestId('admin-faucet-rlusd').click();
  await waitForToast(page, 'Sent 1000 RLUSD to the local wallet');
  await expect(page.getByTestId('admin-balance-rlusd')).toContainText('1000.0000');

  await page.goto(THE_SAIL_UNIT_URL);
  await page.getByTestId('purchase-token-amount-input').fill(PURCHASE_AMOUNT);
  await page.getByTestId('purchase-open-dialog').click();
  await page.getByTestId('login-google').click();
  await waitForToast(page, 'Welcome to LAPLACE!');

  await page.getByTestId('purchase-open-dialog').click();
  await expect(page.getByText('Confirm Token Purchase')).toBeVisible();
  await page.getByText('Credit / Debit Card').click();
  await page.getByRole('button', { name: 'Pay with Card' }).click();
  await expect(page.getByText('Purchase Successful')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Done' }).click();
  await waitForToast(page, 'Purchase successful!');
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByText('THE SAIL Hotel Tower')).toBeVisible();

  await page.goto('/lend');
  await expect(page.getByTestId('lend-supply-submit')).toBeEnabled({ timeout: 30_000 });
  await page.getByTestId('lend-supply-amount').fill(SUPPLY_AMOUNT);
  await page.getByTestId('lend-supply-submit').click();
  await waitForToast(page, /Supplied .* RLUSD/);

  await page.goto('/borrow');
  await expect(page.getByTestId('borrow-deposit-submit')).toBeEnabled({ timeout: 30_000 });
  await page.getByTestId('borrow-deposit-amount').fill(DEPOSIT_AMOUNT);
  await page.getByTestId('borrow-deposit-submit').click();
  await waitForToast(page, 'Collateral locked');
  await expect(page.getByTestId('borrow-position-collateral')).toContainText('10.00 SAIL');

  await page.getByRole('tab', { name: 'Borrow' }).click();
  await expect(page.getByTestId('borrow-submit')).toBeEnabled({ timeout: 30_000 });
  await page.getByTestId('borrow-amount').fill(BORROW_AMOUNT);
  await page.getByTestId('borrow-submit').click();
  await waitForToast(page, 'Borrow successful');
  await expect(page.getByTestId('borrow-position-loan')).toContainText('50.00 RLUSD');

  await page.getByRole('tab', { name: 'Repay' }).click();
  await expect(page.getByTestId('borrow-repay-preset-full')).toBeEnabled({ timeout: 30_000 });
  await page.getByTestId('borrow-repay-preset-full').click();
  await page.getByTestId('borrow-repay-submit').click();
  await waitForToast(page, 'Repayment successful');
  await expect(page.getByTestId('borrow-position-loan')).toContainText('0.00 RLUSD');

  await page.getByRole('tab', { name: 'Withdraw' }).click();
  await page.getByTestId('borrow-withdraw-amount').fill(WITHDRAW_AMOUNT);
  await page.getByTestId('borrow-withdraw-submit').click();
  await waitForToast(page, 'Withdrawal successful');
  await expect(page.getByTestId('borrow-position-collateral')).toContainText('0.00 SAIL');
});
