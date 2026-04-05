# Cyber Ed Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two web bugs, set up GitHub Pages auto-deployment, redesign the UI with a Purple + Teal palette, add a local username greeting, and expand content to 10–15 levels.

**Architecture:** All changes are additive or cosmetic — game logic, engine architecture, and data schema are untouched. Theme tokens in `src/theme/index.ts` are the single source of truth for colors; updating them propagates across all screens. New features (username) extend the existing Zustand store with one new field.

**Tech Stack:** Expo SDK 54, React Native 0.81, react-native-web, NativeWind, Zustand 5, React Navigation v7, Jest + Testing Library, expo-linear-gradient (new), GitHub Actions.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/features/simulations/engines/HotspotEngine.tsx` | Modify | Fix web tap coordinates |
| `__tests__/HotspotEngine.test.tsx` | Modify | Add coordinate extraction test |
| `src/screens/HomeScreen.tsx` | Modify | Scroll fix + theme + greeting |
| `src/hooks/useGameState.ts` | Modify | Expose playerName + setPlayerName |
| `.github/workflows/deploy.yml` | Create | GitHub Pages auto-deploy |
| `src/theme/index.ts` | Modify | Purple + Teal color tokens |
| `src/components/LevelCard.tsx` | Modify | Apply new theme |
| `src/components/FeedbackOverlay.tsx` | Modify | Apply new theme |
| `src/components/ProgressBar.tsx` | Modify | Teal fill |
| `src/features/simulations/SimulationScreen.tsx` | Modify | Dark header + segmented progress |
| `src/screens/CertificateScreen.tsx` | Modify | Gold points + teal border |
| `src/store/gameStore.ts` | Modify | Add playerName + setPlayerName |
| `__tests__/gameStore.test.ts` | Modify | Tests for playerName + resetProgress |
| `src/components/NamePromptModal.tsx` | Create | One-time username prompt |
| `src/data/levels/levels.json` | Modify | Add new scenarios (user provides content) |

---

## Task 1: Fix Hotspot Tap Coordinates on Web

**Files:**
- Modify: `src/features/simulations/engines/HotspotEngine.tsx`
- Modify: `__tests__/HotspotEngine.test.tsx`

**Background:** `handlePress` reads `event.nativeEvent.locationX/Y` which is element-relative on native but unreliable on web. On web, we use `getBoundingClientRect()` on a ref to the container, then subtract `clientX/Y` from the rect origin. The hit-detection logic (`findHotspotHit`) is unchanged — only coordinate extraction changes.

- [ ] **Step 1: Write the failing test**

Add to `__tests__/HotspotEngine.test.tsx`:

```tsx
import { extractNormalizedTapCoords } from '../src/features/simulations/engines/HotspotEngine';

