export type GuidedFlowStepId = 'connect' | 'invest' | 'deposit' | 'borrow' | 'reinvest';
export type GuidedFlowStepState = 'complete' | 'current' | 'upcoming';

export interface GuidedFlowStep {
  id: GuidedFlowStepId;
  label: string;
  state: GuidedFlowStepState;
}

export interface GuidedFlowStepInput {
  hasWallet: boolean;
  isGuidedReinvestFlow: boolean;
  actionTab: string;
  collateralAmount: number;
  totalDebt: number;
  reinvestCompleted: boolean;
}

const stepLabels: Array<Pick<GuidedFlowStep, 'id' | 'label'>> = [
  { id: 'connect', label: 'Connect' },
  { id: 'invest', label: 'Invest' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'borrow', label: 'Borrow' },
  { id: 'reinvest', label: 'Reinvest' },
];

export function buildGuidedFlowSteps(input: GuidedFlowStepInput): GuidedFlowStep[] {
  const hasCollateral = input.collateralAmount > 0;
  const hasDebt = input.totalDebt > 0;
  const completeById: Record<GuidedFlowStepId, boolean> = {
    connect: input.hasWallet,
    invest: input.isGuidedReinvestFlow,
    deposit: hasCollateral,
    borrow: hasDebt,
    reinvest: input.reinvestCompleted,
  };
  const currentId = getCurrentStepId(input.hasWallet, input.isGuidedReinvestFlow, hasCollateral, hasDebt, input.reinvestCompleted);

  return stepLabels.map((step) => ({
    ...step,
    state: completeById[step.id] ? 'complete' : step.id === currentId ? 'current' : 'upcoming',
  }));
}

export function calculateGuidedFlowProgress(steps: GuidedFlowStep[]): number {
  const currentIndex = steps.findIndex((step) => step.state === 'current');
  const lastCompleteIndex = steps.reduce(
    (lastIndex, step, index) => (step.state === 'complete' ? index : lastIndex),
    -1,
  );
  const progressIndex = currentIndex >= 0 ? currentIndex : lastCompleteIndex;

  return Math.max(0, Math.min(100, (progressIndex / Math.max(1, steps.length - 1)) * 100));
}

function getCurrentStepId(
  hasWallet: boolean,
  isGuidedReinvestFlow: boolean,
  hasCollateral: boolean,
  hasDebt: boolean,
  reinvestCompleted: boolean,
): GuidedFlowStepId {
  if (!hasWallet) return 'connect';
  if (!isGuidedReinvestFlow) return 'invest';
  if (!hasCollateral) return 'deposit';
  if (!hasDebt) return 'borrow';
  if (!reinvestCompleted) return 'reinvest';
  return 'reinvest';
}
