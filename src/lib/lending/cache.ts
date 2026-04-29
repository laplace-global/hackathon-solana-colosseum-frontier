export type LendingCacheInvalidationArgs = {
  marketId?: string;
  userAddress?: string;
  loanId?: string;
  liquidityPoolId?: string;
};

export function invalidateLendingReadCaches(_args: LendingCacheInvalidationArgs): void {
  // Read-side cache was removed with the legacy runtime.
  // Keep this helper as a stable no-op until a new cache layer is introduced.
}
