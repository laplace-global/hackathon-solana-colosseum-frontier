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
  TrendingUp, 
  Shield, 
  Calendar,
  DollarSign,
  Check,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { hotels } from '@/data/hotels';
import { HotelUnit } from '@/types/hotel';
import { loadLocalAccountSecret } from '@/lib/chain/storage';
import { useMarketPrices } from '@/contexts/market-prices-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function HotelPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { address, rlusdBalance, hasRlusdAsset, refreshBalances } = useWallet();
  const { isLoading: isPricesLoading, hasPriceForHotel, getTokenPrice } = useMarketPrices();
  const hotel = hotels.find(h => h.id === params.id);
  
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
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[360px] overflow-hidden md:h-[60vh]">
        <HotelImage
          src={hotel.thumbnail}
          alt={hotel.name}
          className=""
          fallbackClassName="bg-card"
        />
        <div className="absolute inset-0 lp-veil" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-eyebrow text-primary mb-3">{hotel.location}, {hotel.country}</p>
            <h1 className="font-serif text-5xl font-light text-foreground sm:text-6xl md:text-7xl">
              {hotel.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/92 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-eyebrow text-muted-foreground">Guaranteed ROI</p>
              <p className="mt-1 font-serif text-2xl font-light text-primary">{hotel.roiGuaranteed}</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground">Buyback Option</p>
              <p className="mt-1 font-serif text-2xl font-light text-foreground">{hotel.buybackPercentage}% Year {hotel.buybackYear}</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground">Token Price</p>
              {isPricesLoading && !hasPriceForHotel(hotel.id) ? (
                <Skeleton className="mt-1 h-6 w-20" />
              ) : (
                <p className="mt-1 font-serif text-2xl font-light text-foreground">${tokenPrice}</p>
              )}
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground">Available Units</p>
              <p className="mt-1 font-serif text-2xl font-light text-foreground">{hotel.availableUnits}/{hotel.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[420px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Card className="rounded-none">
              <CardContent className="p-8">
                <p className="text-eyebrow text-primary mb-3">Property</p>
                <h2 className="mb-6 font-serif text-3xl font-light text-foreground">About This Property</h2>
                <p className="mb-8 text-muted-foreground leading-relaxed">
                  {hotel.description}
                </p>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-4 text-eyebrow text-muted-foreground">Key Features</h3>
                    <ul className="space-y-2">
                      {hotel.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-foreground">
                          <Check className="mr-2 h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-4 text-eyebrow text-muted-foreground">Investment Highlights</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Guaranteed Returns</p>
                          <p className="text-sm text-muted-foreground">
                            {hotel.roiGuaranteed} annual returns
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Buyback Protection</p>
                          <p className="text-sm text-muted-foreground">
                            {hotel.buybackPercentage}% buyback in year {hotel.buybackYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Free Annual Stays</p>
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
            <Card className="rounded-none">
              <CardContent className="p-8">
                <p className="text-eyebrow text-primary mb-3">Inventory</p>
                <h2 className="mb-6 font-serif text-3xl font-light text-foreground">Available Unit Types</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm">
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4">Size</th>
                        <th className="pb-3 pr-4">Price</th>
                        <th className="pb-3 pr-4">Available</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {hotel.units.map((unit) => {
                        const availablePercentage = (unit.availableTokens / unit.totalTokens) * 100;
                        
                        return (
                          <tr key={unit.id} className="text-sm">
                            <td className="py-4 pr-4">
                              <Badge variant="outline">{unit.type}</Badge>
                            </td>
                            <td className="py-4 pr-4 font-medium">{unit.name}</td>
                            <td className="py-4 pr-4">
                              {unit.size} {unit.sizeUnit}
                            </td>
                            <td className="py-4 pr-4">
                              <div>
                                <p className="font-semibold text-foreground">${unit.totalPrice.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${unit.pricePerSqm}/m²
                                </p>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <div>
                                <p className="font-medium text-foreground">{availablePercentage.toFixed(0)}%</p>
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
            <Card className="rounded-none">
              <CardContent className="p-8">
                <p className="text-eyebrow text-primary mb-3">FAQ</p>
                <h2 className="mb-6 font-serif text-3xl font-light text-foreground">Frequently Asked Questions</h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-2 font-serif text-lg font-light text-foreground">What is tokenization?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Tokenization divides property ownership into digital tokens on the blockchain,
                      allowing fractional investment with full transparency and security.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-lg font-light text-foreground">How do I receive returns?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Returns are automatically distributed to your wallet quarterly.
                      The {hotel.roiGuaranteed} is guaranteed regardless of hotel occupancy.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-lg font-light text-foreground">What about the buyback guarantee?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You can sell your tokens back at {hotel.buybackPercentage}% of the purchase price
                      in year {hotel.buybackYear}, providing a clear exit strategy.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-lg font-light text-foreground">Are there any additional fees?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
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
          rlusdBalance={rlusdBalance}
          userAddress={address}
          accountSecret={accountSecret}
          hasRlusdAsset={hasRlusdAsset}
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
