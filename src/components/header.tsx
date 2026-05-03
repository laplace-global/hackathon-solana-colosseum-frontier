'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LoginDialog } from '@/components/login-dialog';
import { UserMenu } from '@/components/user-menu';
import { BrandMark } from '@/components/brand-mark';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Properties' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/borrow', label: 'Finance' },
  { href: '/lend', label: 'Lend' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsSolid(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
        isSolid
          ? 'border-border bg-background/95 px-6 py-[18px] backdrop-blur-2xl md:px-16'
          : 'border-transparent px-6 py-9 md:px-16'
      }`}
    >
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-12 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[8px] font-light uppercase tracking-[0.34em] text-foreground/35 transition-colors duration-300 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="#founding"
            className="text-[8px] font-light uppercase tracking-[0.28em] text-foreground/35 transition-colors hover:text-foreground"
          >
            Get Notified
          </Link>
          {user ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-3 border border-foreground/20 px-6 py-3 text-[8px] font-light uppercase tracking-[0.24em] text-foreground/70 transition-colors duration-300 hover:border-foreground/50 hover:text-foreground"
              onClick={() => setIsLoginOpen(true)}
            >
              <span className="relative size-3.5 rounded-[3px] bg-[var(--lp-solana)]">
                <span className="absolute left-[3px] top-[3px] h-[8px] w-[8px] rounded-[2px] border border-white/85" />
              </span>
              Connect Wallet
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              className="text-uibtn border border-foreground/20 px-4 py-2 text-foreground/70"
              onClick={() => setIsLoginOpen(true)}
            >
              Connect
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            className="text-foreground/70"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="mt-6 border-t border-border bg-background/95 pt-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-uilink text-foreground/60 hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="text-uilink text-foreground/35 hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          </nav>
        </div>
      )}

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
}
