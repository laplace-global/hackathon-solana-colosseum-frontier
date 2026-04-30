import Link from 'next/link';

const links = [
  { href: '/discover', label: 'Properties' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/borrow', label: 'Borrow' },
  { href: '/lend', label: 'Lend' },
  { href: '/about', label: 'About' },
  { href: '#', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background px-6 pb-10 pt-16 md:px-16">
      <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-[10px] text-primary">✦</span>
          <span className="text-uilink font-light tracking-[0.45em]">LAPLACE</span>
        </Link>
        <ul className="flex flex-wrap gap-x-10 gap-y-4">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-uilink text-foreground/40 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 md:flex-row md:items-center">
        <p className="text-[11px] tracking-[0.12em] text-muted-foreground">
          © 2026 Laplace Inc. All rights reserved. · invest@laplacetoken.com
        </p>
        <div className="flex items-center gap-3">
          <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-uilink text-foreground/60">Powered by Solana</span>
        </div>
      </div>
    </footer>
  );
}
