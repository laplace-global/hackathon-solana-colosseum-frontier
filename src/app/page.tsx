'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=90',
    region: 'United Arab Emirates',
    name: 'Dubai Marina',
    kenburns: 'lp-kenburns-1',
  },
  {
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=90',
    region: 'Japan',
    name: 'Otemachi, Tokyo',
    kenburns: 'lp-kenburns-2',
  },
  {
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=90',
    region: 'France',
    name: 'Le Marais, Paris',
    kenburns: 'lp-kenburns-3',
  },
  {
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=90',
    region: 'United States',
    name: 'Midtown Manhattan',
    kenburns: 'lp-kenburns-4',
  },
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

const stats = [
  { target: 2.4, suffix: 'B', prefix: '$', label: 'Assets Tokenized', decimals: 1 },
  { target: 5, suffix: '', prefix: '', label: 'Properties Available', decimals: 0 },
  { target: 7.8, suffix: '%', prefix: '', label: 'Avg. Annual Yield', decimals: 1 },
  { target: 100, suffix: '', prefix: '$', label: 'Min. Investment', decimals: 0 },
];

const properties = [
  {
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
    tag: 'Dubai Marina — UAE',
    yield: '9.2%',
    type: 'Penthouse',
    name: "One Za'abeel Sky Penthouse",
    meta: 'From $250 · +38% est. 5yr',
    progress: 71,
  },
  {
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85',
    tag: 'Otemachi — Tokyo, Japan',
    yield: '7.4%',
    type: 'Luxury Residence',
    name: 'Aman Tokyo Sky Residence',
    meta: 'From $500 · +29% est. 5yr',
    progress: 58,
  },
  {
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=85',
    tag: 'Midtown Manhattan — New York',
    yield: '9.8%',
    type: 'Ultra-Penthouse',
    name: '432 Park Pinnacle Penthouse',
    meta: 'From $1,000 · +51% est. 5yr',
    progress: 82,
  },
  {
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=85',
    tag: 'Le Marais — Paris, France',
    yield: '6.8%',
    type: 'Heritage Residence',
    name: 'Le Marais Grand Haussmann',
    meta: 'From $200 · +24% est. 5yr',
    progress: 29,
  },
  {
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=85',
    tag: 'Downtown Dubai — UAE',
    yield: '8.5%',
    type: 'Sky Villa',
    name: 'Burj Vista Infinity Villa',
    meta: 'From $100 · +42% est. 5yr',
    progress: 43,
  },
];

