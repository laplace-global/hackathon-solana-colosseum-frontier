import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';

const links = [
  { href: '/discover', label: 'Properties' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/borrow', label: 'Borrow' },
  { href: '/lend', label: 'Lend' },
  { href: '/about', label: 'About' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 pb-10 pt-16 md:px-16">
      <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
        <Link href="/" className="flex items-center">
          <BrandMark />
        </Link>
        <ul className="flex flex-wrap gap-x-10 gap-y-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-uilink text-foreground/35 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 md:flex-row md:items-center">
        <p className="text-[11px] tracking-[0.12em] text-muted-foreground">
          © 2026 Laplace Inc. All rights reserved. · invest@laplacetoken.com
        </p>
        <div className="flex items-center gap-3">
          <span className="block h-1.5 w-1.5 rounded-full bg-[var(--lp-solana)] shadow-[0_0_12px_rgba(153,69,255,0.45)]" />
          <span className="text-uilink text-foreground/50">Powered by Solana</span>
        </div>
      </div>
    </footer>
  );
}
