import { Copy, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface AdminMarket {
  id: string;
  name: string;
  isActive: boolean;
  collateralCurrency: string;
  collateralIssuer: string;
  collateralAssetId: string;
  debtCurrency: string;
  debtIssuer: string;
  debtAssetId: string;
  liquidityPoolId: string | null;
  positionTokenAssetId: string | null;
  liquidityShareScale: number;
  totalSupplied: number;
  totalBorrowed: number;
  prices: {
    collateralPriceUsd: number;
    debtPriceUsd: number;
  } | null;
}

interface MarketLiquidityManagementCardProps {
  markets: AdminMarket[];
  selectedMarketId: string | null;
  manualLiquidityPoolId: string;
  manualPositionTokenAssetId: string;
  manualCollateralPriceUsd: string;
  manualDebtPriceUsd: string;
  loading: string;
  onRefresh: () => void;
  onSelectMarket: (market: AdminMarket) => void;
  onDeselectMarket: () => void;
  onSetManualLiquidityPoolId: (value: string) => void;
  onSetManualPositionTokenAssetId: (value: string) => void;
  onSetManualCollateralPriceUsd: (value: string) => void;
  onSetManualDebtPriceUsd: (value: string) => void;
  onToggleStatus: (marketId: string, currentStatus: boolean) => void;
  onSaveReferences: (marketId: string) => void;
  onSavePrices: (marketId: string) => void;
  onCopyText: (value: string, label: string) => void;
}

function truncate(value: string | null, max: number = 16) {
  if (!value) return 'Not configured';
  if (value.length <= max) return value;
  const left = Math.floor((max - 3) / 2);
  const right = Math.ceil((max - 3) / 2);
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function MarketLiquidityManagementCard({
  markets,
  selectedMarketId,
  manualLiquidityPoolId,
  manualPositionTokenAssetId,
  manualCollateralPriceUsd,
  manualDebtPriceUsd,
  loading,
  onRefresh,
  onSelectMarket,
  onDeselectMarket,
  onSetManualLiquidityPoolId,
  onSetManualPositionTokenAssetId,
  onSetManualCollateralPriceUsd,
  onSetManualDebtPriceUsd,
  onToggleStatus,
  onSaveReferences,
  onSavePrices,
  onCopyText,
}: MarketLiquidityManagementCardProps) {
  const selectedMarket = markets.find((market) => market.id === selectedMarketId) ?? null;

  return (
    <Card className="rounded-none border-border bg-card text-foreground">
      <CardHeader>
        <CardTitle className="text-base">Market Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage active market status and optional Solana liquidity references.
          </p>
          <Button variant="outline" onClick={onRefresh} disabled={loading === 'refresh-markets'}>
            {loading === 'refresh-markets' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr_1.2fr] gap-3 bg-card px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Market</span>
            <span>Status</span>
            <span>References</span>
            <span>Liquidity Ref</span>
            <span>Actions</span>
          </div>

          {markets.length === 0 ? (
            <div className="px-3 py-5 text-sm text-muted-foreground">No markets found.</div>
          ) : (
            <div>
              {markets.map((market) => {
                const isSelected = selectedMarketId === market.id;
                const statusLoading = loading === `toggle-status-${market.id}`;
                const referencesConfigured = Boolean(market.liquidityPoolId && market.positionTokenAssetId);

                return (
                  <div key={market.id} className="border-t border-border">
                    <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr_1.2fr] items-center gap-3 px-3 py-3 text-sm text-foreground">
                      <button
                        className="text-left font-medium underline-offset-2 hover:underline"
                        onClick={() => {
                          if (isSelected) {
                            onDeselectMarket();
                            return;
                          }
                          onSelectMarket(market);
                        }}
                      >
                        {market.name}
                      </button>
                      <span>
                        <Badge variant={market.isActive ? 'default' : 'secondary'}>
                          {market.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </span>
                      <span>
                        <Badge variant={referencesConfigured ? 'default' : 'secondary'}>
                          {referencesConfigured ? 'Configured' : 'Missing'}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-2 font-mono text-xs">
                        {truncate(market.liquidityPoolId)}
                        {market.liquidityPoolId ? (
                          <button
                            onClick={() => onCopyText(market.liquidityPoolId as string, 'Liquidity reference ID')}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Copy liquidity reference id for ${market.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleStatus(market.id, market.isActive)}
                          disabled={statusLoading}
                        >
                          {statusLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                          {market.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedMarket ? (
          <div className="space-y-4 rounded-lg border border-border bg-background p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{selectedMarket.name} configuration</p>
              <p className="text-xs font-mono text-muted-foreground">
                Collateral mint: {selectedMarket.collateralAssetId}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Debt mint: {selectedMarket.debtAssetId}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Liquidity reference ID: {selectedMarket.liquidityPoolId ?? 'Not configured'}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Position token reference ID: {selectedMarket.positionTokenAssetId ?? 'Not configured'}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Current prices: collateral ${selectedMarket.prices?.collateralPriceUsd ?? 'N/A'} / debt ${selectedMarket.prices?.debtPriceUsd ?? 'N/A'}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Liquidity reference ID</label>
                <input
                  type="text"
                  value={manualLiquidityPoolId}
                  onChange={(event) => onSetManualLiquidityPoolId(event.target.value)}
                  placeholder="Optional reference id"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground">Position token reference ID</label>
                <input
                  type="text"
                  value={manualPositionTokenAssetId}
                  onChange={(event) => onSetManualPositionTokenAssetId(event.target.value)}
                  placeholder="Optional reference id"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <Button
              onClick={() => onSaveReferences(selectedMarket.id)}
              disabled={loading === `save-market-references-${selectedMarket.id}`}
            >
              {loading === `save-market-references-${selectedMarket.id}` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save References
            </Button>

            <div className="border-t border-border pt-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-foreground">Mock Prices</p>
                <p className="text-xs text-muted-foreground">
                  Update the demo price oracle values used by purchase screens, LTV, and borrow limits.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="admin-collateral-price-usd" className="text-sm text-foreground">
                    Collateral price USD
                  </label>
                  <input
                    id="admin-collateral-price-usd"
                    type="number"
                    min="0"
                    step="0.000001"
                    value={manualCollateralPriceUsd}
                    onChange={(event) => onSetManualCollateralPriceUsd(event.target.value)}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-debt-price-usd" className="text-sm text-foreground">
                    Debt price USD
                  </label>
                  <input
                    id="admin-debt-price-usd"
                    type="number"
                    min="0"
                    step="0.000001"
                    value={manualDebtPriceUsd}
                    onChange={(event) => onSetManualDebtPriceUsd(event.target.value)}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <Button
                className="mt-3"
                onClick={() => onSavePrices(selectedMarket.id)}
                disabled={loading === `save-market-prices-${selectedMarket.id}`}
              >
                {loading === `save-market-prices-${selectedMarket.id}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Prices
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
