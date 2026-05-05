'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  Filter,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  catalogProperties,
  purchasableOnlyMessage,
  type CatalogCountry,
  type CatalogProperty,
} from '@/data/catalog-properties';

const countries: CatalogCountry[] = ['All', 'UAE', 'Japan', 'France', 'USA'];
const watchlistKey = 'laplace:property-watchlist';
const notifyKey = 'laplace:property-notify';

function readStoredIds(key: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]) {
  window.localStorage.setItem(key, JSON.stringify(ids));
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DiscoverPage() {
  const [country, setCountry] = useState<CatalogCountry>('All');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [notified, setNotified] = useState<string[]>([]);

  useEffect(() => {
    setWatchlist(readStoredIds(watchlistKey));
    setNotified(readStoredIds(notifyKey));
  }, []);

  const featuredProperty = catalogProperties[0];
  const filteredProperties = useMemo(() => {
    return catalogProperties.filter((property) => {
      return country === 'All' || property.country === country;
    });
  }, [country]);

  const showPurchaseGate = () => {
    window.alert(purchasableOnlyMessage);
  };

  const toggleWatchlist = (id: string) => {
    setWatchlist((current) => {
      const next = current.includes(id)
        ? current.filter((storedId) => storedId !== id)
        : [...current, id];
      writeStoredIds(watchlistKey, next);
      return next;
    });
  };

  const saveNotification = (id: string) => {
    setNotified((current) => {
      const next = current.includes(id) ? current : [...current, id];
      writeStoredIds(notifyKey, next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${featuredProperty.imageUrl})` }}
        />
        <div className="absolute inset-0 lp-veil" />
        <div className="relative mx-auto grid min-h-[660px] max-w-7xl items-end gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">
          <div className="pb-4">
            <Badge variant="outline" className="mb-5 border-primary/50 bg-background/40 text-primary backdrop-blur">
              Global Tokenized Catalog
            </Badge>
            <h1 className="max-w-4xl font-serif text-5xl font-light leading-[1.04] tracking-normal text-foreground sm:text-7xl lg:text-8xl">
              Explore the world portfolio.
            </h1>
            <p className="mt-6 max-w-2xl text-bodyeditorial text-muted-foreground">
              Curated luxury property exposure with watchlist access, yield signals, and Solana-backed execution where assets are live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button data-testid="catalog-featured-invest" size="lg" onClick={showPurchaseGate}>
                Invest
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                data-testid="catalog-featured-notify"
                size="lg"
                variant="outline"
                onClick={() => saveNotification(featuredProperty.id)}
              >
                {notified.includes(featuredProperty.id) ? (
                  <>
                    <Check className="h-4 w-4" />
                    Notified
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Get Notified
                  </>
                )}
              </Button>
            </div>
          </div>

          <FeaturedPanel property={featuredProperty} />
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <div className="flex items-center gap-2 text-eyebrow text-muted-foreground">
            <Filter className="h-4 w-4 text-primary" />
            Region
          </div>
          <div className="flex flex-wrap gap-2">
            {countries.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={country === item ? 'default' : 'outline'}
                onClick={() => setCountry(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <p className="text-bodyeditorial text-muted-foreground">
            {filteredProperties.length} properties shown
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 sm:py-20 lg:px-16">
        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => {
            const isWatching = watchlist.includes(property.id);
            const isNotified = notified.includes(property.id);

            return (
              <article
                key={property.id}
                data-testid={`catalog-card-${property.id}`}
                className="group relative aspect-[3/4] overflow-hidden bg-background"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
                  style={{ backgroundImage: `url(${property.imageUrl})` }}
                  aria-label={property.name}
                />
                <div className="absolute inset-0 lp-veil-card" />
                <span className="absolute left-0 top-0 z-10 h-0 w-px bg-primary transition-[height] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:h-full" />

                <div className="absolute left-5 top-5 z-10 sm:left-6 sm:top-6">
                  <Badge variant="outline" className="border-foreground/15 bg-background/55 text-foreground/55 backdrop-blur">
                    {property.symbol}
                  </Badge>
                </div>

                <button
                  type="button"
                  data-testid={`catalog-card-${property.id}-watchlist`}
                  aria-label={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
                  className="absolute right-5 top-5 z-20 flex size-10 shrink-0 items-center justify-center border border-foreground/15 bg-background/55 text-foreground/50 backdrop-blur transition-colors hover:border-primary hover:text-primary sm:right-6 sm:top-6"
                  onClick={() => toggleWatchlist(property.id)}
                >
                  {isWatching ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </button>

                <div className="absolute inset-x-5 bottom-5 z-10 space-y-5 sm:inset-x-6 sm:bottom-6">
                  <div>
                    <p className="text-eyebrow mb-3 text-foreground/55">{property.type}</p>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-serif text-2xl font-light leading-tight tracking-normal text-foreground">
                        <Link href={`/hotel/${property.id}`} className="hover:text-primary">
                          {property.name}
                        </Link>
                      </h2>
                      <div className="shrink-0 text-right text-primary">
                        <p className="font-serif text-2xl font-light leading-none">{property.annualYield}%</p>
                        <p className="text-eyebrow mt-1 text-primary/70">p.a.</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-foreground/50">
                      <MapPin className="h-4 w-4 text-primary" />
                      {property.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-px border border-foreground/10 bg-border/80 text-sm">
                    <Metric label="Yield" value={`${property.annualYield}%`} />
                    <Metric label="Token" value={formatUsd(property.tokenPriceUsd)} />
                    <Metric label="Raise" value={formatUsd(property.raiseUsd / 1_000_000) + 'M'} />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between text-eyebrow text-foreground/45">
                      <span>Funding</span>
                      <span>{property.fundingProgress}%</span>
                    </div>
                    <Progress value={property.fundingProgress} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      data-testid={`catalog-card-${property.id}-invest`}
                      className="flex-1"
                      onClick={showPurchaseGate}
                    >
                      Invest
                    </Button>
                    <Button
                      data-testid={`catalog-card-${property.id}-notify`}
                      variant="outline"
                      className="flex-1"
                      onClick={() => saveNotification(property.id)}
                    >
                      {isNotified ? 'Notified' : 'Notify'}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FeaturedPanel({ property }: { property: CatalogProperty }) {
  return (
    <div className="border border-foreground/10 bg-background/60 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Featured</p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-normal">{property.name}</h2>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <Metric label="Annual Yield" value={`${property.annualYield}%`} />
        <Metric label="5Y Estimate" value={`+${property.fiveYearEstimate}%`} />
        <Metric label="Token Price" value={formatUsd(property.tokenPriceUsd)} />
        <Metric label="LTV" value={`${property.ltvRatio}%`} />
      </div>
      <p className="mt-5 text-bodyeditorial text-muted-foreground">{property.description}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card/90 p-4 backdrop-blur">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-lg font-light text-foreground">{value}</p>
    </div>
  );
}
