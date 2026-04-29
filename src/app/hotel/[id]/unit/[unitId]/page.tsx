'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { HotelImage } from '@/components/hotel-image';
import { ImageGallery } from '@/components/image-gallery';
import { 
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  Eye,
  Users,
  Wifi,
  AirVent,
  Tv,
  Coffee,
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  Calculator,
  ChevronRight,
  Home,
  LogIn,
  ShoppingCart
} from 'lucide-react';
import { hotels } from '@/data/hotels';
import { useAuth } from '@/contexts/auth-context';
import { LoginDialog } from '@/components/login-dialog';
import { PurchaseConfirmationDialog } from '@/components/purchase-confirmation-dialog';
import { OnrampDialog } from '@/components/onramp-dialog';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/wallet-context';
import { loadLocalAccountSecret } from '@/lib/chain/storage';
import { useMarketPrices } from '@/contexts/market-prices-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { address, rlusdBalance, hasRlusdAsset, refreshBalances } = useWallet();
  const { isLoading: isPricesLoading, hasPriceForHotel, getTokenPrice } = useMarketPrices();
  const hotel = hotels.find(h => h.id === params.id);
  const unit = hotel?.units.find(u => u.id === params.unitId);
  
  const [tokenAmount, setTokenAmount] = useState(100);
  const [investmentYears, setInvestmentYears] = useState(5);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(100);
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

  if (!hotel || !unit) {
    return <div>Unit not found</div>;
  }

  const tokenPrice = getTokenPrice(hotel.id, hotel.tokenPrice);
  const showTokenPriceSkeleton = isPricesLoading && !hasPriceForHotel(hotel.id);
  const investmentAmount = tokenAmount * tokenPrice;
  const annualReturn = investmentAmount * (hotel.roiPercentage / 100);
  const totalReturns = annualReturn * investmentYears;
  const totalValue = investmentAmount + totalReturns;
  const buybackValue = investmentAmount * (hotel.buybackPercentage / 100);

  // Mock unit images
  const unitImages = [
    `/images/${hotel.id}-unit-1.jpg`,
    `/images/${hotel.id}-unit-2.jpg`,
    `/images/${hotel.id}-unit-3.jpg`,
    `/images/${hotel.id}-unit-4.jpg`,
  ];

  const amenities = [
    { icon: Wifi, name: 'High-Speed WiFi' },
    { icon: AirVent, name: 'Air Conditioning' },
    { icon: Tv, name: 'Smart TV' },
    { icon: Coffee, name: 'Coffee Maker' },
  ];

  const handlePurchase = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = () => {
    // This will be called by the confirmation dialog
    // The success toast and redirect will be handled by onSuccess
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
    toast.success('Purchase successful!', {
      description: `You've purchased ${purchaseAmount} tokens for ${unit.name}`,
    });
    router.push('/portfolio');
  };

  const purchaseTotal = purchaseAmount * tokenPrice;

  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/hotel/${hotel.id}`} className="hover:text-foreground">
                  {hotel.name}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>Unit Details</span>
              </div>
              <h1 className="mt-1 font-serif text-3xl font-light text-foreground md:text-4xl">{unit.name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <HotelImage
          src={unitImages[0]}
          alt={unit.name}
          className=""
          fallbackClassName="bg-card"
        />
        <div className="absolute inset-0 lp-veil" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between">
          <Badge className="rounded-none bg-background/80 text-foreground border border-border">{unit.type}</Badge>
          <Badge className="rounded-none bg-primary/10 text-primary">
            {unit.availableTokens.toLocaleString()} tokens available
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Purchase Form - Primary View */}
        <Card className="mb-8 rounded-none border-border bg-card">
          <CardContent className="p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-eyebrow text-primary mb-3">Invest</p>
                <h2 className="mb-6 font-serif text-3xl font-light text-foreground">Invest in {unit.name}</h2>
                <div className="space-y-5">
                  <div className="flex items-center justify-between border border-border bg-background p-4">
                    <div>
                      <p className="text-eyebrow text-muted-foreground">Token Price</p>
                      {showTokenPriceSkeleton ? (
                        <Skeleton className="mt-2 h-7 w-24" />
                      ) : (
                        <p className="mt-1 font-serif text-2xl font-light text-foreground">${tokenPrice}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-eyebrow text-muted-foreground">Available</p>
                      <p className="mt-1 font-serif text-2xl font-light text-foreground">{unit.availableTokens.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-eyebrow text-muted-foreground">
                      Number of Tokens
                    </label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPurchaseAmount(Math.max(1, purchaseAmount - 10))}
                        disabled={purchaseAmount <= 1}
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min="1"
                        max={unit.availableTokens}
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
                        className="w-full border border-border bg-background px-4 py-2 text-center text-lg font-semibold text-foreground"
                        data-testid="purchase-token-amount-input"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPurchaseAmount(Math.min(unit.availableTokens, purchaseAmount + 10))}
                        disabled={purchaseAmount >= unit.availableTokens}
                      >
                        +
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Min: 1 token • Max: {unit.availableTokens.toLocaleString()} tokens
                    </p>
                  </div>

                  <div className="border-t border-border pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-eyebrow text-muted-foreground">Total Investment</span>
                      <span className="font-serif text-3xl font-light text-foreground">${purchaseTotal.toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Expected annual return: ${(purchaseTotal * hotel.roiPercentage / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-primary/10 p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-eyebrow text-primary">
                    <Shield className="h-4 w-4 text-primary" />
                    Investment Protection
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-foreground">{hotel.roiGuaranteed} guaranteed annual returns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-foreground">{hotel.buybackPercentage}% buyback option in year {hotel.buybackYear}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-foreground">13 nights free stay annually</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={purchaseAmount < 1 || purchaseAmount > unit.availableTokens}
                  data-testid="purchase-open-dialog"
                >
                  {user ? (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Purchase {purchaseAmount} Tokens
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Login to Purchase
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    Create an account instantly with social login
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Maximize className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-eyebrow text-muted-foreground">Size</p>
                  <p className="mt-1 font-serif text-lg font-light text-foreground">{unit.size} {unit.sizeUnit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-eyebrow text-muted-foreground">View</p>
                  <p className="mt-1 font-serif text-lg font-light text-foreground">{unit.view}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-eyebrow text-muted-foreground">Total Price</p>
                  <p className="mt-1 font-serif text-lg font-light text-foreground">${unit.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-eyebrow text-muted-foreground">Price/m²</p>
                  <p className="mt-1 font-serif text-lg font-light text-foreground">${unit.pricePerSqm}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Unit Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-4 font-semibold">Room Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Bed className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Sleeping Arrangement</p>
                          <p className="text-sm text-muted-foreground">
                            {unit.type === 'Studio' ? '1 King Bed' : 
                             unit.type === 'Suite' ? '1 King Bed + Sofa Bed' : 
                             '2 Queen Beds'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Bath className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Bathroom</p>
                          <p className="text-sm text-muted-foreground">
                            {unit.type === 'Suite' ? 'Separate shower and bathtub' : 'Shower/tub combination'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Maximum Occupancy</p>
                          <p className="text-sm text-muted-foreground">
                            {unit.type === 'Studio' ? '2 guests' : 
                             unit.type === 'Suite' ? '4 guests' : 
                             '3 guests'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 font-semibold">Amenities</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <amenity.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 font-semibold">View Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {unit.view === 'Ocean View' && 
                      'Enjoy breathtaking panoramic views of the ocean from your private balcony. Watch the sunrise over the water and enjoy the calming sounds of the waves.'}
                    {unit.view === 'City View' && 
                      'Take in the vibrant city skyline from your room. Perfect for those who love the energy of urban life with stunning views of the cityscape, especially beautiful at night.'}
                    {unit.view === 'Garden View' && 
                      'Overlook our beautifully landscaped tropical gardens. A peaceful retreat with lush greenery and colorful flora visible from your window.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Unit Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGallery images={unitImages} hotelName={`${hotel.name} - ${unit.name}`} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Value</p>
                      <p className="text-2xl font-bold">${unit.totalPrice.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ${unit.pricePerSqm} per m²
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Token Information</p>
                      <p className="font-medium">{unit.totalTokens.toLocaleString()} total tokens</p>
                      {showTokenPriceSkeleton ? (
                        <Skeleton className="mt-1 h-5 w-32" />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          ${tokenPrice} per token
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Availability</p>
                      <p className="font-medium text-foreground">{unit.availableTokens.toLocaleString()} tokens available</p>
                      <div className="mt-2 h-1 w-full overflow-hidden bg-card">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(unit.availableTokens / unit.totalTokens) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {((unit.availableTokens / unit.totalTokens) * 100).toFixed(1)}% available
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-primary/10 p-5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <p className="text-eyebrow text-primary">Guaranteed Returns</p>
                      </div>
                      <p className="mt-3 font-serif text-3xl font-light text-primary">
                        {hotel.roiGuaranteed}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Annual returns guaranteed
                      </p>
                    </div>

                    <div className="border border-border p-5">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <p className="text-eyebrow text-muted-foreground">Buyback Option</p>
                      </div>
                      <p className="mt-3 font-serif text-3xl font-light text-foreground">
                        {hotel.buybackPercentage}%
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        In year {hotel.buybackYear}
                      </p>
                    </div>

                    <div className="border border-border p-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <p className="text-eyebrow text-muted-foreground">Free Stays</p>
                      </div>
                      <p className="mt-3 font-serif text-3xl font-light text-foreground">
                        13 nights
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Per year for investors
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-medium">
                      <span>Number of Tokens</span>
                      <span className="font-normal text-muted-foreground">{tokenAmount.toLocaleString()} tokens</span>
                    </label>
                    <Slider
                      value={[tokenAmount]}
                      onValueChange={(value) => setTokenAmount(value[0])}
                      min={1}
                      max={unit.availableTokens}
                      step={1}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max: {unit.availableTokens.toLocaleString()} tokens
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-medium">
                      <span>Investment Period</span>
                      <span className="font-normal text-muted-foreground">{investmentYears} years</span>
                    </label>
                    <Slider
                      value={[investmentYears]}
                      onValueChange={(value) => setInvestmentYears(value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="mb-2"
                    />
                  </div>
                </div>

                <div className="bg-card border border-border p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-eyebrow text-muted-foreground">
                    <Calculator className="h-4 w-4" />
                    Investment Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Initial Investment</span>
                      <span className="font-medium text-foreground">${investmentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Return ({hotel.roiPercentage}%)</span>
                      <span className="font-medium text-foreground">${annualReturn.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Returns ({investmentYears} years)</span>
                      <span className="font-medium text-primary">+${totalReturns.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-eyebrow text-muted-foreground">Total Value</span>
                        <span className="font-serif text-2xl font-light text-foreground">${totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                    {investmentYears >= hotel.buybackYear && (
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Buyback Value (Year {hotel.buybackYear})
                          </span>
                          <span className="font-medium text-primary">${buybackValue.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link href={`/hotel/${hotel.id}?unit=${unit.id}&tokens=${tokenAmount}`}>
                    Purchase {tokenAmount} Tokens
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

      {/* Purchase Confirmation Dialog */}
      <PurchaseConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        hotelName={hotel.name}
        hotelId={hotel.id}
        unitName={unit.name}
        unitId={unit.id}
        unitType={unit.type}
        tokenAmount={purchaseAmount}
        maxTokenAmount={unit.availableTokens}
        onTokenAmountChange={setPurchaseAmount}
        tokenPrice={tokenPrice}
        totalPrice={purchaseTotal}
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
