---
version: alpha-v6
name: Laplace Luxury Ledger
source: /Users/rindo/Desktop/laplace-app-v6.html
description: A cinematic Solana real-estate protocol for 1-click property ownership, collateralized borrowing, and reinvested liquidity.
colors:
  hero-ink: "#0C0B09"
  page-ink: "#FAFAF8"
  page-raised: "#F4F3EF"
  text-ink: "#1A1916"
  text-muted: "#3D3B35"
  line: "rgba(0,0,0,.08)"
  tiffany: "#81D8D0"
  solana-live: "#14F195"
  solana-purple: "#9945FF"
  gold: "#C8A96E"
typography:
  display-xl:
    fontFamily: Cormorant Garamond
    fontSize: 116px
    fontWeight: 200
    lineHeight: 0.98
    letterSpacing: 0
  headline-lg:
    fontFamily: Cormorant Garamond
    fontSize: 54px
    fontWeight: 200
    lineHeight: 1.1
    letterSpacing: 0
  headline-md:
    fontFamily: Cormorant Garamond
    fontSize: 32px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0
  body-editorial:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.9
    letterSpacing: 0.04em
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 300
    lineHeight: 1.8
    letterSpacing: 0.04em
  label-caps:
    fontFamily: DM Sans
    fontSize: 7.5px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.32em
  label-action:
    fontFamily: DM Sans
    fontSize: 8px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.24em
spacing:
  page-desktop: 64px
  page-mobile: 20px
  section: 100px
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
  hero-canvas: continuous low-amplitude light drift
---

## Overview

Laplace should feel like a private protocol for owning the world's penthouses from a Solana wallet. Version 6 moves the first impression away from pure property photography and into a cinematic brand scene: dark horizon light, architectural grid, slow canvas streaks, and a precise waitlist layer. The tone is still luxury real estate, but now with a stronger "live protocol" signal.

The emotional target is quiet urgency. Users should immediately read "1 SOL, 1 click" and understand that ownership, borrowing, and reinvestment are one connected flow. Solana should appear as active infrastructure through small live badges, not as broad crypto decoration.

## Source HTML Translation

The reference HTML defines the visual grammar through these motifs:

- Full-viewport hero built from canvas light, radial glow, a faint architectural grid, and film grain.
- A small founding-member access block in the upper-left of the hero.
- A large serif one-liner at the bottom: "The world's penthouses. 1 SOL. 1 click."
- A right-bottom live demo badge with Solana Devnet status and compact metrics.
- Light editorial sections after the hero: pale page surfaces, dark text, thin rules, and image-led property cards.
- Three protocol cards: Invest, Collateral & Borrow, and Reinvest.
- A final founding-member waitlist band with benefit cells and a compact email capture.

## Colors

