export interface NavigationLink {
  href: string;
  label: string;
}

export interface HomeProtocolCard {
  number: string;
  label: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}

export const HIDDEN_ADMIN_ROUTES = ['/admin', '/lend'] as const;

export const PUBLIC_NAV_LINKS: NavigationLink[] = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Properties' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/borrow', label: 'Finance' },
];

export const PUBLIC_FOOTER_LINKS: NavigationLink[] = [
  { href: '/discover', label: 'Properties' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/borrow', label: 'Borrow' },
  { href: '/about', label: 'About' },
];

export const PUBLIC_HOME_PROTOCOL_CARDS: HomeProtocolCard[] = [
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
    label: 'Portfolio',
    title: 'Track Ownership',
    body: 'Review tokens, balances, and property exposure.',
    cta: 'View Portfolio ->',
    href: '/portfolio',
  },
];

export function isHiddenAdminRoute(pathname: string): boolean {
  return HIDDEN_ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
