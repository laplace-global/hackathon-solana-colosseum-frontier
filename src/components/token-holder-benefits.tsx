'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Gift,
  Star,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

interface TokenHolderBenefitsProps {
  hotelId: string;
  hotelName: string;
}

export function TokenHolderBenefits({ hotelId, hotelName }: TokenHolderBenefitsProps) {
  const { user } = useAuth();
  console.log('Token benefits for:', hotelId, hotelName); // Using params

  return (
    <Card className="rounded-none border-primary/30 bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle className="font-serif text-xl font-light text-foreground">
            Token Holder Benefits
          </CardTitle>
          <span className="text-eyebrow text-primary">Exclusive</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Free Annual Stays</p>
              <p className="text-sm text-muted-foreground">
                Up to 13 nights per year at this property
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Priority Access</p>
              <p className="text-sm text-muted-foreground">
                Early access to member experiences and premium content
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Member Rates</p>
              <p className="text-sm text-muted-foreground">
                Special rates for additional nights beyond free allocation
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-eyebrow text-primary">
              Member Benefits
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-serif text-2xl font-light text-foreground">13</div>
              <div className="text-eyebrow text-muted-foreground mt-1">Nights/Year</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-light text-foreground">24/7</div>
              <div className="text-eyebrow text-muted-foreground mt-1">Member Access</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-light text-foreground">10</div>
              <div className="text-eyebrow text-muted-foreground mt-1">Token Threshold</div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          {user ? (
            <Link href="/portfolio">
              <Button className="w-full">
                View Membership Perks
              </Button>
            </Link>
          ) : (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Connect your wallet to access member-only benefits
              </p>
              <Button variant="outline" className="w-full">
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
