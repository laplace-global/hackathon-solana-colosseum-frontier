import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WalletToolsGridProps {
  tokenList: readonly string[];
  walletAddress: string | null;
  assetIdByToken: Record<string, string | null>;
  assetProvisioning: Record<string, boolean>;
  assetStatusByToken: Record<string, string | undefined>;
  hasAssetByToken: Record<string, boolean | undefined>;
  loading: string;
  onGenerateWallet: () => void;
  onRequestSolAirdrop: () => void;
  onRequestTokenFaucet: (token: string) => void;
}

export function WalletToolsGrid({
  tokenList,
  walletAddress,
  assetIdByToken,
  assetProvisioning,
  assetStatusByToken,
  hasAssetByToken,
  loading,
  onGenerateWallet,
  onRequestSolAirdrop,
  onRequestTokenFaucet,
}: WalletToolsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="md:col-span-2 xl:col-span-4 border border-border bg-card p-3 text-sm text-muted-foreground">
        Admin tools can provision SOL and demo assets directly so that the E2E happy path can start from a clean local wallet.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate New Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Creates a fresh local account, saves the secret in localStorage, requests SOL on devnet, and checks whether SAIL/NYRA/RLUSD can be received.
          </p>
          <Button
            onClick={onGenerateWallet}
            disabled={loading === 'generate'}
            className="w-full"
            data-testid="admin-generate-wallet"
          >
            {loading === 'generate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate + Fund
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SOL Airdrop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Requests additional SOL on devnet for the current local wallet.
          </p>
          <Button
            onClick={onRequestSolAirdrop}
            disabled={!walletAddress || loading === 'airdrop-sol'}
            className="w-full"
            variant="outline"
            data-testid="admin-airdrop-sol"
          >
            {loading === 'airdrop-sol' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Airdrop 1 SOL
          </Button>
        </CardContent>
      </Card>

      {tokenList.map((token) => (
        <Card key={token}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Asset {token}
              {assetProvisioning[token] || assetStatusByToken[token] === 'checking' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    hasAssetByToken[token] ? 'bg-primary' : 'bg-muted'
                  }`}
                  title={
                    hasAssetByToken[token] ? `${token} ready` : `${token} not ready`
                  }
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Mint: {assetIdByToken[token] ?? 'Not configured'}
            </p>
            <Button
              onClick={() => onRequestTokenFaucet(token)}
              disabled={!walletAddress || !assetIdByToken[token] || loading === `faucet-${token}`}
              className="w-full"
              variant="outline"
              data-testid={`admin-faucet-${token.toLowerCase()}`}
            >
              {loading === `faucet-${token}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Faucet {token}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
