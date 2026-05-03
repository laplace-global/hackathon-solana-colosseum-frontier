'use client';

import Link from 'next/link';
import { catalogProperties, type CatalogProperty } from '@/data/catalog-properties';

const stats = [
  { label: 'Assets Tokenized', value: '$2.4B' },
  { label: 'Properties Available', value: String(catalogProperties.length) },
  { label: 'Avg. Annual Yield', value: '8.3%' },
  { label: 'Minimum Entry', value: '$100' },
];

const cities = [
  'Dubai',
  'Tokyo',
  'Paris',
  'New York',
  'Solana Devnet',
  'USDC Liquidity',
  'RWA Credit',
];

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HomePage() {
  const heroProperty = catalogProperties[0];

  return (
    <div className="bg-background text-foreground">
      <section className="relative h-screen min-h-[680px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroProperty.imageUrl})`,
            animation: 'lp-kenburns 18s ease-in-out forwards',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,9,6,1)_0%,rgba(10,9,6,.78)_25%,rgba(10,9,6,.24)_58%,rgba(10,9,6,.38)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(to_right,rgba(10,9,6,.52),rgba(10,9,6,0))]" />

        <div id="founding" className="absolute left-6 top-[116px] z-10 w-[260px] md:left-16 md:top-[122px] md:w-[340px]">
          <div className="flex items-center gap-3">
            <span className="h-px w-5 bg-primary/70" />
            <p className="text-[7px] font-light uppercase tracking-[0.34em] text-primary">Founding Member</p>
          </div>
          <h2 className="mt-5 font-serif text-[26px] font-light leading-[1.18] text-foreground/82">
            Limited founding spots.
          </h2>
          <p className="mt-3 font-serif text-sm italic text-foreground/54">First in. First to own.</p>
          <p className="mt-3 max-w-[270px] text-[10px] tracking-normal text-muted-foreground/80">
            Pre-sale · Zero fees · Priority allocation
          </p>
          <form
            className="mt-5 flex w-[240px] border border-foreground/12 bg-background/45 backdrop-blur-sm"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="founding-email" className="sr-only">
              Email
            </label>
            <input
              id="founding-email"
              type="email"
              placeholder="Email address"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[10px] text-foreground outline-none placeholder:text-foreground/28"
            />
            <button
              type="submit"
              className="bg-primary px-4 text-[8px] font-light uppercase tracking-[0.24em] text-primary-foreground transition-colors hover:bg-primary/85"
            >
              Join →
            </button>
          </form>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-[92px] md:px-16">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="h-px w-7 bg-primary/70" />
            <p className="text-[8px] font-light uppercase tracking-[0.36em] text-primary">
              Tokenized Luxury Real Estate
            </p>
            <p className="text-[8px] font-light uppercase tracking-[0.34em] text-foreground/34">On Solana</p>
          </div>
          <h1 className="mt-8 max-w-[920px] font-serif text-[clamp(48px,5.7vw,82px)] font-light leading-[1.04] tracking-normal text-foreground md:text-[clamp(62px,5.7vw,82px)]">
            <span className="block animate-[lp-line-up_1.1s_cubic-bezier(.16,1,.3,1)_both] md:whitespace-nowrap">
              Buy real estate,
            </span>
            <span className="block animate-[lp-line-up_1.1s_.18s_cubic-bezier(.16,1,.3,1)_both] md:whitespace-nowrap">
              1-click, from 1 SOL.
            </span>
          </h1>
          <p className="mt-6 font-serif text-lg font-light italic text-foreground/55">
            The world's greatest hotel brands,
          </p>
          <p className="mt-2 max-w-[470px] text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Asset-backed. Fully compliant. Pay with SOL via Phantom.
          </p>
          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href="/discover"
              className="group relative flex h-[48px] w-[214px] items-center justify-center overflow-hidden border border-foreground/30 text-[8px] font-light uppercase tracking-[0.28em] text-foreground transition-colors duration-500 hover:border-foreground/55"
            >
              Explore Properties
              <span className="absolute bottom-0 left-[-100%] h-px w-full bg-primary transition-[left] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:left-0" />
            </Link>
            <Link
              href="#portfolio"
              className="group flex h-[48px] w-fit items-center text-[8px] font-light uppercase tracking-[0.28em] text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              How It Works ↓
            </Link>
          </div>
        </div>

        <div className="absolute bottom-11 left-6 z-10 flex items-center gap-4 text-[7px] font-light uppercase tracking-[0.32em] text-foreground/34 md:left-16">
          <span className="h-px w-10 bg-primary/70" />
          Scroll
        </div>
      </section>

      <section className="relative border-y border-border bg-card">
        <div className="absolute inset-x-16 top-0 h-px lp-hairline-glow opacity-40" />
        <div className="grid grid-cols-2 gap-px bg-border px-px py-px md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card px-6 py-16 text-center md:py-20">
              <p className="font-serif text-5xl font-light leading-none text-foreground md:text-6xl">{stat.value}</p>
              <p className="text-eyebrow mt-5 text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border-b border-border bg-background py-4">
        <div className="flex w-max animate-[lp-marquee_34s_linear_infinite] items-center">
          {[...cities, ...cities].map((city, index) => (
            <span key={`${city}-${index}`} className="flex items-center gap-6 px-10">
              <span className="block h-0.5 w-0.5 rounded-full bg-primary" />
              <span className="text-uilink whitespace-nowrap text-foreground/35">{city}</span>
            </span>
          ))}
        </div>
      </div>

      <section id="portfolio" className="px-6 py-24 md:px-16 md:py-32">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-eyebrow mb-5 text-primary">World Portfolio</p>
            <h2 className="font-serif text-5xl font-light leading-[1.04] text-foreground md:text-7xl">
              A World of
              <br />
              Possibility
            </h2>
          </div>
          <Link href="/discover" className="text-uibtn text-foreground/50 transition-colors hover:text-foreground">
            View All Properties →
          </Link>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
          {catalogProperties.slice(0, 5).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
          <div className="flex aspect-[3/4] flex-col items-center justify-center bg-card p-10 text-center">
            <span className="block h-px w-12 bg-primary/40" />
            <p className="text-eyebrow mt-9 text-primary">Priority Ledger</p>
            <h3 className="mt-5 font-serif text-3xl font-light leading-[1.25] text-foreground">
              Reserved for
              <br />
              early members.
            </h3>
            <p className="mt-4 max-w-xs font-serif text-sm italic leading-7 text-muted-foreground">
              Watchlist new assets and receive availability updates before purchase windows open.
            </p>
            <Link
              href="/discover"
              className="text-uibtn mt-9 border border-primary/30 px-9 py-3.5 text-primary transition-colors duration-300 hover:border-primary/60"
            >
              Enter Catalog →
            </Link>
            <span className="mt-9 block h-px w-12 bg-primary/40" />
          </div>
        </div>
      </section>
    </div>
  );
}

