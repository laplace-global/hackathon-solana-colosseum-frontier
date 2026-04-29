import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  allocateRepayment,
  calculateAccruedSupplyYield,
  calculateGlobalYieldIndex,
  calculateHealthFactor,
  calculateInterestAccrued,
  calculateLtv,
  calculateMaxBorrowable,
  calculateMaxWithdrawable,
  calculateSupplyApr,
  calculateSupplyApy,
  calculateTotalDebt,
  deriveYieldIndexFromAccrued,
  isLiquidatable,
  validateBorrow,
  validateWithdrawal,
} from '../../src/lib/lending/calculations';

function assertApprox(actual: number, expected: number, epsilon = 1e-8): void {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
}

describe('lending calculations', () => {
  it('accrues simple annual interest with 8-digit rounding', () => {
    const lastUpdate = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2027-01-01T00:00:00.000Z');

    assert.equal(calculateInterestAccrued(100, 0.05, lastUpdate, now), 5);
    assert.equal(calculateInterestAccrued(100, 0.05, now, lastUpdate), 0);
  });

  it('computes debt and ltv safely', () => {
    assert.equal(calculateTotalDebt(100, 2.345678912), 102.34567891);
    assert.equal(calculateLtv(10, 100, 400, 1), 0.4);
    assert.equal(calculateLtv(0, 100, 1, 1), Infinity);
    assert.equal(calculateHealthFactor(0.4, 0.85), 2.125);
    assert.equal(calculateHealthFactor(0, 0.85), Infinity);
  });

  it('calculates borrowable and withdrawable limits from max ltv', () => {
    assert.equal(calculateMaxBorrowable(10, 100, 100, 1, 0.5), 400);
    assert.equal(calculateMaxBorrowable(10, 100, 600, 1, 0.5), 0);

    assert.equal(calculateMaxWithdrawable(10, 100, 100, 1, 0.5), 8);
    assert.equal(calculateMaxWithdrawable(10, 100, 1000, 1, 0.5), 0);
  });

  it('allocates repayments to interest first and tracks excess', () => {
    assert.deepEqual(allocateRepayment(70, 20, 100), {
      interestPaid: 20,
      principalPaid: 50,
      excess: 0,
    });

    assert.deepEqual(allocateRepayment(150, 20, 100), {
      interestPaid: 20,
      principalPaid: 100,
      excess: 30,
    });
  });

  it('progresses supply yield metrics consistently', () => {
    assert.equal(calculateSupplyApr(0.1, 0.8, 0.1), 0.072);
    assertApprox(calculateSupplyApy(0.1), 0.10515578);

    const lastIndexUpdate = new Date('2026-01-01T00:00:00.000Z');
    const halfYearLater = new Date(lastIndexUpdate.getTime() + 15_768_000 * 1000);
    const nextIndex = calculateGlobalYieldIndex(1, 0.1, lastIndexUpdate, halfYearLater);
    assertApprox(nextIndex, 1.05);

    const accruedYield = calculateAccruedSupplyYield(1000, nextIndex, 1);
    assertApprox(accruedYield, 50);
    assertApprox(deriveYieldIndexFromAccrued(nextIndex, 1000, accruedYield), 1);
  });

  it('validates borrow and withdrawal against ltv constraints', () => {
    assert.equal(validateBorrow(10, 100, 0, 500, 1, 0.5), true);
    assert.equal(validateBorrow(10, 100, 0, 500.01, 1, 0.5), false);

    assert.equal(validateWithdrawal(10, 8, 100, 100, 1, 0.5), true);
    assert.equal(validateWithdrawal(10, 8.01, 100, 100, 1, 0.5), false);
    assert.equal(validateWithdrawal(10, 10, 100, 0, 1, 0.5), true);
  });

  it('flags liquidation at or above the threshold', () => {
    assert.equal(isLiquidatable(0.84, 0.85), false);
    assert.equal(isLiquidatable(0.85, 0.85), true);
    assert.equal(isLiquidatable(0.9, 0.85), true);
  });
});