const steps = [
  {
    n: '01',
    title: 'Buy Tokens',
    body: 'From $100. Crypto, card, or bank wire. Ownership recorded on Solana. Instant confirmation.',
  },
  {
    n: '02',
    title: 'Earn Yield',
    body: 'Quarterly distributions direct to your wallet. Automatically. Every property, every quarter.',
  },
  {
    n: '03',
    title: 'Borrow Without Selling',
    body: 'Use tokens as collateral. Access USDC liquidity. Keep your position. The credit layer for RWA.',
  },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Counter({
  target,
  prefix,
  suffix,
  decimals,
  active,
}: {
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
  active: boolean;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const duration = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return (
    <span>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative h-screen min-h-[680px] w-full overflow-hidden">
      {slides.map((s, i) => (
        <div
          key={s.image}
          className="absolute inset-0 transition-opacity duration-[2200ms] ease-[cubic-bezier(.6,0,.4,1)]"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${s.image})`,
              animation: i === index ? `${s.kenburns} 16s ease-in-out forwards` : undefined,
            }}
          />
          <div className="absolute inset-0 lp-veil" />
          <div
            className={`absolute right-6 top-28 text-right transition-all duration-[1000ms] ease-[cubic-bezier(.16,1,.3,1)] md:right-16 ${
              i === index ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
            }`}
          >
            <div className="text-eyebrow text-foreground/35">{s.region}</div>
            <div className="font-serif text-[14px] italic text-foreground/55">{s.name}</div>
          </div>
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-24 md:px-16 md:pb-24">
        <div className="text-eyebrow text-primary">
          <span className="inline-block animate-[lp-fade-up_.8s_.3s_both]">Tokenized Luxury Real Estate</span>
        </div>
        <h1 className="mt-7 font-serif font-[200] leading-[1.04] tracking-[0.01em] text-foreground" style={{ fontSize: 'clamp(52px, 7.5vw, 100px)' }}>
          <span className="block overflow-hidden">
            <span className="block animate-[lp-line-up_1.1s_cubic-bezier(.16,1,.3,1)_both]">Own the World&apos;s</span>
          </span>
          <span className="block overflow-hidden">
            <span className="block animate-[lp-line-up_1.1s_.18s_cubic-bezier(.16,1,.3,1)_both]">Finest Real Estate.</span>
          </span>
        </h1>
        <p className="mt-5 overflow-hidden font-serif italic text-foreground/45" style={{ fontSize: 'clamp(16px, 2vw, 22px)' }}>
          <span className="block animate-[lp-fade-up_.9s_.55s_both]">One token at a time.</span>
        </p>
        <div className="mt-5 max-w-[380px] overflow-hidden text-bodyeditorial text-muted-foreground">
          <span className="block animate-[lp-fade-up_.9s_.72s_both]">From $100. Earn yield. Borrow against it. On Solana.</span>
        </div>
        <div className="mt-14 flex animate-[lp-fade-up_.9s_1s_both] flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Link
            href="#properties"
            className="text-uibtn group relative w-fit overflow-hidden border border-foreground/30 px-11 py-4 text-foreground transition-colors duration-500 hover:border-foreground/55"
          >
            Explore Properties
            <span className="absolute bottom-0 left-[-100%] h-px w-full bg-primary transition-[left] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:left-0" />
          </Link>
          <Link href="#how" className="text-uibtn group flex w-fit items-center gap-3 text-muted-foreground transition-colors duration-300 hover:text-foreground">
            How It Works
            <span className="inline-block transition-transform duration-500 group-hover:translate-y-1">↓</span>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-24 right-6 z-10 flex animate-[lp-fade-up_.8s_1.3s_both] items-center gap-6 md:right-16">
        <div className="flex gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="relative h-px w-7 overflow-hidden bg-foreground/15 transition-colors"
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className="absolute top-0 block h-full bg-primary transition-[left] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ left: i === index ? 0 : '-100%', width: '100%' }}
              />
            </button>
          ))}
        </div>
        <div className="text-eyebrow text-foreground/40">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>
      </div>

      <div className="absolute bottom-10 left-6 z-10 flex flex-col items-center gap-3 md:left-16">
        <span className="block h-10 w-px bg-foreground/20" />
        <span className="text-eyebrow text-foreground/35">Scroll</span>
      </div>
    </section>
  );
}

function Stats() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="relative">
      <div className="h-px w-full bg-primary/30" />
      <div ref={ref} className="grid grid-cols-2 gap-y-12 px-6 py-20 md:grid-cols-4 md:gap-y-0 md:px-16 md:py-24">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center md:px-8">
            <div className="font-serif text-5xl font-light text-foreground md:text-6xl">
              <Counter
                target={s.target}
                prefix={s.prefix}
                suffix={s.suffix}
                decimals={s.decimals}
                active={visible}
              />
            </div>
            <div className="text-eyebrow mt-4 text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="h-px w-full bg-primary/30" />
    </section>
  );
}

function Marquee() {
  const items = [...cities, ...cities];
  return (
    <div className="overflow-hidden border-b border-white/5 py-8">
      <div className="flex w-max animate-[lp-marquee_40s_linear_infinite] items-center gap-16">
        {items.map((c, i) => (
          <span key={`${c}-${i}`} className="flex items-center gap-3 whitespace-nowrap">
            <span className="block h-1 w-1 rounded-full bg-primary" />
            <span className="text-uilink text-foreground/55">{c}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function PropertyCard({
  p,
  delay,
}: {
  p: (typeof properties)[number];
  delay: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="group relative aspect-[3/4] cursor-pointer overflow-hidden bg-card transition-all duration-1000 ease-[cubic-bezier(.16,1,.3,1)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}s`,
      }}
    >
      <span className="absolute left-0 top-0 z-10 h-0 w-[3px] bg-primary transition-[height] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:h-full" />
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
        style={{ backgroundImage: `url(${p.image})` }}
      />
      <div className="absolute inset-0 lp-veil-card" />
      <div className="text-eyebrow absolute left-7 top-7 text-foreground/70">{p.tag}</div>
      <div className="absolute right-6 top-6 flex flex-col items-end border border-primary/30 bg-primary/10 px-4 py-2.5 text-primary backdrop-blur-sm">
        <span className="font-serif text-2xl font-light leading-none">{p.yield}</span>
        <span className="text-eyebrow mt-1 text-primary/70">p.a.</span>
      </div>
      <div className="absolute inset-x-7 bottom-7 space-y-3">
        <div className="text-eyebrow text-foreground/55">{p.type}</div>
        <div className="font-serif text-2xl font-light leading-tight text-foreground">{p.name}</div>
        <div className="text-bodyeditorial text-foreground/60">{p.meta}</div>
        <div className="h-px w-full bg-foreground/15">
          <div
            className="h-px bg-primary transition-[width] duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)]"
            style={{ width: visible ? `${p.progress}%` : '0%', transitionDelay: `${delay + 0.4}s` }}
          />
        </div>
      </div>
      <div className="text-uibtn pointer-events-none absolute bottom-7 right-7 text-foreground opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        View →
      </div>
    </div>
  );
}

function Properties() {
  return (
    <section id="properties" className="px-6 py-24 md:px-16 md:py-32">
      <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="text-eyebrow mb-5 text-primary">Our Properties</div>
          <h2 className="font-serif text-5xl font-light leading-[1.04] text-foreground md:text-7xl">
            A World of
            <br />
            Possibility
          </h2>
        </div>
        <Link href="/discover" className="text-uibtn text-foreground/60 transition-colors hover:text-foreground">
          View All Properties →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p, i) => (
          <PropertyCard key={p.name} p={p} delay={i * 0.07} />
        ))}
        <CtaCard />
      </div>
    </section>
  );
}