function PropertyCard({ property }: { property: CatalogProperty }) {
  return (
    <article className="group relative aspect-[3/4] overflow-hidden bg-background">
      <Link href={`/hotel/${property.id}`} className="absolute inset-0" aria-label={property.name}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
          style={{ backgroundImage: `url(${property.imageUrl})` }}
        />
        <div className="absolute inset-0 lp-veil-card" />
        <span className="absolute left-0 top-0 z-10 h-0 w-px bg-primary transition-[height] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:h-full" />
        <p className="text-eyebrow absolute left-7 top-7 text-foreground/55">{property.location}</p>
        <div className="absolute right-6 top-6 border border-primary/30 bg-background/60 px-4 py-2.5 text-right text-primary backdrop-blur-sm">
          <p className="font-serif text-2xl font-light leading-none">{property.annualYield}%</p>
          <p className="text-eyebrow mt-1 text-primary/70">p.a.</p>
        </div>
        <div className="absolute inset-x-7 bottom-7">
          <p className="text-eyebrow text-foreground/55">{property.type}</p>
          <h3 className="mt-3 font-serif text-2xl font-light leading-tight text-foreground">{property.name}</h3>
          <p className="mt-3 text-bodyeditorial text-foreground/55">
            From {formatUsd(property.tokenPriceUsd)} · +{property.fiveYearEstimate}% est. 5yr
          </p>
          <div className="mt-5 h-px w-full bg-foreground/15">
            <div className="h-px bg-primary" style={{ width: `${property.fundingProgress}%` }} />
          </div>
        </div>
      </Link>
    </article>
  );
}
