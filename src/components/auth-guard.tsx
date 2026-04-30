'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { LoginDialog } from '@/components/login-dialog';
import { useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 pt-24">
          <Card className="w-full max-w-md rounded-none border-border bg-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl font-light text-foreground">Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to access this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground leading-relaxed">
                Sign in to view your portfolio, track investments, and manage your tokenized hotel assets.
              </p>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setShowLogin(true)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  Back to Home
                </Button>
              </div>

              <div className="bg-primary/10 p-4">
                <p className="text-sm text-foreground">
                  <strong>New to LAPLACE?</strong>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create an account instantly with your social login. No complicated forms or seed phrases required.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
      </>
    );
  }

  return <>{children}</>;
}
