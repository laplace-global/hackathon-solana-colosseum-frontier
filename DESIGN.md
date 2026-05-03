---
version: alpha
name: Laplace Luxury Ledger
source: /Users/rindo/Desktop/laplace-app (5).html
description: A cinematic luxury real-estate ledger for tokenized property ownership on Solana.
colors:
  ink: "#0A0906"
  ink-raised: "#141310"
  fog: "#1C1B18"
  line: "#252420"
  paper: "#F0EAE0"
  paper-muted: "#A8A090"
  teal: "#2ABFBF"
  teal-dim: "#0E2A28"
  solana: "#9945FF"
  danger: "#FF5050"
  warning: "#FFAA00"
typography:
  display-xl:
    fontFamily: Cormorant Garamond
    fontSize: 84px
    fontWeight: 300
    lineHeight: 1.04
    letterSpacing: 0
  headline-lg:
    fontFamily: Cormorant Garamond
    fontSize: 54px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: 0
  headline-md:
    fontFamily: Cormorant Garamond
    fontSize: 32px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0
  body-editorial:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.9
    letterSpacing: 0.08em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 300
    lineHeight: 1.8
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Inter
    fontSize: 8px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.34em
  label-action:
    fontFamily: Inter
    fontSize: 9px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.26em
spacing:
  page-desktop: 64px
  page-mobile: 24px
  section: 140px
  panel: 24px
  dense-row: 16px
radii:
  component: 0px
  micro: 2px
  circular: 9999px
motion:
  page-reveal: 900ms cubic-bezier(.16, 1, .3, 1)
  hero-fade: 2400ms cubic-bezier(.6, 0, .4, 1)
  hover-image: 1200ms cubic-bezier(.16, 1, .3, 1)
---

## Overview

Laplace should feel like an invitation-only property ledger: quiet, cinematic, precise, and expensive. The interface borrows from luxury real-estate editorial sites rather than a generic crypto dashboard. Large photography carries the first impression. Thin rules, restrained typography, and small technical labels make the product feel institutional without becoming sterile.

The emotional target is calm confidence. Users should understand that this is a financial product, but the first visual signal is ownership of rare physical assets. Solana is present as infrastructure, not as a decorative crypto theme.

## Source HTML Translation

The reference HTML defines the visual grammar through five recurring motifs:

- Full-bleed property photography with a dark vertical veil.
- Cormorant Garamond for hero, property names, and financial values.
- Inter for navigation, controls, tables, and dense labels.
- One-pixel dividers, square components, and almost no shadow.
- Teal as the active action/yield signal, with Solana purple reserved for chain status.

The Next app should use these motifs across marketing, catalog, wallet, portfolio, borrow, lend, and admin surfaces. Dense operational screens can be more tabular, but they should still use the same dark surfaces, serif numeric hierarchy, compact uppercase labels, and hairline borders.

## Colors

- **Ink (#0A0906):** Page background, hero overlays, and immersive full-bleed sections.
- **Ink Raised (#141310):** Cards, nav solid state, dialogs, popovers, and repeated tool surfaces.
- **Fog (#1C1B18):** Secondary panels, empty states, tab backgrounds, and quiet hover states.
- **Line (#252420):** One-pixel borders, table dividers, progress tracks, and separators.
- **Paper (#F0EAE0):** Headings, primary values, and important labels.
- **Paper Muted (#A8A090):** Body copy, metadata, captions, and helper text.
- **Teal (#2ABFBF):** Primary action, yield, active progress, focus ring, and selected states.
- **Teal Dim (#0E2A28):** Subtle selected surfaces and low-emphasis active backgrounds.
- **Solana (#9945FF):** Chain badge, explorer status, and infrastructure affordances only.

Avoid beige page backgrounds, high-saturation gradients, slate dashboards, and multi-color icon palettes. The product should read as dark editorial luxury, not web3 neon.

## Typography

Headlines, property names, hero subheads, and financial values use **Cormorant Garamond** at light weight. Its job is to make real estate feel physical, rare, and editorial.

Body, navigation, tables, controls, and form labels use **Inter** in light or regular weights. Labels are tiny, uppercase, and widely tracked. Heavy sans-serif headings should be avoided unless a dense admin table needs local emphasis.

Use hero-scale type only on hero sections. Cards, dialogs, nav, tabs, and financial panels should stay compact and precise.

## Layout

The layout is a dark, full-bleed editorial grid. Primary pages should use full-width sections, large image bands, and one-pixel dividers instead of floating marketing cards. Use 64px desktop side spacing and 24px mobile side spacing as the default rhythm.

Marketing and catalog pages can breathe with 120-140px vertical sections. Portfolio, wallet, borrow, lend, and admin pages may be denser, but should keep aligned columns, table-first structures, compact controls, and stable row heights.

Property cards should keep a stable image aspect ratio, preferably 3:4 for catalog cards and 16:11 for compact summaries. Hover states may scale the image subtly, but text and metrics should not shift layout.

## Imagery

Photography is the primary luxury signal. Use real property, city, hospitality, or interior imagery instead of abstract graphics. Text over images must always sit on a dark veil. The overlay should feel cinematic, not like a generic black scrim.

Hero images may use slow Ken Burns motion. Catalog cards should use a bottom veil, location/type tags, a teal yield chip, and a progress hairline.

## Components

Buttons are square, uppercase, and letter-spaced. Primary buttons are teal with ink text. Outline buttons are transparent or ink-backed with a thin paper/line border. Hover states should reveal a teal border, a bottom rule, or a subtle tonal lift.

Cards and panels are square, border-first, and shadowless. Use `bg-card` for raised surfaces and `bg-background` for embedded table cells. Do not nest decorative cards inside cards.

Badges are tiny uppercase chips. Solana badges may use purple, but only for chain or explorer context. Yield, active, selected, and success states should use teal.

Forms and sliders should use thin borders and hairline tracks. Slider thumbs may be circular because they are functional controls.

## Page Guidance

Home should open with the reference HTML composition: black boxed Laplace mark, HOME / PROPERTIES / PORTFOLIO / FINANCE / LEND navigation, a small founding-member signup block in the upper-left, and the exact hero message "Buy real estate, 1-click, from 1 SOL." over full-bleed city photography. The first viewport should feel like a high-end editorial invitation, not a SaaS landing page.

Discover should behave like a curated property ledger. Filters stay compact. Cards should be image-led, with local watchlist and notification actions expressed as small icon controls.

Property detail should keep the hero photographic and the financial summary below it in a thin divider grid. Purchasable properties and catalog-only properties should share the same tone even when behavior differs.

Wallet, portfolio, borrow, lend, and admin should be operational but still premium: table-first, restrained labels, serif totals, square panels, and no bright utility-dashboard palette.

## Do's And Don'ts

- Do let photography, serif type, and thin borders carry the premium feeling.
- Do use teal for yield, active progress, and the primary action on a screen.
- Do use Solana purple only for chain/explorer status.
- Do keep local-only catalog actions visually compact and non-promotional.
- Do keep labels short, uppercase, and precise.
- Don't introduce beige page backgrounds, rounded marketing cards, heavy shadows, or bright crypto gradients.
- Don't add implementation copy about DB, backend mapping, test fixtures, or reference HTML.
- Don't show XRPL/RUSD/RLUSD terminology in user-facing UI.
