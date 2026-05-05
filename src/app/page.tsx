'use client';

import Link from 'next/link';
import { LuxuryCanvasBackground } from '@/components/luxury-canvas-background';
import { catalogProperties, type CatalogProperty } from '@/data/catalog-properties';

const stats = [
  { label: 'Tokenized', value: '$2.4B' },
  { label: 'Properties', value: String(catalogProperties.length) },
  { label: 'Avg. Yield', value: '7.8%' },
  { label: 'Min. Entry', value: '1 SOL' },
];

const cities = [
  'Dubai',
  'Abu Dhabi',
  'Ras Al Khaimah',
  'New York',
  'Paris',
  'London',
  'Los Angeles',
  'Tokyo',
  'Kyoto',
];

const protocolCards = [
  {
    number: '01',
    label: 'Invest',
    title: 'from 1 SOL',
    body: '1 click. 1 SOL. Instant ownership.',
    cta: 'Explore Properties ->',
    href: '/discover',
  },
  {
    number: '02',
    label: 'Collateral & Borrow',
    title: 'Lock & Borrow USDC',
    body: 'Lock tokens. Borrow USDC. Keep everything.',
    cta: 'Borrow USDC ->',
    href: '/borrow',
  },
  {
    number: '03',
    label: 'Reinvest',
    title: 'DeFi Yields',
    body: 'Supply USDC. Earn yield. Always on.',
    cta: 'Supply USDC ->',
    href: '/lend',
  },
];

