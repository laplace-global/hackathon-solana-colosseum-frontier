'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Mail, User, Copy, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuthGuard } from '@/components/auth-guard';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(user.wallet.address);
    toast.success('Wallet address copied!');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <p className="text-eyebrow text-primary mb-4">Account</p>
        <h1 className="mb-10 font-serif text-4xl font-light text-foreground md:text-5xl">Profile Settings</h1>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Image 
                  src={user.picture} 
                  alt={user.name}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
                <div>
                  <h2 className="font-serif text-xl font-light text-foreground">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Smart Account Details
                <Badge variant="secondary">
                  <Shield className="mr-1 h-3 w-3" />
                  Account Abstraction
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-card border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Wallet Address</span>
                  <button
                    onClick={copyAddress}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-mono text-sm text-foreground">{user.wallet.address}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-serif text-2xl font-light text-foreground">${user.wallet.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Network</p>
                  <p className="font-serif text-2xl font-light text-foreground">Solana</p>
                </div>
              </div>

              <div className="bg-primary/10 p-4">
                <p className="text-sm text-foreground">
                  <strong>Smart Account Benefits:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• No seed phrases to remember</li>
                  <li>• Social recovery options</li>
                  <li>• Multi-factor authentication</li>
                  <li>• Gas fees abstraction</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}