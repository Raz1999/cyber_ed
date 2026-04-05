# Cyber Ed — Phase 2 Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Audience:** All Israeli adults (Hebrew-speaking)
**Platform:** Web app (Expo Web → static export → GitHub Pages)

---

## Overview

Phase 2 builds on the working Phase 1 app with four focused improvements, delivered in order:

1. **Bug fixes** — hotspot clicking and scrolling broken on web
2. **GitHub Pages deployment** — live public URL, auto-deploys on push
3. **Visual redesign** — Purple + Teal palette, more game-like polish
4. **Content expansion** — grow from 5 to 10–15 levels; local username personalization

The game logic, engine architecture, state management, and data schema are **not changing**. All improvements are additive or cosmetic.

---

## Section 1 — Bug Fixes

### Bug 1: Hotspot clicking does nothing on web

**Root cause:** `HotspotEngine` reads tap coordinates from `locationX/locationY` on the press event. On native (iOS/Android), React Native populates these relative to the touched element. On web (react-native-web), these fields are unreliable — the browser exposes `pageX/pageY` (absolute page coordinates) instead.

**Fix:** In `HotspotEngine.tsx`, use a platform-aware coordinate strategy:
- Add a `ref` to the `messageContainer` View
- On **web** (`Platform.OS === 'web'`): call `containerRef.current.getBoundingClientRect()` inside the press handler, then use `event.nativeEvent.clientX - rect.left` and `event.nativeEvent.clientY - rect.top` as raw pixel coordinates before normalizing by `layout.width/height`. `getBoundingClientRect()` returns the true viewport-relative bounding box, correct regardless of scroll position or nesting depth.
- On **native**: keep using `locationX/locationY` — they are already correct and element-relative
- Normalize to 0–1 as before; hit-detection logic is unchanged

**Files affected:** `src/features/simulations/engines/HotspotEngine.tsx`

### Bug 2: Scrolling broken on web

**Root cause:** `ScrollView` inside a `flex: 1` container collapses to zero height on web because browsers don't propagate flex height the same way native does.

**Fix:** In `HomeScreen.tsx`, insert a `View` with `style={{ flex: 1, overflow: 'hidden' }}` **around the `ScrollView` only** — the header `View` and subtitle `Text` above it must remain outside this wrapper. The `SafeAreaView` structure is: `SafeAreaView → [header, subtitle, new wrapper View → ScrollView]`.

**Files affected:** `src/screens/HomeScreen.tsx`

---

## Section 2 — GitHub Pages Deployment

### Setup (one-time)

1. Create a public GitHub repo (e.g. `cyber-ed`)
2. Push the codebase to `main`
3. Create `.github/workflows/deploy.yml` — GitHub Actions workflow (see below)
4. Enable GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch

**Note on asset paths:** Expo's Metro web export already outputs relative asset references (`./static/js/...`) by default. These resolve correctly when served from a GitHub Pages subfolder URL without any `app.json` changes. Do **not** add a `baseUrl` field — it does not exist in this stack's schema and will be silently ignored.

### GitHub Actions Workflow

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx expo export --platform web
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Live URL

`https://YOUR-GITHUB-USERNAME.github.io/cyber-ed/`

### Ongoing workflow

Push to `main` → GitHub Actions builds and publishes automatically. No manual steps after initial setup.

---

## Section 3 — Visual Redesign

### Color Palette

| Token | Current | Phase 2 | Usage |
|-------|---------|---------|-------|
| `primary` | `#2E7D32` (green) | `#6A1B9A` (purple) | Buttons, active borders, brand |
| `secondary` | — | `#00897B` (teal) | Progress, completed states, gradient end |
| `headerBg` | — | `#3A0066` (dark purple) | Top bars on all screens |
| `background` | `#FAF9F6` (cream) | `#F5F0FF` (lavender) | Page background |
| `accent` | `#F57C00` (orange) | `#F57C00` (orange) | Incorrect feedback — unchanged |
| `points` | — | `#FFB300` (gold) | Points badge highlight |
| `success` | `#2E7D32` (green) | `#00897B` (teal) | Completed level indicators |
| `text` | `#212121` | `#3A0066` (dark purple) | Primary text |

All tokens live in `src/theme/index.ts` — screens and components reference tokens, not hex values, so a single file update propagates everywhere.

