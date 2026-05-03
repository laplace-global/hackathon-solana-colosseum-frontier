'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGallery } from '@/components/image-gallery';
import { HotelImage } from '@/components/hotel-image';
import { PurchaseConfirmationDialog } from '@/components/purchase-confirmation-dialog';
import { OnrampDialog } from '@/components/onramp-dialog';
import { TokenHolderBenefits } from '@/components/token-holder-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/contexts/wallet-context';
import { LoginDialog } from '@/components/login-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Bell,
  Bookmark,
  MapPin,
  TrendingUp, 
  Shield, 
  Calendar,
  Check,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { hotels } from '@/data/hotels';
import {
  getCatalogProperty,
  purchasableOnlyMessage,
  type CatalogProperty,
} from '@/data/catalog-properties';
import { HotelUnit } from '@/types/hotel';
import { loadLocalAccountSecret } from '@/lib/chain/storage';
import { useMarketPrices } from '@/contexts/market-prices-context';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function HotelPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { address, usdcBalance, hasUsdcAsset, refreshBalances } = useWallet();
  const { isLoading: isPricesLoading, hasPriceForHotel, getTokenPrice } = useMarketPrices();
  const propertyId = typeof params.id === 'string' ? params.id : '';
  const hotel = hotels.find(h => h.id === propertyId);
  const catalogProperty = getCatalogProperty(propertyId);
  
  const [selectedUnit, setSelectedUnit] = useState<HotelUnit | null>(null);
  const [tokenAmount, setTokenAmount] = useState(100);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);
  const [onrampAmount, setOnrampAmount] = useState(0);
  const [onOnrampComplete, setOnOnrampComplete] = useState<(() => void) | null>(null);
  const [accountSecret, setAccountSecret] = useState<string | null>(null);

  useEffect(() => {
    setAccountSecret(loadLocalAccountSecret());
  }, []);

  useEffect(() => {
    if (showConfirmDialog) {
      setAccountSecret(loadLocalAccountSecret());
    }
  }, [address, showConfirmDialog]);

  if (!hotel) {
    if (catalogProperty) {
      return <CatalogPropertyPage property={catalogProperty} />;
    }

    return <div>Hotel not found</div>;
  }

  const handleUnitSelect = (unit: HotelUnit) => {
    setSelectedUnit(unit);
    setTokenAmount(100);
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = () => {
    // This will be called by the confirmation dialog
    // The old checkout dialog is no longer needed
  };

  const handleOnrampRequest = (amount: number, onComplete: () => void) => {
    setOnrampAmount(amount);
    setOnOnrampComplete(() => onComplete);
    setShowConfirmDialog(false);
    setShowOnramp(true);
  };

  const handleOnrampSuccess = async () => {
    await refreshBalances();
    setShowOnramp(false);
    if (onOnrampComplete) {
      setShowConfirmDialog(true);
      onOnrampComplete();
      setOnOnrampComplete(null);
    }
  };

  const handlePurchaseSuccess = () => {
    toast.success('Token purchase confirmed!', {
      description: `You've successfully purchased ${tokenAmount} tokens for ${selectedUnit?.name}.`,
    });
    router.push('/portfolio');
  };

  const tokenPrice = getTokenPrice(hotel.id, hotel.tokenPrice);
  const subtotal = selectedUnit ? tokenAmount * tokenPrice : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[520px] overflow-hidden">
        <HotelImage
          src={hotel.thumbnail}
          alt={hotel.name}
          className="brightness-[0.78]"
          fallbackClassName="bg-card"
        />
        <div className="absolute inset-0 lp-veil" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-16 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <Badge variant="outline" className="mb-5 border-primary/50 bg-background/40 text-primary backdrop-blur">
              {hotel.location}, {hotel.country}
            </Badge>
            <h1 className="max-w-4xl font-serif text-5xl font-light leading-[1.04] text-foreground sm:text-7xl">
              {hotel.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="sticky top-[72px] z-30 border-y border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-px sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            <div className="bg-card p-4">
              <p className="text-eyebrow text-muted-foreground">Guaranteed ROI</p>
              <p className="mt-2 font-serif text-2xl font-light">{hotel.roiGuaranteed}</p>
            </div>
            <div className="bg-card p-4">
              <p className="text-eyebrow text-muted-foreground">Buyback Option</p>
              <p className="mt-2 font-serif text-2xl font-light">{hotel.buybackPercentage}% Year {hotel.buybackYear}</p>
            </div>
            <div className="bg-card p-4">
              <p className="text-eyebrow text-muted-foreground">Token Price</p>
              {isPricesLoading && !hasPriceForHotel(hotel.id) ? (
                <Skeleton className="mt-1 h-5 w-20" />
              ) : (
                <p className="mt-2 font-serif text-2xl font-light">${tokenPrice}</p>
              )}
            </div>
            <div className="bg-card p-4">
              <p className="text-eyebrow text-muted-foreground">Available Units</p>
              <p className="mt-2 font-serif text-2xl font-light">{hotel.availableUnits}/{hotel.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16 lg:px-16">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[420px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 font-serif text-3xl font-light">About This Property</h2>
                <p className="mb-6 text-bodyeditorial text-muted-foreground">
                  {hotel.description}
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-eyebrow text-primary">Key Features</h3>
                    <ul className="space-y-2">
                      {hotel.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 text-eyebrow text-primary">Investment Highlights</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-serif text-lg font-light">Guaranteed Returns</p>
                          <p className="text-sm text-muted-foreground">
                            {hotel.roiGuaranteed} annual returns
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-serif text-lg font-light">Buyback Protection</p>
                          <p className="text-sm text-muted-foreground">
                            {hotel.buybackPercentage}% buyback in year {hotel.buybackYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 text-[var(--lp-solana)]" />
                        <div>
                          <p className="font-serif text-lg font-light">Free Annual Stays</p>
                          <p className="text-sm text-muted-foreground">
                            13 nights per year for investors
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Holder Benefits */}
            <TokenHolderBenefits hotelId={hotel.id} hotelName={hotel.name} />
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-6 font-serif text-3xl font-light">Available Unit Types</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left text-eyebrow text-muted-foreground">
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4">Size</th>
                        <th className="pb-3 pr-4">Price</th>
                        <th className="pb-3 pr-4">Available</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hotel.units.map((unit) => {
                        const availablePercentage = (unit.availableTokens / unit.totalTokens) * 100;

                        return (
                          <tr key={unit.id} className="text-sm">
                            <td className="py-4 pr-4">
                              <Badge variant="outline">{unit.type}</Badge>
                            </td>
                            <td className="py-4 pr-4 font-serif text-lg font-light">{unit.name}</td>
                            <td className="py-4 pr-4">
                              {unit.size} {unit.sizeUnit}
                            </td>
                            <td className="py-4 pr-4">
                              <div>
                                <p className="font-serif text-lg font-light">${unit.totalPrice.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${unit.pricePerSqm}/m²
                                </p>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <div>
                                <p className="font-serif text-lg font-light">{availablePercentage.toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground">
                                  {unit.availableTokens.toLocaleString()} tokens
                                </p>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <Link href={`/hotel/${hotel.id}/unit/${unit.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Info className="mr-1 h-3 w-3" />
                                    Details
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  onClick={() => handleUnitSelect(unit)}
                                  disabled={unit.availableTokens === 0}
                                >
                                  Buy Tokens
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-6 font-serif text-3xl font-light">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-serif text-xl font-light">What is tokenization?</h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Tokenization divides property ownership into digital tokens on the blockchain,
                      allowing fractional investment with full transparency and security.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-xl font-light">How do I receive returns?</h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Returns are automatically distributed to your wallet quarterly.
                      The {hotel.roiGuaranteed} is guaranteed regardless of hotel occupancy.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-xl font-light">What about the buyback guarantee?</h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      You can sell your tokens back at {hotel.buybackPercentage}% of the purchase price
                      in year {hotel.buybackYear}, providing a clear exit strategy.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-xl font-light">Are there any additional fees?</h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      No maintenance or management fees during the guaranteed return period.
                      All costs are covered by the hotel operator.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

      {/* Purchase Confirmation Dialog */}
      {selectedUnit && (
        <PurchaseConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          hotelName={hotel.name}
          hotelId={hotel.id}
          unitName={selectedUnit.name}
          unitId={selectedUnit.id}
          unitType={selectedUnit.type}
          tokenAmount={tokenAmount}
          maxTokenAmount={selectedUnit.availableTokens}
          onTokenAmountChange={setTokenAmount}
          tokenPrice={tokenPrice}
          totalPrice={subtotal}
          roiPercentage={hotel.roiPercentage}
          usdcBalance={usdcBalance}
          userAddress={address}
          accountSecret={accountSecret}
          hasUsdcAsset={hasUsdcAsset}
          refreshBalances={refreshBalances}
          onOnrampRequest={handleOnrampRequest}
          onConfirm={handleConfirmPurchase}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      <OnrampDialog
        open={showOnramp}
        onOpenChange={setShowOnramp}
        userAddress={address ?? ''}
        initialAmount={onrampAmount}
        minimumAmount={onrampAmount}
        onSuccess={() => {
          void handleOnrampSuccess();
        }}
      />
    </div>
  );
}

function CatalogPropertyPage({ property }: { property: CatalogProperty }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [notified, setNotified] = useState<string[]>([]);

  useEffect(() => {
    setWatchlist(readStoredIds(watchlistKey));
    setNotified(readStoredIds(notifyKey));
  }, []);

  const isWatching = watchlist.includes(property.id);
  const isNotified = notified.includes(property.id);

  const saveNotification = () => {
    setNotified((current) => {
      const next = current.includes(property.id) ? current : [...current, property.id];
      writeStoredIds(notifyKey, next);
      return next;
    });
  };

  const toggleWatchlist = () => {
    setWatchlist((current) => {
      const next = current.includes(property.id)
        ? current.filter((storedId) => storedId !== property.id)
        : [...current, property.id];
      writeStoredIds(watchlistKey, next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${property.imageUrl})` }}
        />
        <div className="absolute inset-0 lp-veil" />
        <div className="relative mx-auto min-h-[660px] max-w-7xl px-6 py-20 sm:px-8 lg:px-16">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </Link>

          <div className="mt-24 max-w-4xl">
            <Badge variant="outline" className="mb-5 border-primary/50 bg-background/40 text-primary backdrop-blur">
              Priority access opens soon.
            </Badge>
            <h1 className="font-serif text-5xl font-light leading-[1.04] tracking-normal text-foreground sm:text-7xl">
              {property.name}
            </h1>
            <p className="mt-6 max-w-2xl text-bodyeditorial text-muted-foreground">
              {property.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                data-testid="catalog-detail-invest"
                size="lg"
                onClick={() => window.alert(purchasableOnlyMessage)}
              >
                Invest
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button
                data-testid="catalog-detail-notify"
                size="lg"
                variant="outline"
                onClick={saveNotification}
              >
                {isNotified ? (
                  <>
                    <Check className="h-4 w-4" />
                    Notification Saved
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Get Notified
                  </>
                )}
              </Button>
              <Button
                data-testid="catalog-detail-watchlist"
                size="lg"
                variant="outline"
                onClick={toggleWatchlist}
              >
                {isWatching ? (
                  <>
                    <Check className="h-4 w-4" />
                    Watching
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Watchlist
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-px bg-border px-6 py-px sm:px-8 md:grid-cols-4 lg:px-16">
          <DetailMetric label="Annual Yield" value={`${property.annualYield}%`} />
          <DetailMetric label="Token Price" value={formatUsd(property.tokenPriceUsd)} />
          <DetailMetric label="Raise" value={`${formatUsd(property.raiseUsd / 1_000_000)}M`} />
          <DetailMetric label="LTV" value={`${property.ltvRatio}%`} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Location</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-light">
                <MapPin className="h-4 w-4 text-primary" />
                {property.location}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Developer</p>
              <p className="mt-2 text-lg font-light">{property.developer}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Catalog Symbol</p>
              <p className="mt-2 text-lg font-light">{property.symbol}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-3xl font-light tracking-normal">Property Watchlist Notes</h2>
            <p className="mt-4 text-bodyeditorial text-muted-foreground">
              Watchlist status and notification requests stay local to this browser until the asset's
              purchase window opens.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {property.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-3 border border-border p-3 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {amenity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-2xl font-light tracking-normal">{value}</p>
    </div>
  );
}