function CtaCard() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="flex aspect-[3/4] flex-col items-center justify-center bg-card p-10 text-center transition-all duration-1000 ease-[cubic-bezier(.16,1,.3,1)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: '0.35s',
      }}
    >
      <span className="block h-px w-12 bg-primary/40" />
      <div className="text-eyebrow mt-9 text-primary">Launching August 2026</div>
      <div className="mt-5 font-serif text-2xl font-light leading-[1.3] text-foreground md:text-[26px]">
        Be the first
        <br />
        to invest.
      </div>
      <p className="mt-4 font-serif text-sm italic text-muted-foreground">
        Reserved spots for those who move first.
      </p>
      <Link
        href="#waitlist"
        className="text-uibtn mt-9 border border-primary/30 px-9 py-3.5 text-primary transition-colors duration-300 hover:border-primary/60"
      >
        Notify Me →
      </Link>
      <span className="mt-9 block h-px w-12 bg-primary/40" />
    </div>
  );
}

function ParallaxQuote() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top - window.innerHeight / 2) * 0.18;
      el.style.setProperty('--y', `${-offset}px`);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const { ref: revealRef, visible } = useReveal<HTMLDivElement>();
  return (
    <section
      ref={ref}
      className="relative h-[80vh] overflow-hidden"
      style={{ background: '#0A0A08' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=85)",
          transform: 'translateY(var(--y, 0))',
        }}
      />
      <div className="absolute inset-0 lp-veil" />
      <div
        ref={revealRef}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center md:px-16"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1.4s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <p
          className="max-w-3xl font-serif font-light leading-[1.3] text-foreground/85"
          style={{ fontSize: 'clamp(24px, 3.5vw, 40px)' }}
        >
          &ldquo;Real estate has always been the world&apos;s greatest store of value.
          <br />
          We made it yours.&rdquo;
        </p>
        <span className="mt-10 block h-px w-16 bg-primary/50" />
        <p className="text-eyebrow mt-6 font-serif italic text-muted-foreground">
          Laplace · Tokenized Real Estate
        </p>
      </div>
    </section>
  );
}

function StepCard({ s, i }: { s: (typeof steps)[number]; i: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="space-y-5 transition-all duration-1000 ease-[cubic-bezier(.16,1,.3,1)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${i * 0.1}s`,
      }}
    >
      <div className="font-serif text-7xl font-light text-foreground/30">{s.n}</div>
      <div className="h-px w-12 bg-primary/50" />
      <h3 className="font-serif text-2xl font-light text-foreground">{s.title}</h3>
      <p className="text-bodyeditorial max-w-[280px] text-muted-foreground">{s.body}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="px-6 py-24 md:px-16 md:py-32">
      <div className="mb-20 text-center">
        <div className="text-eyebrow mb-5 text-primary">The Process</div>
        <h2 className="font-serif text-4xl font-light leading-[1.1] text-foreground md:text-6xl">
          &ldquo;Three steps to own
          <br />
          the world&apos;s finest.&rdquo;
        </h2>
      </div>
      <div className="grid gap-12 md:grid-cols-3 md:gap-16">
        {steps.map((s, i) => (
          <StepCard key={s.n} s={s} i={i} />
        ))}
      </div>
    </section>
  );
}

function Waitlist() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };
  return (
    <section id="waitlist" className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&q=85)",
        }}
      />
      <div className="absolute inset-0 lp-veil" />
      <div className="relative px-6 py-32 text-center md:px-16 md:py-40">
        <div className="text-eyebrow text-primary">Be First — Launching August 2026</div>
        <h2 className="mx-auto mt-8 max-w-3xl font-serif text-4xl font-light leading-[1.1] text-foreground md:text-6xl">
          &ldquo;Reserved for those
          <br />
          who move first.&rdquo;
        </h2>
        <p className="mx-auto mt-6 max-w-md text-bodyeditorial text-muted-foreground">
          Priority access for founding members. August 2026.
        </p>

        {!submitted ? (
          <form
            onSubmit={handle}
            className="mx-auto mt-12 flex max-w-lg flex-col items-stretch gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="text-bodyeditorial flex-1 border-b border-foreground/20 bg-transparent px-1 py-4 text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="text-uibtn border border-foreground/30 px-9 py-4 text-foreground transition-colors hover:border-foreground/60"
            >
              Join →
            </button>
          </form>
        ) : (
          <div className="mt-12 text-center">
            <div className="text-2xl text-primary">✦</div>
            <p className="mt-4 font-serif text-2xl font-light text-foreground">You&apos;re on the list.</p>
            <p className="mt-2 text-bodyeditorial text-muted-foreground">
              We&apos;ll be in touch before anyone else.
            </p>
          </div>
        )}

        <p className="mt-8 text-[11px] tracking-[0.16em] text-muted-foreground">
          Notify me per property. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <HeroSlideshow />
      <Stats />
      <Marquee />
      <Properties />
      <ParallaxQuote />
      <HowItWorks />
      <Waitlist />
    </div>
  );
}
