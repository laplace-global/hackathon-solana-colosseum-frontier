'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/auth-guard';
import { OnrampDialog } from '@/components/onramp-dialog';
import { OfframpDialog } from '@/components/offramp-dialog';
import { LoginDialog } from '@/components/login-dialog';
import {
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Copy,
  Coins,
  TrendingUp,
  Clock,
  Shield,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { toast } from 'sonner';
import { loadLocalAccountSecret } from '@/lib/chain/storage';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'dividend';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  date: Date;
  txHash?: string;
}

export default function WalletPage() {
  const {
    address,
    balances,
    connectionType,
    error,
    isRefreshing,
    refreshBalances,
    rlusdBalance,
  } = useWallet();
  const [showOnramp, setShowOnramp] = useState(false);
  const [showOfframp, setShowOfframp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountSecret, setAccountSecret] = useState<string>('');

  const orderedBalances = [...balances].sort((left, right) => {
    const order = ['SOL', 'RLUSD', 'SAIL', 'NYRA'];
    const leftIndex = order.indexOf(left.symbol);
    const rightIndex = order.indexOf(right.symbol);
    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
      - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });

  useEffect(() => {
    setAccountSecret(loadLocalAccountSecret() ?? '');

    // Mock transaction history
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'dividend',
        amount: 100,
        currency: 'RLUSD',
        status: 'completed',
        description: 'Q3 2024 Dividend - THE SAIL Hotel',
        date: new Date('2024-09-30'),
        txHash: '5Q3w...9Na1',
      },
      {
        id: '2',
        type: 'purchase',
        amount: -5000,
        currency: 'RLUSD',
        status: 'completed',
        description: 'Token Purchase - Studio Deluxe (50 tokens)',
        date: new Date('2024-01-15'),
        txHash: '7Xm2...Lq8P',
      },
      {
        id: '3',
        type: 'deposit',
        amount: 10000,
        currency: 'RLUSD',
        status: 'completed',
        description: 'RLUSD Treasury Top-up',
        date: new Date('2024-01-10'),
        txHash: '3Lm8...Qv2R',
      },
      {
        id: '4',
        type: 'dividend',
        amount: 100,
        currency: 'RLUSD',
        status: 'completed',
        description: 'Q2 2024 Dividend - THE SAIL Hotel',
        date: new Date('2024-06-30'),
        txHash: '9Ab4...Kp6T',
      },
      {
        id: '5',
        type: 'withdrawal',
        amount: -2500,
        currency: 'RLUSD',
        status: 'pending',
        description: 'RLUSD Offramp Request',
        date: new Date('2024-11-25'),
        txHash: '2Nz7...Mv4X',
      },
    ];

    setTransactions(mockTransactions);
  }, []);

  useEffect(() => {
    if (showOfframp) {
      setAccountSecret(loadLocalAccountSecret() ?? '');
    }
  }, [showOfframp]);

  const handleRefresh = async () => {
    if (!address) {
      toast.error('Connect a wallet first');
      setShowLogin(true);
      return;
    }

    await refreshBalances();
    toast.success('Balance updated');
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success('Wallet address copied!');
  };

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction reference copied!');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-primary" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'purchase':
        return <Coins className="h-4 w-4 text-primary" />;
      case 'dividend':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="rounded-none bg-primary/10 text-primary">Completed</Badge>;
      case 'pending':
        return <Badge className="rounded-none bg-card text-muted-foreground border border-border">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="rounded-none">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-none">{status}</Badge>;
    }
  };

  const handleOnrampSuccess = (amount: number) => {
    void refreshBalances();
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount: amount,
      currency: 'RLUSD',
      status: 'completed',
      description: 'RLUSD Onramp',
      date: new Date(),
      txHash: `5${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleOfframpSuccess = (amount: number) => {
    void refreshBalances();
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount: -amount,
      currency: 'RLUSD',
      status: 'pending',
      description: 'RLUSD Offramp',
      date: new Date(),
      txHash: `7${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-24">
        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-eyebrow text-primary mb-3">Treasury</p>
                <h1 className="font-serif text-4xl font-light text-foreground md:text-5xl">My Wallet</h1>
                <p className="mt-3 text-muted-foreground">
                  Manage your RLUSD balance and transactions
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          {connectionType === 'disconnected' ? (
            <Card className="mb-6 rounded-none border-dashed">
              <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">No wallet connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your smart account to load live balances from the local admin wallet.
                  </p>
                </div>
                <Button onClick={() => setShowLogin(true)}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Smart Account
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          ) : null}

          {/* Balance Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Main Balance */}
            <Card className="rounded-none sm:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-eyebrow text-muted-foreground">
                    RLUSD Balance
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-5xl font-light text-foreground">
                    {showBalance ? `${rlusdBalance.toFixed(2)}` : '•••••••'}
                  </span>
                  <span className="text-eyebrow text-muted-foreground">RLUSD</span>
                </div>
                {showBalance && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    ≈ ${rlusdBalance.toFixed(2)} USD
                  </p>
                )}
                
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => setShowOnramp(true)} className="flex-1" disabled={!address}>
                    <Plus className="mr-2 h-4 w-4" />
                    Onramp
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowOfframp(true)}
                    className="flex-1"
                    disabled={!address}
                  >
                    <Minus className="mr-2 h-4 w-4" />
                    Offramp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Info */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-eyebrow text-muted-foreground">
                  Wallet Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-card border border-border p-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-eyebrow text-muted-foreground">Connected Wallet</p>
                      <p className="mt-1 font-mono text-sm text-foreground">
                        {address ? formatAddress(address) : 'Not connected'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyAddress} disabled={!address}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Coins className="h-3 w-3" />
                    <span>Solana Devnet</span>
                  </div>

                  <div className="border border-border p-3">
                    <p className="text-eyebrow text-muted-foreground">Asset Balances</p>
                    <div className="mt-3 space-y-2">
                      {orderedBalances.length > 0 ? (
                        orderedBalances.map((balance) => (
                          <div key={`${balance.symbol}-${balance.assetId ?? 'native'}`} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium text-foreground">{balance.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                {balance.kind === 'native' ? 'Native SOL' : 'SPL Token'}
                              </p>
                            </div>
                            <p className="font-mono text-right text-foreground">{balance.displayAmount}</p>
                          </div>
                        ))
                      ) : isRefreshing ? (
                        <Skeleton className="h-16 w-full bg-card" />
                      ) : (
                        <p className="text-xs text-muted-foreground">No balances loaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-light text-foreground">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="deposits">Onramps</TabsTrigger>
                  <TabsTrigger value="withdrawals">Offramps</TabsTrigger>
                  <TabsTrigger value="dividends">Dividends</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-card border border-border p-2">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{tx.description}</p>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{tx.date.toLocaleDateString()}</span>
                            {tx.txHash && (
                              <button
                                onClick={() => copyTxHash(tx.txHash!)}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                <span className="font-mono">{tx.txHash}</span>
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.amount > 0 ? 'text-primary' : 'text-destructive'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                        </p>
                        {tx.status === 'pending' && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Processing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="deposits">
                  {transactions.filter(tx => tx.type === 'deposit').map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2">
                          <ArrowDownLeft className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-primary">
                        +{tx.amount.toFixed(2)} {tx.currency}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="withdrawals">
                  {transactions.filter(tx => tx.type === 'withdrawal').map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-card border border-border p-2">
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          {tx.amount.toFixed(2)} {tx.currency}
                        </p>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="dividends">
                  {transactions.filter(tx => tx.type === 'dividend').map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-primary">
                        +{tx.amount.toFixed(2)} {tx.currency}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
      <OnrampDialog 
          open={showOnramp} 
          onOpenChange={setShowOnramp}
          userAddress={address ?? ''}
          onSuccess={handleOnrampSuccess}
        />
        <OfframpDialog 
          open={showOfframp} 
          onOpenChange={setShowOfframp}
          availableBalance={rlusdBalance}
          userAddress={address ?? ''}
          accountSecret={accountSecret}
          onSuccess={handleOfframpSuccess}
        />
        <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
      </div>
    </AuthGuard>
  );
}
