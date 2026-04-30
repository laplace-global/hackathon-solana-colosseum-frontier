import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WalletBalancesCardProps {
  walletConnected: boolean;
  nativeAssetSymbol: string;
  tokenList: readonly string[];
  getBalance: (symbol: string) => number;
}

export function WalletBalancesCard({
  walletConnected,
  nativeAssetSymbol,
  tokenList,
  getBalance,
}: WalletBalancesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wallet Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {!walletConnected ? (
          <p className="text-sm text-muted-foreground">Generate a wallet to view balances.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground">{nativeAssetSymbol}</p>
              <p
                className="text-lg font-semibold text-foreground"
                data-testid={`admin-balance-${nativeAssetSymbol.toLowerCase()}`}
              >
                {getBalance(nativeAssetSymbol).toFixed(4)}
              </p>
            </div>
            {tokenList.map((token) => (
              <div key={token} className="bg-card border border-border p-3">
                <p className="text-xs text-muted-foreground">{token}</p>
                <p
                  className="text-lg font-semibold text-foreground"
                  data-testid={`admin-balance-${token.toLowerCase()}`}
                >
                  {getBalance(token).toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
