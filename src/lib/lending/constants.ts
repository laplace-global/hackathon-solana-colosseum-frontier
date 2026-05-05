import { APP_DEFAULTS } from '@/lib/config/defaults';

function parseLoanTermMonths(value: string | undefined): number {
  if (!value) return APP_DEFAULTS.lending.loanTermMonths;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return APP_DEFAULTS.lending.loanTermMonths;
  return Math.floor(parsed);
}

export const DEFAULT_LOAN_TERM_MONTHS = parseLoanTermMonths(process.env.LENDING_LOAN_TERM_MONTHS);