### Per-Screen Changes

**All screens:**
- Header bar: dark purple background (`#3A0066`), white/lavender text
- Points badge: gradient `purple → teal`

**HomeScreen:**
- Background: lavender (`#F5F0FF`)
- Greeting: "שלום, [שם]! 👋" (see Section 4 — username)
- Level cards: completed = teal border, unlocked = purple border + gradient button, locked = unchanged grey
- Progress summary line below greeting: "X מתוך Y שלבים הושלמו" + teal progress bar

**SimulationScreen:**
- Progress bar: segmented dots (teal = done, grey = remaining) instead of single bar
- "Start" / answer buttons: gradient purple→teal
- Back arrow: white on dark purple header

**FeedbackOverlay:**
- Correct: teal header (was green)
- Incorrect / try again: orange header — unchanged
- Golden tip block: unchanged yellow

**CertificateScreen:**
- Trophy and points in gold (`#FFB300`)
- Certificate border: gradient purple→teal

### Typography & Spacing

No changes — font sizes remain large (18px body, 24px title) for adult accessibility. Spacing tokens unchanged.

---

## Section 4 — Content Expansion + Local Username

### Local Username

**Behavior:**
- On first app open, show a one-time name prompt (bottom sheet or centered modal)
- User types a name or taps "בחר שם אקראי" (random name button)
- Name stored in Zustand store (persisted to `localStorage`) alongside game progress
- Greeting on HomeScreen: "שלום, [שם]! 👋"
- Name can be changed later (small edit icon near greeting, or settings stub)

**Data model change:** Add `playerName: string | null` to `gameStore`. Default `null` — when null, show the name prompt.

**`resetProgress` behaviour:** `resetProgress` resets only `cyberPoints` and `completedLevelIds`. It does **not** reset `playerName` — a user resetting their game progress should keep their name. This must be explicit in the implementation.

**Files affected:**
- `src/store/gameStore.ts` — add `playerName`, `setPlayerName()`
- `src/screens/HomeScreen.tsx` — greeting, name prompt modal
- `src/components/NamePromptModal.tsx` — new component (one-time prompt)

### Content Expansion

**Target:** 10–15 levels (up from 5)
**Schema:** No changes — existing `levels.json` format supports unlimited entries
**Code change:** Update `TOTAL_LEVELS` constant in `SimulationScreen.tsx` to **exactly match** the number of entries in `levels.json` — this constant gates both the certificate trigger (`allLevelsComplete`) and the progress bar total. An off-by-one here means the certificate never appears or appears too early.
**Source:** User supplies ~20 scenario descriptions; best 10 selected and formatted into Hebrew JSON

**Scenario types to use:**
- `hotspot` — identify a suspicious element in a mocked message/image
- `multipleChoice` — choose the correct response to a scam situation

**Topics to cover** (beyond existing 5):
- WhatsApp impersonation (fake family member)
- Fake prize / lottery SMS
- Bank account "frozen" phishing call
- Fake police/government call
- Romantic scam (online relationship)
- Fake job offer
- Investment scam ("guaranteed returns")
- Fake package redelivery
- Suspicious email attachment
- Social media account hijacking

---

## Delivery Order

| Step | What | Files |
|------|------|-------|
| 1 | Fix hotspot coordinates | `HotspotEngine.tsx` |
| 2 | Fix scrolling | `HomeScreen.tsx` |
| 3 | GitHub Actions workflow + push to GitHub (no app.json changes needed) | `.github/workflows/deploy.yml` |
| 4 | Theme redesign — color tokens | `src/theme/index.ts` |
| 5 | Apply theme to all screens & components | All screen/component files |
| 6 | Username store + NamePromptModal | `gameStore.ts`, `NamePromptModal.tsx`, `HomeScreen.tsx` |
| 7 | Add 10–15 new scenarios to `levels.json` | `src/data/levels/levels.json` |
| 8 | Update `TOTAL_LEVELS` | `SimulationScreen.tsx` |
| 9 | Rebuild and verify live on GitHub Pages | — |

---

## Out of Scope (Phase 2)

- Backend / server-side storage
- Email or password authentication
- Leaderboards
- Push notifications
- Analytics
- Native iOS/Android app store submission
- Multilingual support
