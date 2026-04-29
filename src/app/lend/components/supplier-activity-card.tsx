import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { SupplierEvent } from '../types';

interface SupplierActivityCardProps {
  isLoading: boolean;
  events: SupplierEvent[];
}

export function SupplierActivityCard({ isLoading, events }: SupplierActivityCardProps) {
  return (
    <Card className="rounded-none border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-foreground">Supplier Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`supplier-event-skeleton-${index}`}
                tone="light"
                className="h-[66px] border border-border bg-card"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No supplier activity yet for this market.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-center justify-between border border-border bg-card p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        event.status === 'COMPLETED' ? 'default' : event.status === 'FAILED' ? 'destructive' : 'secondary'
                      }
                      className={
                        event.status === 'COMPLETED'
                          ? 'rounded-none bg-primary/10 text-primary'
                          : event.status === 'FAILED'
                            ? 'rounded-none bg-destructive text-destructive-foreground'
                            : 'rounded-none bg-card text-muted-foreground border border-border'
                      }
                    >
                      {event.status}
                    </Badge>
                    <span className="truncate text-sm text-foreground">
                      {event.eventType.replace('LENDING_', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.amount ? `${event.amount} ${event.currency ?? ''}` : 'No amount'}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
