import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildGuidedFlowSteps,
  calculateGuidedFlowProgress,
} from '../../src/app/borrow/guided-flow';

describe('guided borrow flow steps', () => {
  it('keeps Deposit current before collateral is locked even when the Borrow tab is selected', () => {
    const steps = buildGuidedFlowSteps({
      hasWallet: true,
      isGuidedReinvestFlow: true,
      actionTab: 'borrow',
      collateralAmount: 0,
      totalDebt: 0,
      reinvestCompleted: false,
    });

    assert.equal(steps.find((step) => step.id === 'deposit')?.state, 'current');
    assert.equal(steps.find((step) => step.id === 'borrow')?.state, 'upcoming');
    assert.equal(calculateGuidedFlowProgress(steps), 50);
  });

  it('advances to Borrow only after collateral is locked', () => {
    const steps = buildGuidedFlowSteps({
      hasWallet: true,
      isGuidedReinvestFlow: true,
      actionTab: 'deposit',
      collateralAmount: 10,
      totalDebt: 0,
      reinvestCompleted: false,
    });

    assert.equal(steps.find((step) => step.id === 'deposit')?.state, 'complete');
    assert.equal(steps.find((step) => step.id === 'borrow')?.state, 'current');
    assert.equal(calculateGuidedFlowProgress(steps), 75);
  });
});