const foundingBenefits = [
  { label: 'Pre-Sale Access', body: 'Buy rare properties 48h before public listing.' },
  { label: 'Zero Fees in Beta', body: 'No platform fees during the founding period.' },
  { label: 'Guaranteed Allocation', body: 'Reserved spot even when oversubscribed.' },
  { label: 'Private Deal Flow', body: 'Quarterly briefings and off-market previews.' },
];

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HomePage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1916]">
      <section className="relative min-h-screen overflow-hidden bg-[#0C0B09] text-white">
        <LuxuryCanvasBackground className="opacity-35" />
        <video
          className="absolute inset-0 hidden h-full w-full object-cover opacity-75 md:block"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/hero_pc.mp4" type="video/mp4" />
        </video>
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-75 md:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/hero_sp.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a0806_0%,#12100c_30%,#0d1a18_60%,#080c10_100%)] opacity-45" />
        <div className="lp-architect-grid absolute inset-0 opacity-100" />
        <div className="absolute right-[-10%] top-[-20%] h-[70%] w-[60%] animate-[lp-light-drift-1_12s_ease-in-out_infinite] bg-[radial-gradient(ellipse,rgba(200,160,80,.18)_0%,transparent_65%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[60%] w-[50%] animate-[lp-light-drift-2_16s_ease-in-out_infinite] bg-[radial-gradient(ellipse,rgba(20,180,160,.1)_0%,transparent_60%)]" />
        <div className="lp-grain absolute inset-0 opacity-[.18]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.86)_0%,rgba(0,0,0,.58)_52%,rgba(0,0,0,.18)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-5 pb-16 pt-28 md:px-16 md:pb-24 md:pt-44">
          <form
            id="founding"
            className="max-w-[420px]"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-primary" />
              <p className="text-[7px] font-medium uppercase tracking-[0.36em] text-primary">
                Founding Member Access
              </p>
            </div>
            <h2 className="mt-5 font-serif text-[clamp(24px,2.8vw,32px)] font-light leading-[1.12] tracking-normal text-white">
              The first to move. <em className="font-light">Own the most.</em>
            </h2>
            <p className="mt-3 max-w-sm text-[11px] leading-7 tracking-[0.05em] text-white/65">
              Priority access · Zero platform fees · Guaranteed spot
            </p>
            <div className="mt-6 max-w-[420px] border border-white/50 bg-black/55 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row">
                <label htmlFor="hero-email" className="sr-only">
                  Email
                </label>
                <input
                  id="hero-email"
                  type="email"
                  placeholder="your@email.com"
                  className="min-w-0 flex-1 bg-transparent px-5 py-4 text-xs tracking-[0.04em] text-white outline-none placeholder:text-white/35"
                />
                <button
                  type="submit"
                  className="bg-primary px-6 py-4 text-[8px] font-bold uppercase tracking-[0.22em] text-[#0C0B09] transition-opacity hover:opacity-85"
                >
                  Join Waitlist
                </button>
              </div>
            </div>
            <p className="mt-2 text-[9px] tracking-[0.06em] text-white/35">No spam. Priority window closes soon.</p>
          </form>

          <div className="max-w-[940px]">
            <div className="mb-9 h-px w-7 bg-primary/70" />
            <h1 className="font-serif text-[clamp(44px,8.5vw,116px)] font-extralight leading-[1.04] tracking-normal text-white md:leading-[0.98]">
              <span className="block">The world's penthouses.</span>
              <span className="block">1 SOL. 1 click.</span>
            </h1>
            <p className="mt-6 text-[clamp(12px,1.4vw,16px)] uppercase tracking-[0.12em] text-white/72">
              Borrow against your holdings - without selling.
            </p>
            <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Link
                href="/discover"
                className="group relative flex h-12 w-full items-center justify-center overflow-hidden border border-white/60 px-10 text-[8px] font-medium uppercase tracking-[0.24em] text-white transition-colors hover:border-white/80 sm:w-[230px]"
              >
                Explore Properties
                <span className="absolute bottom-0 left-[-100%] h-px w-full bg-primary transition-[left] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:left-0" />
              </Link>
              <Link
                href="#protocol"
                className="text-[8px] uppercase tracking-[0.24em] text-white/42 transition-colors hover:text-white"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-24 right-16 z-10 hidden flex-col items-end gap-4 lg:flex">
          <div className="flex items-center gap-3 border border-[#14F195]/50 bg-black/70 px-5 py-3 shadow-[0_0_32px_rgba(20,241,149,.15)] backdrop-blur-xl">
            <span className="h-[7px] w-[7px] animate-[lp-pulse_1.6s_infinite] rounded-full bg-[#14F195] shadow-[0_0_14px_rgba(20,241,149,.9)]" />
            <span className="text-[8px] font-semibold uppercase tracking-[0.26em] text-[#14F195]">Live Demo</span>
            <span className="text-[#14F195]/30">·</span>
            <SolanaMark />
            <span className="text-[7px] uppercase tracking-[0.22em] text-[#14F195]/60">Devnet</span>
          </div>
          <div className="flex items-start gap-4 text-right">
            <LiveMetric value="1 SOL" label="Min. entry" accent />
            <MetricRule />
            <LiveMetric value="9.2%" label="Avg. yield" />
            <MetricRule />
            <LiveMetric value={String(catalogProperties.length)} label="Properties" />
          </div>
        </div>

        <div className="absolute bottom-11 left-5 z-10 flex items-center gap-4 text-[7px] uppercase tracking-[0.32em] text-white/40 md:left-16">
          <span className="h-px w-10 bg-primary/70" />
          Scroll
        </div>
      </section>

      <section className="relative border-y border-black/10 bg-[#F4F3EF] px-px py-px">
        <div className="absolute inset-x-16 top-0 h-px bg-[linear-gradient(90deg,transparent,#81D8D0,transparent)] opacity-30" />
        <div className="grid grid-cols-2 gap-px bg-black/10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#F4F3EF] px-6 py-14 text-center md:py-[72px]">
              <p className="font-serif text-[clamp(34px,4.8vw,58px)] font-light leading-none text-[#1A1916]">
                {stat.value}
              </p>
              <p className="mt-4 text-[7px] uppercase tracking-[0.26em] text-[#3D3B35]/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border-b border-black/10 bg-[#FAFAF8] py-4">
        <div className="flex w-max animate-[lp-marquee_34s_linear_infinite] items-center">
          {[...cities, ...cities].map((city, index) => (
            <span key={`${city}-${index}`} className="flex items-center gap-6 px-10">
              <span className="block h-0.5 w-0.5 rounded-full bg-primary" />
              <span className="whitespace-nowrap text-[7.5px] uppercase tracking-[0.28em] text-[#3D3B35]/45">{city}</span>
            </span>
          ))}
        </div>
      </div>

      <section id="portfolio" className="bg-[#FAFAF8] pt-20 md:pt-24">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-end md:px-16">
          <div>
            <p className="mb-5 text-[7px] uppercase tracking-[0.32em] text-[#3D3B35]/70">Properties</p>
            <h2 className="font-serif text-[clamp(34px,4.6vw,54px)] font-light leading-[1.08] text-[#1A1916]">
              Own the world.
            </h2>
          </div>
          <Link
            href="/discover"
            className="border-b border-transparent pb-1 text-[7.5px] uppercase tracking-[0.22em] text-[#1A1916]/45 transition-colors hover:border-[#1A1916]/25 hover:text-[#1A1916]"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-px bg-black/10 md:grid-cols-2 lg:grid-cols-3">
          {catalogProperties.slice(0, 5).map((property, index) => (
            <PropertyCard key={property.id} property={property} delay={index * 60} />
          ))}
          <FoundingPropertyCard />
        </div>
      </section>

      <section id="protocol" className="bg-[#0C0B09] px-5 py-20 text-white md:px-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-5 text-[7.5px] uppercase tracking-[0.32em] text-white/40">What you can do</p>
            <h2 className="font-serif text-[clamp(30px,3.8vw,48px)] font-light leading-[1.08] text-white">
              Three things.
              <br />
              One protocol.
            </h2>
          </div>
          <div className="grid gap-px bg-white/10 md:grid-cols-3">
            {protocolCards.map((card) => (
              <Link
                key={card.number}
                href={card.href}
                className="group relative min-h-[310px] overflow-hidden bg-[#141210] p-10 transition-colors hover:bg-[#1C1B18] md:p-12"
              >
                <span className="pointer-events-none absolute right-7 top-5 font-serif text-7xl font-light leading-none tracking-normal text-white/[.06]">
                  {card.number}
                </span>
                <p className="mb-7 text-[7.5px] uppercase tracking-[0.32em] text-white/35">{card.label}</p>
                <span className="mb-8 block h-px w-7 bg-primary/70" />
                <h3 className="max-w-[220px] font-serif text-[clamp(28px,3vw,38px)] font-light leading-[1.02] text-white">
                  {card.title}
                </h3>
                <p className="mt-5 max-w-[230px] text-[11.5px] leading-7 text-white/55">{card.body}</p>
                <p className="mt-10 text-[7.5px] uppercase tracking-[0.22em] text-primary/80 transition-colors group-hover:text-primary">
                  {card.cta}
                </p>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-4 border-t border-white/10 bg-[#0C0B09] px-6 py-5 text-[8px] tracking-[0.1em] text-white/35 md:flex-row md:items-center md:justify-between md:px-12">
            <span>Powered by Solana · SPL Token-2022 · On-chain collateral protocol</span>
            <span className="flex items-center gap-2 text-[#14F195]/65">
              <span className="h-1 w-1 animate-[lp-pulse_2s_infinite] rounded-full bg-[#14F195]" />
              SOLANA DEVNET
            </span>
          </div>
        </div>
      </section>

      <section className="relative min-h-[70vh] overflow-hidden bg-[#0C0B09] px-5 py-20 text-center text-white md:px-16 md:py-28">
        <div
          className="absolute inset-[-10%] bg-cover bg-center opacity-55"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&q=90&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="relative z-10 mx-auto max-w-[540px]">
          <div className="mx-auto mb-9 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm text-[#0C0B09]">
            *
          </div>
          <h2 className="font-serif text-[clamp(34px,5vw,60px)] font-light leading-[1.05] tracking-normal text-white">
            The first to move
            <br />
            own the most.
          </h2>
          <p className="mt-5 text-sm tracking-[0.04em] text-white/78">
            Founding members get exclusive benefits - locked in for life.
          </p>
          <div className="mt-10 grid gap-px bg-white/10 text-left sm:grid-cols-2">
            {foundingBenefits.map((benefit) => (
              <div key={benefit.label} className="bg-black/40 px-5 py-5">
                <p className="text-[7px] uppercase tracking-[0.28em] text-primary">{benefit.label}</p>
                <p className="mt-2 text-[11px] leading-6 text-white/60">{benefit.body}</p>
              </div>
            ))}
          </div>
          <form className="mt-10 border border-white/35 bg-black/45 backdrop-blur-xl" onSubmit={(event) => event.preventDefault()}>
            <div className="flex flex-col sm:flex-row">
              <label htmlFor="waitlist-email" className="sr-only">
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                placeholder="your@email.com"
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-xs tracking-[0.04em] text-white outline-none placeholder:text-white/35"
              />
              <button
                type="submit"
                className="bg-primary px-6 py-4 text-[8px] font-bold uppercase tracking-[0.22em] text-[#0C0B09] transition-opacity hover:opacity-85"
              >
                Join Waitlist
              </button>
            </div>
          </form>
          <p className="mt-3 text-[8.5px] tracking-[0.06em] text-white/35">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}

function PropertyCard({ property, delay }: { property: CatalogProperty; delay: number }) {
  return (
    <article
      className="group relative aspect-[3/4] overflow-hidden bg-[#0C0B09]"
      style={{ animation: `lp-fade-up .9s ${delay}ms both` }}
    >
      <Link href={`/hotel/${property.id}`} className="absolute inset-0" aria-label={property.name}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
          style={{ backgroundImage: `url(${property.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.92)_0%,rgba(0,0,0,.64)_55%,rgba(0,0,0,.38)_100%)]" />
        <span className="absolute left-0 top-0 z-10 h-0 w-px bg-primary transition-[height] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:h-full" />
        <p className="absolute left-6 top-6 text-[7px] uppercase tracking-[0.24em] text-white/58 md:left-7 md:top-7">
          {property.location}
        </p>
        <div className="absolute right-6 top-6 bg-black/35 px-4 py-2.5 text-right text-white backdrop-blur-sm">
          <p className="font-serif text-[26px] font-light leading-none">{property.annualYield}%</p>
          <p className="mt-1 text-[6.5px] uppercase tracking-[0.22em] text-white/60">p.a.</p>
        </div>
        <div className="absolute inset-x-6 bottom-7 md:inset-x-7">
          <p className="text-[7px] uppercase tracking-[0.24em] text-white/60">{property.type}</p>
          <h3 className="mt-3 font-serif text-[clamp(22px,2.2vw,28px)] font-light leading-[1.14] text-white transition-transform duration-500 group-hover:-translate-y-1">
            {property.name}
          </h3>
          <p className="mt-3 text-[10.5px] tracking-[0.04em] text-white/65">
            From {formatUsd(property.tokenPriceUsd)} · +{property.fiveYearEstimate}% est. 5yr
          </p>
          <div className="mt-5 h-px w-full bg-white/15">
            <div className="h-px bg-primary" style={{ width: `${property.fundingProgress}%` }} />
          </div>
        </div>
        <span className="absolute bottom-7 right-6 text-[7.5px] uppercase tracking-[0.18em] text-transparent transition-colors duration-500 group-hover:text-white/45">
          View
        </span>
      </Link>
    </article>
  );
}

function FoundingPropertyCard() {
  return (
    <div className="flex aspect-[3/4] flex-col bg-[#0C0B09] p-8 text-left text-white md:p-10">
      <div className="mb-8 h-px w-full bg-[linear-gradient(90deg,#14F195,#9945FF)] opacity-70" />
      <div className="mb-5 flex items-center gap-3">
        <span className="h-[5px] w-[5px] animate-[lp-pulse_1.8s_infinite] rounded-full bg-[#14F195] shadow-[0_0_8px_rgba(20,241,149,.8)]" />
        <p className="text-[7px] font-medium uppercase tracking-[0.32em] text-[#14F195]">Early Access</p>
      </div>
      <h3 className="font-serif text-[clamp(26px,2.5vw,34px)] font-light leading-[1.08]">
        Be the first
        <br />
        to invest.
      </h3>
      <p className="mt-4 text-[11px] leading-7 text-white/58">
        Founding members get priority access to the rarest properties before public launch.
      </p>
      <div className="mt-8 flex flex-1 flex-col gap-4">
        {foundingBenefits.map((benefit, index) => (
          <div key={benefit.label} className="flex gap-3">
            <span className="mt-1 text-[10px] text-[#14F195]">{['<>', '<>', '()', '[]'][index]}</span>
            <div>
              <p className="text-[8px] uppercase tracking-[0.18em] text-white/50">{benefit.label}</p>
              <p className="mt-1 text-[11px] leading-6 text-white/70">{benefit.body}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="#founding"
        className="mt-8 flex h-11 items-center justify-center bg-[#14F195] text-[8px] font-bold uppercase tracking-[0.22em] text-[#0C0B09] transition-opacity hover:opacity-85"
      >
        Join Waitlist
      </Link>
      <div className="mt-6 h-px w-full bg-[linear-gradient(90deg,#9945FF,#14F195)] opacity-50" />
    </div>
  );
}

function LiveMetric({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-serif text-[22px] font-light leading-none ${accent ? 'text-[#14F195]' : 'text-white'}`}>
        {value}
      </p>
      <p className="mt-1 text-[7px] uppercase tracking-[0.2em] text-white/45">{label}</p>
    </div>
  );
}

function MetricRule() {
  return <span className="h-10 w-px bg-white/12" />;
}

function SolanaMark() {
  return (
    <svg width="16" height="14" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm0-164.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1L332.9 143c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.8zM332.9 73c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3C67 .6 70.3-.8 73.8-.8h317.4c5.8 0 8.7 7 4.6 11.1L332.9 73z"
        fill="url(#home-solana-gradient)"
      />
      <defs>
        <linearGradient id="home-solana-gradient" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
    </svg>
  );
}
