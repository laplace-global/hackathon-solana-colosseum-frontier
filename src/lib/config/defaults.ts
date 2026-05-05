export const APP_DEFAULTS = {
  solana: {
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    commitment: 'confirmed',
  },
  demoMintAddresses: {
    SAIL: '6ABfz6LmNxspAt2rT1XgEXZ67juWePiYEWN6pKcCHDqf',
    NYRA: 'CWkgYDv4FoFwhAp2qWrgn4HmEqw8km4eXZhrGNnw9aU8',
    USDC: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun',
  },
  lending: {
    loanTermMonths: 24,
  },
} as const;
