'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Chrome, Twitter, Github, Shield, Zap, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/contexts/wallet-context';
import { toast } from 'sonner';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login, isLoading } = useAuth();
  const { connectLocalWallet } = useWallet();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleLogin = async (provider: 'google' | 'twitter' | 'github') => {
    setSelectedProvider(provider);
    try {
      await login(provider);
      await connectLocalWallet();
      toast.success('Welcome to LAPLACE!', {
        description: 'Your smart account is connected to the local admin wallet.',
      });
      onOpenChange(false);
    } catch {
      toast.error('Login failed', {
        description: 'Please make sure a local admin wallet exists, then try again.',
      });
    } finally {
      setSelectedProvider(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to LAPLACE</DialogTitle>
          <DialogDescription>
            Sign in with your social account. We&apos;ll create a secure wallet for you automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Abstraction Info */}
          <div className="bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Smart Account Technology
                </p>
                <p className="mt-1 text-muted-foreground">
                  No seed phrases or private keys needed. Your account is secured by your social login.
                </p>
              </div>
            </div>
          </div>

          {/* Login Options */}
          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              size="lg"
              onClick={() => handleLogin('google')}
              disabled={isLoading}
              data-testid="login-google"
            >
              {isLoading && selectedProvider === 'google' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              size="lg"
              onClick={() => handleLogin('twitter')}
              disabled={isLoading}
              data-testid="login-twitter"
            >
              {isLoading && selectedProvider === 'twitter' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Twitter className="mr-2 h-5 w-5" />
              )}
              Continue with Twitter
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              size="lg"
              onClick={() => handleLogin('github')}
              disabled={isLoading}
              data-testid="login-github"
            >
              {isLoading && selectedProvider === 'github' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Github className="mr-2 h-5 w-5" />
              )}
              Continue with GitHub
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant wallet creation</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 text-primary" />
              <span>Secured by multi-factor authentication</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
