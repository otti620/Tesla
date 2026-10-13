# Implementation Plan: Dangote Group Official Corporate Color Scheme

Upgrade the entire portal's visual language using the official Dangote Group color palette: **Classic Dangote Corporate Green (#006837 / #004D25)**, **Deep Navy (#0B2545 / #1E293B)**, **Refinery Gold (#D4AF37 / #F59E0B)**, and **Accent Red (#DC2626)** for primary highlights, financial metrics, balance cards, and VIP badges.

---

## Proposed Changes

### 1. Global Color Theme & Utility Tokens (`src/index.css`)
- Define custom color variables and utility classes for Dangote Green (`#006837`, `#004d25`), Deep Navy (`#0b2545`), Gold (`#d4af37`, `#f59e0b`), and clean white/light neutral backgrounds (`#f8fafc`).
- Ensure contrast ratios satisfy WCAG AAA standard for dark background cards and light body surfaces.

### 2. Header & Balance Cards (`src/components/HomeScreen.tsx`, `src/components/MineScreen.tsx`, `src/components/RechargeScreen.tsx`)
- Enhance top balance headers with rich Dangote Green to Deep Navy gradient headers (`from-[#006837] via-[#004d25] to-[#0b2545]`).
- Accent balance numbers, currency badges, and active yield metrics with warm Dangote Gold (`text-amber-300`, `bg-amber-400/20`, border accents).

### 3. Action Buttons & Navigation (`src/components/BottomNav.tsx`, `Recharge`, `Withdraw`, `Tasks`)
- Update primary deposit/recharge buttons with rich Dangote Green backgrounds and gold glowing border accents.
- Style withdrawal and task action buttons with clear Dangote Red/Navy accents.
- Ensure `BottomNav.tsx` active icons use corporate Dangote Green with gold active indicators.

### 4. Product / Tranche Investment Cards (`src/components/ProductScreen.tsx`, `TasksScreen.tsx`)
- Apply Dangote Gold badges to high-yield VIP investment tranches.
- Highlight daily income metrics with crisp Dangote Green pills and corporate navy labels.

### 5. Telegram Flyer Modal & Visual Banners (`src/components/TelegramGroupFlyerModal.tsx`, `FlyerModal.tsx`)
- Apply official Dangote Group branding header banner with refinery gold seal badge and deep green header frame.

---

## Verification Plan

### Automated Tests & Linting
- Run `compile_applet` to verify TypeScript builds cleanly.
- Run `lint_applet` to ensure zero ESLint / syntax errors.

### Visual & Functional Checks
- Verify contrast and readability across Home, Products, Recharge, Withdraw, Tasks, Team, and Profile screens.
- Check Telegram Flyer modal pop-up on home load to confirm corporate green & gold flyer artwork rendering.
