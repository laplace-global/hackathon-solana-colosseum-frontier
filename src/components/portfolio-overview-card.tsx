'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PortfolioOverviewCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconTone: 'blue' | 'green' | 'purple' | 'orange';
  isLoading: boolean;
  meta?: ReactNode;
}

// All tones map to teal in the Laplace brand language.
const TONE_CLASSNAME = {
  container: 'bg-primary/10 p-3',
  icon: 'h-6 w-6 text-primary',
};

export function PortfolioOverviewCard({
  label,
  value,
  icon: Icon,
  isLoading,
  meta,
}: PortfolioOverviewCardProps) {
  return (
    <Card className="rounded-none">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow text-muted-foreground">{label}</p>
            {isLoading ? (
              <>
                <Skeleton className="mt-3 h-8 w-28" />
                {meta ? <Skeleton className="mt-2 h-4 w-20" /> : null}
              </>
            ) : (
              <>
                <p className="mt-2 font-serif text-3xl font-light text-foreground">{value}</p>
                {meta}
              </>
            )}
          </div>
          <div className={TONE_CLASSNAME.container}>
            <Icon className={TONE_CLASSNAME.icon} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
