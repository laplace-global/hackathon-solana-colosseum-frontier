'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LoginDialog } from '@/components/login-dialog';
import { UserMenu } from '@/components/user-menu';
import { useAuth } from '@/contexts/auth-context';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/discover', label: 'Properties' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/borrow', label: 'Borrow' },
  { href: '/lend', label: 'Lend' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
          solid
            ? 'border-b border-white/5 bg-background/90 px-6 py-[18px] backdrop-blur-2xl md:px-16'
            : 'border-b border-transparent px-6 py-9 md:px-16'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-[12px] text-primary">✦</span>
            <span className="text-uilink font-light tracking-[0.45em]">LAPLACE</span>
          </Link>

          <nav className="hidden items-center gap-12 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-uilink text-foreground/40 transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            {user ? (
              <UserMenu />
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="text-uibtn border border-foreground/20 px-7 py-3 text-foreground/70 transition-colors duration-300 hover:border-foreground/50 hover:text-foreground"
              >
                Connect Wallet
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-6 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-uilink text-foreground/60 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setLoginOpen(true);
                }}
                className="text-uibtn mt-2 border border-foreground/20 px-7 py-3 text-foreground/70"
              >
                Connect Wallet
              </button>
            )}
          </nav>
        )}
      </header>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
