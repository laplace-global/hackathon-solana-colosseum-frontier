import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Users,
  Shield,
  Award,
  FileText,
  Download,
  Check
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Hero Section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <p className="text-eyebrow text-primary mb-6">Established 2012</p>
            <h1 className="font-serif text-5xl font-light text-foreground sm:text-6xl md:text-7xl">
              LAPLACE
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-bodyeditorial text-muted-foreground">
              A leading real estate tokenization platform revolutionizing property investment
              through blockchain technology and guaranteed returns.
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-eyebrow text-primary mb-4">Our Story</p>
              <h2 className="mb-6 font-serif text-3xl font-light text-foreground md:text-4xl">
                Pioneering Tokenized Real Estate
              </h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Founded by Dato&apos; Leong Sir Ley, LAPLACE has grown from a
                boutique real estate firm to a global leader in property tokenization.
                We specialize in transforming premium hotel assets into accessible investment
                opportunities through blockchain technology.
              </p>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Our flagship projects, THE SAIL and NYRA in Malaysia&apos;s Melaka Waterfront
                Economic Zone, represent the future of real estate investment - combining
                guaranteed returns, buyback protection, and the security of blockchain technology.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With zero bank debt and a track record of successful asset restructuring,
                we offer investors a unique combination of stability, transparency, and growth potential.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-none">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-primary/10">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-light text-foreground">Global Presence</h3>
                  <p className="text-sm text-muted-foreground">
                    Offices in Hong Kong, Shanghai, Tokyo, Osaka, and UK
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-light text-foreground">400+ Monthly</h3>
                  <p className="text-sm text-muted-foreground">
                    Investors visiting our properties through our tourism program
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-light text-foreground">Zero Debt</h3>
                  <p className="text-sm text-muted-foreground">
                    Fully self-funded operations with no bank debt
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-light text-foreground">Award Winning</h3>
                  <p className="text-sm text-muted-foreground">
                    Multiple industry awards for innovation and excellence
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Malaysia Section */}
      <section className="border-t border-border px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-eyebrow text-primary mb-4">Investment Destination</p>
            <h2 className="mb-6 font-serif text-3xl font-light text-foreground md:text-5xl">Why Malaysia?</h2>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 font-serif text-xl font-light text-foreground">Strategic Location & Growth</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Southeast Asia&apos;s strategic hub with excellent connectivity</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Stable political environment and strong legal framework</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Growing tourism sector with 26 million visitors annually</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>English-speaking nation with multicultural society</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-serif text-xl font-light text-foreground">Investment Advantages</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>No capital gains tax for property investments</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Foreign ownership allowed for properties above RM 1 million</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>MM2H program for long-term residency</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Currency stability and low inflation rate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* M-WEZ Section */}
      <section className="border-t border-border bg-card px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-eyebrow text-primary mb-4">Government Backed Initiative</p>
            <h2 className="mb-6 font-serif text-3xl font-light text-foreground md:text-5xl">
              Melaka Waterfront Economic Zone (M-WEZ)
            </h2>
            <p className="mx-auto max-w-3xl text-muted-foreground leading-relaxed">
              Our properties are part of Malaysia&apos;s mega-development program targeting
              RM 100 billion in investments and creating 20,000 jobs annually. This government-backed
              initiative ensures long-term value appreciation and sustainable returns for our investors.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="font-serif text-5xl font-light text-primary">RM 100B</p>
              <p className="mt-3 text-eyebrow text-muted-foreground">Target Investment</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-5xl font-light text-primary">20,000</p>
              <p className="mt-3 text-eyebrow text-muted-foreground">Annual Jobs</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-5xl font-light text-primary">2 Hotels</p>
              <p className="mt-3 text-eyebrow text-muted-foreground">Premium Properties</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-eyebrow text-primary mb-4">Library</p>
            <h2 className="mb-12 font-serif text-3xl font-light text-foreground md:text-5xl">Investment Resources</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="group cursor-pointer rounded-none transition-colors hover:bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-serif text-lg font-light text-foreground">THE SAIL Hotel Prospectus</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detailed investment information for THE SAIL Hotel Tower including
                      financial projections, unit types, and guaranteed returns structure.
                    </p>
                  </div>
                  <Download className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer rounded-none transition-colors hover:bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-serif text-lg font-light text-foreground">NYRA Hotel Prospectus</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete investment guide for NYRA Oceanview Hotel featuring
                      8% guaranteed returns and 9-year buyback option details.
                    </p>
                  </div>
                  <Download className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-eyebrow text-primary mb-4">Begin</p>
          <h2 className="mb-6 font-serif text-3xl font-light text-foreground md:text-5xl">Ready to Invest?</h2>
          <p className="mb-10 text-muted-foreground leading-relaxed">
            Join thousands of investors earning guaranteed returns through tokenized real estate
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <a href="/discover">View Properties</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:invest@shengtai.com">Contact Us</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