- **Hero Ink (#0C0B09):** Hero, footer, protocol cards, dark CTA surfaces.
- **Page Ink (#FAFAF8):** Main editorial page background after the hero.
- **Page Raised (#F4F3EF):** Stats, secondary editorial sections, and light raised panels.
- **Text Ink (#1A1916):** Primary text on light sections.
- **Text Muted (#3D3B35):** Secondary copy on light sections and low-emphasis metadata.
- **Line (rgba(0,0,0,.08)):** Hairline separators on light surfaces.
- **Tiffany (#81D8D0):** Founding-member action, active progress, thin hero rules, and premium interaction cues.
- **Solana Live (#14F195):** Devnet/live status only.
- **Solana Purple (#9945FF):** Solana logo gradients and chain affordances only.
- **Gold (#C8A96E):** Soft luxury accent for editorial rules and occasional values.

Avoid broad purple gradients, beige-heavy lifestyle palettes, rounded SaaS cards, and bright multi-color icon sets. The interface should feel like a luxury editorial system with a live on-chain layer.

## Typography

Headlines, property names, hero one-liners, and financial values use **Cormorant Garamond** at light weights. The hero should be large, airy, and bottom-anchored.

Navigation, controls, dense labels, tables, forms, and body text use **DM Sans**. Labels are tiny, uppercase, and widely tracked. Avoid heavy sans-serif display headings.

Hero-scale type belongs only to full-viewport brand moments. Cards, stats, dialogs, nav, tabs, and operational panels stay compact and precise.

## Layout

The home page starts with a full-viewport dark hero. Content is split vertically: founding access at the top, product one-liner at the bottom, and live protocol metrics in the lower-right on desktop. Mobile hides the right-side live badge and stacks the waitlist form.

After the hero, the page shifts to pale editorial surfaces. Stats use a four-column divider grid. Property cards remain image-led and use dark veils. The protocol section returns to deep ink so the "three things" flow reads as a working protocol rather than generic marketing.

Use 64px desktop side spacing and 20-24px mobile spacing. Keep components square, aligned to grid lines, and stable in size.

## Imagery And Motion

Home hero uses breakpoint-specific background videos: `/videos/hero_pc.mp4` for desktop and `/videos/hero_sp.mp4` for smartphone layouts. Keep both muted, looped, inline, and covered by the existing dark veil so the founding form, hero headline, and live badge stay legible. The canvas light scene remains a fallback layer behind both videos.

Property imagery remains important in cards and detail pages. Use real property, city, hospitality, or interior imagery. Text over images must always sit on a dark veil.

Motion should be slow and architectural: light drift, horizon glow, subtle image scale on hover, staggered hero line reveal, and a marquee for cities. Do not add decorative orbs outside the hero canvas system.

## Components

Buttons are square, uppercase, and letter-spaced. Primary hero and waitlist buttons may use Tiffany with dark text. Outline buttons use thin paper or ink borders with a bottom-rule hover.

Cards and panels are border-first and shadowless. Repeated property cards may use full image backgrounds and veils. Protocol cards use deep ink, large ghost numbers, and a single Tiffany rule.

Badges are tiny uppercase chips. Solana badges use **Solana Live** green and may include the purple-to-green logo gradient. Yield and active progress use Tiffany, not purple.

Forms are compact, square, and border-first. Waitlist fields in the hero sit on translucent dark glass; fields on light sections should use thin borders and restrained labels.

## Asset Policy

- The HTML reference includes optional commented video sources: `assets/laplace-brand.webm` and `assets/laplace-brand.mp4`. Do not enable these until actual files exist.
- Home hero videos are tracked at `/videos/hero_pc.mp4` for desktop and `/videos/hero_sp.mp4` for smartphone.
- Prefer canvas or external remote imagery over broken local placeholders.
- Local image references must resolve under `public/`. If an image is not present, use an existing thumbnail, a generated real asset, or a deliberate non-image fallback.
- Do not leave UI paths that assume missing files such as `/images/*-unit-1.jpg`.

## Page Guidance

Home should follow the v6 composition: black navigation with Laplace mark, HOME / PROPERTIES / PORTFOLIO / FINANCE / LEND navigation, upper-left founding-member access, bottom hero one-liner "The world's penthouses. 1 SOL. 1 click.", a Solana Devnet live badge, stats, marquee, property grid, three protocol cards, and a final founding-member waitlist band.

Discover behaves like a curated property ledger. Filters stay compact. Cards are image-led, with watchlist and notification actions as small controls.

Property detail keeps the hero photographic and places financial summaries in thin divider grids. Purchasable and catalog-only properties share the same premium tone.

Wallet, portfolio, borrow, lend, and admin remain operational: table-first, restrained labels, serif totals, square panels, and no bright utility-dashboard palette.

## Do's And Don'ts

- Do lead with the 1 SOL / 1 click promise.
- Do use canvas hero motion as the default brand visual.
- Do use Tiffany for founding-member action and active progress.
- Do use Solana Live green only for live/devnet infrastructure status.
- Do shift home sections between dark protocol moments and pale editorial sections.
- Do check local image and video references before wiring them into UI.
- Don't enable optional video sources without files.
- Don't introduce missing `/images/*.jpg` placeholders.
- Don't show previous-chain terminology in user-facing UI.
- Don't add explanatory implementation copy inside the product UI.