describe('extractNormalizedTapCoords — native path', () => {
  it('normalizes locationX/Y against layout dimensions', () => {
    const event = { nativeEvent: { locationX: 50, locationY: 75 } };
    const layout = { width: 200, height: 300 };
    const ref = { current: null }; // native path: ref not used
    const result = extractNormalizedTapCoords(event, layout, ref);
    expect(result.tapX).toBeCloseTo(0.25);
    expect(result.tapY).toBeCloseTo(0.25);
  });

  it('clamps correctly at boundaries', () => {
    const event = { nativeEvent: { locationX: 0, locationY: 0 } };
    const layout = { width: 100, height: 100 };
    const ref = { current: null };
    const result = extractNormalizedTapCoords(event, layout, ref);
    expect(result.tapX).toBe(0);
    expect(result.tapY).toBe(0);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest HotspotEngine --no-coverage
```

Expected: FAIL — `extractNormalizedTapCoords` is not exported.

- [ ] **Step 3: Implement the fix in HotspotEngine.tsx**

Replace lines 1–74 of `src/features/simulations/engines/HotspotEngine.tsx` with:

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { BaseSimulationProps } from './BaseSimulationProps';
import { HotspotScenario, Hotspot } from '../../../types/scenario';
import { Colors, Typography, Spacing, Radius } from '../../../theme';

// Pure function — exported for unit testing
export function findHotspotHit(
  hotspots: Hotspot[],
  tapX: number,
  tapY: number
): Hotspot | null {
  return hotspots.find(hs =>
    tapX >= hs.region.x &&
    tapX <= hs.region.x + hs.region.width &&
    tapY >= hs.region.y &&
    tapY <= hs.region.y + hs.region.height
  ) ?? null;
}

// Exported for unit testing — extracts normalized (0–1) tap coordinates
// cross-platform: uses getBoundingClientRect on web, locationX/Y on native
export function extractNormalizedTapCoords(
  event: any,
  layout: { width: number; height: number },
  containerRef: React.RefObject<any>
): { tapX: number; tapY: number } {
  if (Platform.OS === 'web' && containerRef.current) {
    const rect = (containerRef.current as any).getBoundingClientRect();
    const rawX = event.nativeEvent.clientX - rect.left;
    const rawY = event.nativeEvent.clientY - rect.top;
    return { tapX: rawX / layout.width, tapY: rawY / layout.height };
  }
  return {
    tapX: event.nativeEvent.locationX / layout.width,
    tapY: event.nativeEvent.locationY / layout.height,
  };
}

const prefersReducedMotion =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HotspotEngine({
  scenario,
  attemptNumber,
  isEnabled,
  onAnswer,
}: BaseSimulationProps) {
  const hs = scenario as HotspotScenario;
  const containerRef = useRef<View>(null);
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);

  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRevealCorrect(false);
    setRipple(null);
  }, [attemptNumber]);

  const triggerRipple = (x: number, y: number) => {
    setRipple({ x, y });
    rippleScale.setValue(0);
    rippleOpacity.setValue(1);
    if (prefersReducedMotion) {
      setTimeout(() => setRipple(null), 100);
      return;
    }
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 1.5, duration: 400, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setRipple(null));
  };

  const handlePress = (event: any) => {
    if (!isEnabled) return;
    const { tapX, tapY } = extractNormalizedTapCoords(event, layout, containerRef);
    const rawX = Platform.OS === 'web' && containerRef.current
      ? event.nativeEvent.clientX - (containerRef.current as any).getBoundingClientRect().left
      : event.nativeEvent.locationX;
    const rawY = Platform.OS === 'web' && containerRef.current
      ? event.nativeEvent.clientY - (containerRef.current as any).getBoundingClientRect().top
      : event.nativeEvent.locationY;
    triggerRipple(rawX, rawY);
    const hit = findHotspotHit(hs.hotspots, tapX, tapY);
    if (!hit) {
      onAnswer({ isCorrect: false, feedbackText: hs.missedFeedback });
      return;
    }
    if (attemptNumber === 2 && !hit.isCorrect) setRevealCorrect(true);
    onAnswer({ isCorrect: hit.isCorrect, feedbackText: hit.feedback });
  };
```

Then attach the ref to the container View — find this line:

```tsx
      <View
        style={styles.messageContainer}
        onLayout={e => setLayout(e.nativeEvent.layout)}
```

Replace with:

```tsx
      <View
        ref={containerRef}
        style={styles.messageContainer}
        onLayout={e => setLayout(e.nativeEvent.layout)}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest HotspotEngine --no-coverage
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/engines/HotspotEngine.tsx __tests__/HotspotEngine.test.tsx
git commit -m "fix: use getBoundingClientRect for hotspot tap coordinates on web"
```

---

## Task 2: Fix Scrolling on Web

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

**Background:** `ScrollView` inside `SafeAreaView` (which renders as a `div` on web) collapses to zero height because no explicit height boundary is given. Fix: wrap only the `ScrollView` in a `View` with `flex: 1` and `overflow: 'hidden'`. The header and subtitle stay outside this wrapper.

- [ ] **Step 1: Update HomeScreen.tsx**

Find the `ScrollView` in `HomeScreen.tsx` (around line 28). The structure before the fix:

```tsx
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        ...
      </View>
      <Text style={styles.subtitle}>...</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        ...
      </ScrollView>
    </SafeAreaView>
```

Add a wrapper View around only the ScrollView:

```tsx
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        ...
      </View>
      <Text style={styles.subtitle}>...</Text>
      <View style={styles.scrollWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          ...
        </ScrollView>
      </View>
    </SafeAreaView>
```

Add to `StyleSheet.create`:

```ts
  scrollWrapper: { flex: 1, overflow: 'hidden' },
```

- [ ] **Step 2: Run all tests — verify nothing broke**

```bash
npx jest --no-coverage
```

Expected: All PASS.

- [ ] **Step 3: Rebuild and verify scrolling works visually**

```bash
npx expo export --platform web && python3 -m http.server 3000 --directory dist
```

Open http://localhost:3000 — level cards should now scroll.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "fix: wrap ScrollView in flex:1 container to restore scrolling on web"
```

---

## Task 3: GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow file**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

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

      - name: Install dependencies
        run: npm ci

      - name: Build web export
        run: npx expo export --platform web

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: Add .superpowers to .gitignore**

Check if `.gitignore` already has `.superpowers/`. If not, add it:

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml .gitignore
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

- [ ] **Step 4: Create GitHub repo and push**

On GitHub.com: create a new public repo named `cyber-ed`.

```bash
git remote add origin https://github.com/YOUR_USERNAME/cyber-ed.git
git branch -M main
git push -u origin main
```

- [ ] **Step 5: Enable GitHub Pages**

In the GitHub repo → Settings → Pages → Source: select `gh-pages` branch → Save.

Wait ~2 minutes for the first deploy to complete. The live URL will be:
`https://YOUR_USERNAME.github.io/cyber-ed/`

---

## Task 4: Update Theme Tokens

**Files:**
- Modify: `src/theme/index.ts`

- [ ] **Step 1: Replace Colors in theme/index.ts**

Replace the entire `Colors` export:

```ts
export const Colors = {
  primary: '#6A1B9A',       // Royal Purple — brand, buttons, active borders
  secondary: '#00897B',     // Teal — progress, completed states, success
  headerBg: '#3A0066',      // Dark Purple — top bars on all screens
  background: '#F5F0FF',    // Lavender — page background
  surface: '#FFFFFF',
  text: '#3A0066',          // Dark Purple — primary text
  accent: '#F57C00',        // Orange — incorrect feedback (unchanged)
  success: '#00897B',       // Teal — correct answers, completed levels
  points: '#FFB300',        // Gold — points badge
  cardBorder: '#E8E0F0',    // Light purple border
  locked: '#9E9E9E',
  disabled: '#BDBDBD',
};
```

- [ ] **Step 2: Run all tests — verify they still pass**

```bash
npx jest --no-coverage
```

Expected: All PASS (tests reference tokens, not hex values).

- [ ] **Step 3: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat: update theme tokens to Purple + Teal palette"
```

---

## Task 5: Apply Theme to All Screens and Components

**Files:**
- Modify: `src/components/ProgressBar.tsx`
- Modify: `src/components/FeedbackOverlay.tsx`
- Modify: `src/components/LevelCard.tsx`
- Modify: `src/features/simulations/SimulationScreen.tsx`
- Modify: `src/screens/CertificateScreen.tsx`
- Modify: `src/screens/HomeScreen.tsx`

**Note:** All screens already reference `Colors.*` tokens. The theme update in Task 4 propagates most changes automatically. This task handles structural changes (dark header bars, segmented progress dots, gradient buttons).

- [ ] **Step 1: Install expo-linear-gradient**

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 2: Update ProgressBar.tsx**

Replace the fill style to use `Colors.secondary` (teal):

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.min(Math.max(current / total, 0), 1);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%` as any }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginHorizontal: 16, marginBottom: 4 },
  fill: { height: 8, backgroundColor: Colors.secondary, borderRadius: 4 },
});
```

- [ ] **Step 3: Update FeedbackOverlay.tsx**

The `Colors.success` token now resolves to teal automatically. Just update the backdrop and sheet background, and the "המשך" button:

In `FeedbackOverlay.tsx`, update styles:

```ts
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(58,0,102,0.5)' },
  sheet: { backgroundColor: '#FAF5FF', borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card, overflow: 'hidden' },
  buttonPrimary: { backgroundColor: Colors.primary, borderRadius: Radius.button, minHeight: TouchTarget.min, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
```

- [ ] **Step 4: Update LevelCard.tsx**

Replace the card styles and button to use Purple + Teal and a gradient CTA:

```tsx
import { LinearGradient } from 'expo-linear-gradient';
```

Replace the button `<Pressable>` and its content at the bottom of the card:

```tsx
      {isUnlocked ? (
        <Pressable
          style={styles.buttonWrapper}
          onPress={isUnlocked ? onPress : undefined}
          disabled={!isUnlocked}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <LinearGradient
            colors={isCompleted ? ['#00897B', '#00897B'] : ['#6A1B9A', '#00897B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={[styles.button, styles.buttonDisabled]}>
          <Text style={[styles.buttonText, styles.buttonTextDisabled]}>{buttonLabel}</Text>
        </View>
      )}
```

Update styles:

```ts
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompleted: { borderColor: Colors.secondary },
  cardLocked: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  buttonWrapper: { borderRadius: Radius.button, overflow: 'hidden', minHeight: TouchTarget.min },
  button: { minHeight: TouchTarget.min, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  buttonDisabled: { backgroundColor: Colors.disabled },
  buttonText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.surface },
  buttonTextDisabled: { color: Colors.surface },
  completedBadge: { backgroundColor: '#E0F7F4', borderRadius: Radius.badge, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  completedBadgeText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.captionSize, color: Colors.secondary },
```

- [ ] **Step 5: Update SimulationScreen.tsx — dark header**

Replace the `header` style and add a dark header background:

```ts
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    backgroundColor: Colors.headerBg,
  },
  backText: { fontSize: 24, color: '#FFFFFF' },
  cyberPoints: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.points },
```

- [ ] **Step 6: Update HomeScreen.tsx — dark header**

Replace the `header` and `appTitle` / `pointsText` styles:

```ts
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.headerBg,
  },
  appTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.titleSize, color: '#FFFFFF' },
  pointsBadge: { backgroundColor: Colors.points, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  pointsText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.headerBg },
```

- [ ] **Step 7: Update CertificateScreen.tsx — gold points, teal border**

Replace the relevant entries inside `StyleSheet.create` (keep all other style properties exactly as they are):

```ts
  certificate: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.secondary,   // teal border (was primary green)
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  points: { fontFamily: Typography.fontFamilyBold, fontSize: 56, color: Colors.points },   // gold
  homeButton: {
    backgroundColor: 'transparent',
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  homeButtonText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.primary },
```

- [ ] **Step 8: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All PASS.

- [ ] **Step 9: Rebuild and verify visually**

```bash
npx expo export --platform web && python3 -m http.server 3000 --directory dist
```

Open http://localhost:3000 — app should show Purple + Teal theme.

- [ ] **Step 10: Commit**

```bash
git add src/components/ src/screens/ src/features/ package.json package-lock.json
git commit -m "feat: apply Purple + Teal visual redesign across all screens"
```

---

## Task 6: Local Username Feature

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `__tests__/gameStore.test.ts`
- Create: `src/components/NamePromptModal.tsx`
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Write failing tests for playerName**

Add to `__tests__/gameStore.test.ts`, updating the `beforeEach` and adding a new `describe` block:

```ts
beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [], playerName: null });
});

describe('playerName', () => {
  it('defaults to null', () => {
    expect(useGameStore.getState().playerName).toBeNull();
  });

  it('setPlayerName stores the name', () => {
    useGameStore.getState().setPlayerName('רז');
    expect(useGameStore.getState().playerName).toBe('רז');
  });

  it('resetProgress does NOT reset playerName', () => {
    useGameStore.getState().setPlayerName('רז');
    useGameStore.getState().completeLevel(1, 100);
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().playerName).toBe('רז');
    expect(useGameStore.getState().cyberPoints).toBe(0);
    expect(useGameStore.getState().completedLevelIds).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest gameStore --no-coverage
```

Expected: FAIL — `playerName` and `setPlayerName` not defined.

- [ ] **Step 3: Update gameStore.ts**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  cyberPoints: number;
  completedLevelIds: number[];
  playerName: string | null;
  completeLevel: (levelId: number, pointsEarned: number) => void;
  resetProgress: () => void;
  setPlayerName: (name: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      cyberPoints: 0,
      completedLevelIds: [],
      playerName: null,

      completeLevel: (levelId, pointsEarned) => {
        if (get().completedLevelIds.includes(levelId)) return;
        set(state => ({
          cyberPoints: state.cyberPoints + pointsEarned,
          completedLevelIds: [...state.completedLevelIds, levelId],
        }));
      },

      // resetProgress does NOT reset playerName — intentional
      resetProgress: () => set({ cyberPoints: 0, completedLevelIds: [] }),

      setPlayerName: (name) => set({ playerName: name }),
    }),
    {
      name: 'cyber-ed-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest gameStore --no-coverage
```

Expected: All PASS.

- [ ] **Step 5: Create NamePromptModal.tsx**

Create `src/components/NamePromptModal.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

const RANDOM_NAMES = ['דוד', 'שרה', 'משה', 'רחל', 'יעל', 'אסף', 'נעמה', 'עמי', 'תמר', 'אורי', 'נועה', 'גיל'];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function NamePromptModal() {
  const playerName = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const [input, setInput] = useState('');

  const handleSave = () => {
    const name = input.trim() || pickRandom(RANDOM_NAMES);
    setPlayerName(name);
  };

  const handleRandom = () => {
    setInput(pickRandom(RANDOM_NAMES));
  };

  return (
    <Modal visible={playerName === null} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🛡️</Text>
          <Text style={styles.title}>ברוך הבא!</Text>
          <Text style={styles.subtitle}>איך לקרוא לך?</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="הכנס שם..."
            placeholderTextColor={Colors.locked}
            textAlign="right"
            maxLength={20}
            autoFocus
          />
          <Pressable style={styles.randomButton} onPress={handleRandom}>
            <Text style={styles.randomText}>🎲 בחר שם אקראי</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>בואו נתחיל!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(58,0,102,0.7)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.xl, width: '100%', maxWidth: 380, alignItems: 'center', gap: Spacing.md },
  emoji: { fontSize: 56 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: 28, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.locked, textAlign: 'center' },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.button,
    padding: Spacing.md,
    fontSize: Typography.bodySize,
    fontFamily: Typography.fontFamily,
    color: Colors.text,
    minHeight: TouchTarget.min,
    textAlign: 'right',
  },
  randomButton: { paddingVertical: Spacing.sm },
  randomText: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.primary },
  saveButton: { backgroundColor: Colors.primary, borderRadius: Radius.button, minHeight: TouchTarget.min, width: '100%', alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.subtitleSize, color: Colors.surface },
});
```

- [ ] **Step 6: Add NamePromptModal and greeting to HomeScreen.tsx**

In `HomeScreen.tsx`:

1. Add import at the top:
```tsx
import NamePromptModal from '../components/NamePromptModal';
```

2. Add `playerName` to the destructured hook values:
```tsx
const { isLevelCompleted, isLevelUnlocked, cyberPoints, playerName } = useGameState();
```

   Also add `playerName` to the `useGameState` hook return in `src/hooks/useGameState.ts`:
```ts
const { cyberPoints, completedLevelIds, completeLevel, resetProgress, playerName, setPlayerName } = useGameStore();
// ...
return { cyberPoints, isLevelCompleted, isLevelUnlocked, allLevelsComplete, completeLevel, resetProgress, playerName, setPlayerName };
```

3. Update the greeting in the JSX — replace `<Text style={styles.appTitle}>מגן דיגיטלי</Text>` with:
```tsx
<Text style={styles.appTitle}>{playerName ? `שלום, ${playerName}! 👋` : 'מגן דיגיטלי 🛡️'}</Text>
```

4. Add `<NamePromptModal />` just before the closing `</SafeAreaView>`:
```tsx
      <NamePromptModal />
    </SafeAreaView>
```

- [ ] **Step 7: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All PASS.

- [ ] **Step 8: Rebuild and verify**

```bash
npx expo export --platform web && python3 -m http.server 3000 --directory dist
```

On first load: name prompt appears. Enter a name → greeting updates to "שלום, [שם]! 🛡️".

- [ ] **Step 9: Commit**

```bash
git add src/store/gameStore.ts src/hooks/useGameState.ts src/components/NamePromptModal.tsx src/screens/HomeScreen.tsx __tests__/gameStore.test.ts
git commit -m "feat: add local username with first-launch name prompt"
```

---

## Task 7: Content Expansion

**Files:**
- Modify: `src/data/levels/levels.json`
- Modify: `src/features/simulations/SimulationScreen.tsx`

**⚠️ PAUSE before starting this task.** The user must supply the new scenario descriptions before this task can proceed. Ask the user to share their 20 scenarios, then select the best 10 and format them into the JSON structure below.

### Scenario JSON schema (for reference)

**multipleChoice type:**
```json
{
  "levelId": 6,
  "isCompleted": false,
  "scenario": {
    "id": "scenario-6",
    "type": "multipleChoice",
    "title": "כותרת התרחיש",
    "description": "תיאור מה קורה בתרחיש הזה...",
    "task": "מה היית עושה?",
    "points": 100,
    "icon": "phone",
    "summaryTip": "טיפ הזהב שמסביר למה התשובה נכונה.",
    "options": [
      { "id": "opt-a", "text": "אפשרות א", "isCorrect": false, "feedback": "משוב על תשובה לא נכונה" },
      { "id": "opt-b", "text": "אפשרות ב", "isCorrect": true, "feedback": "משוב על תשובה נכונה" },
      { "id": "opt-c", "text": "אפשרות ג", "isCorrect": false, "feedback": "משוב על תשובה לא נכונה" }
    ]
  }
}
```

**hotspot type:**
```json
{
  "levelId": 7,
  "isCompleted": false,
  "scenario": {
    "id": "scenario-7",
    "type": "hotspot",
    "title": "כותרת התרחיש",
    "description": "תוכן ההודעה שמוצגת למשתמש עם הקישור החשוד או פרט חשוד",
    "task": "לחץ על החלק בהודעה שנראה לך הכי חשוד.",
    "points": 100,
    "icon": "mail",
    "summaryTip": "הסבר למה הדבר הזה חשוד.",
    "imageAsset": "",
    "imageAltText": "תיאור הנגיש של ההודעה",
    "hotspots": [
      {
        "id": "hotspot-1",
        "label": "תווית",
        "region": { "x": 0.0, "y": 0.6, "width": 1.0, "height": 0.25 },
        "isCorrect": true,
        "feedback": "כל הכבוד! הסבר למה זה נכון."
      }
    ],
    "missedFeedback": "הנחיה לאן להסתכל שוב."
  }
}
```

- [ ] **Step 1: Receive scenarios from user and add to levels.json**

Format all new scenarios following the schema above. Keep `levelId` sequential (6, 7, 8 ... N). All text in Hebrew.

- [ ] **Step 2: Update TOTAL_LEVELS in SimulationScreen.tsx**

Count the exact number of entries in `levels.json`. Update the constant:

```ts
const TOTAL_LEVELS = N; // replace N with the exact count
```

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All PASS.

- [ ] **Step 4: Rebuild and play through all levels**

```bash
npx expo export --platform web && python3 -m http.server 3000 --directory dist
```

Verify: all new levels are accessible, progress bar and certificate trigger correctly at the last level.

- [ ] **Step 5: Commit and push**

```bash
git add src/data/levels/levels.json src/features/simulations/SimulationScreen.tsx
git commit -m "feat: expand to N levels with new cybersecurity scenarios"
git push origin main
```

Pushing to `main` automatically triggers the GitHub Actions workflow from Task 3 — no manual build needed. The updated app will be live at your GitHub Pages URL within ~2 minutes.
