# Cyber_Ed — Design Specification
**Date:** 2026-04-04
**Status:** Approved
**Author:** Brainstorming session with Claude Code

---

## 1. Overview

Cyber_Ed is a gamified cybersecurity education mobile application tailored for Israeli seniors (ages 60+). The app teaches users to identify and avoid digital scams through interactive simulations and visual identification tasks. All content is in Hebrew with full RTL support.

**Phase 1 scope:** Expo Web deployment with 5 Hebrew scenarios, two interaction engines (Hotspot + Multiple Choice), local progress persistence, and a card-based home screen.

---

## 2. Tech Stack

| Concern | Technology |
|---|---|
| Framework | React Native (Expo SDK) |
| Web deployment | Expo Web (Phase 1) |
| Native deployment | App Store / Google Play (Phase 2) |
| Language | TypeScript |
| Styling | NativeWind (Tailwind CSS for React Native) |
| State management | Zustand with `persist` middleware |
| Navigation | React Navigation (Stack) |
| Fonts | Heebo via `@expo-google-fonts/heebo` |

---

## 3. Data Schema

### 3.1 BaseScenario

```typescript
interface BaseScenario {
  id: string;
  type: 'hotspot' | 'multipleChoice';
  title: string;           // Hebrew
  description: string;     // Hebrew case description
  task: string;            // Hebrew instruction
  points: number;          // Base Cyber-Points on completion
  icon: string;            // Icon name for level card
  summaryTip: string;      // "טיפ זהב" — always shown post-scenario
}
```

### 3.2 HotspotScenario

Hotspot coordinates use a **top-left origin**, normalized to the rendered image's physical pixel dimensions before any RTL transform is applied. `(x: 0, y: 0)` is the top-left corner of the image as rendered on screen.

```typescript
interface HotspotScenario extends BaseScenario {
  type: 'hotspot';
  imageAsset: string;       // Path to SMS/email mockup image
  imageAltText: string;     // Accessibility label for screen readers
  hotspots: Array<{
    id: string;
    label: string;
    region: {
      x: number;            // 0–1 fraction of image width from physical left edge
      y: number;            // 0–1 fraction of image height from physical top edge
      width: number;        // 0–1 fraction of image width
      height: number;       // 0–1 fraction of image height
    };
    isCorrect: boolean;
    feedback: string;       // Per-hotspot Hebrew feedback
  }>;
  missedFeedback: string;   // Feedback when tap misses all hotspots
}
```

### 3.3 MultipleChoiceScenario

```typescript
interface MultipleChoiceScenario extends BaseScenario {
  type: 'multipleChoice';
  options: Array<{
    id: string;
    text: string;           // Hebrew answer text
    isCorrect: boolean;
    feedback: string;       // Per-option Hebrew feedback
  }>;
}
```

### 3.4 Discriminated Union

```typescript
type Scenario = HotspotScenario | MultipleChoiceScenario;
```

TypeScript narrows the type automatically based on the `type` discriminant field.

### 3.5 Level

```typescript
interface Level {
  levelId: number;
  scenario: Scenario;
  isCompleted: boolean;    // Source of truth for green checkmark
  // isUnlocked derived: levelId === 1 || levels[levelId-2].isCompleted
}
```

### 3.6 Sample `levels.json` entry (validates schema)

```json
{
  "levels": [
    {
      "levelId": 1,
      "scenario": {
        "id": "scenario-1",
        "type": "hotspot",
        "title": "החבילה המעוכבת",
        "description": "קיבלת הודעה לנייד: 'דואר ישראל: חבילתך ממתינה במרכז המיון. עקב חוסר בפרטי כתובת, יש לשלם אגרת שחרור של 8.50 ש\"ח בקישור הבא: israel-post.shipping-update.com'",
        "task": "לחץ על החלק בהודעה שנראה לך הכי חשוד.",
        "points": 100,
        "icon": "package",
        "summaryTip": "גופים רשמיים לעולם לא יבקשו תשלום דחוף דרך קישור ב-SMS.",
        "imageAsset": "assets/images/scenario1_sms.png",
        "imageAltText": "צילום מסך של הודעת SMS מזויפת מדואר ישראל",
        "hotspots": [
          {
            "id": "hotspot-url",
            "label": "קישור חשוד",
            "region": { "x": 0.1, "y": 0.65, "width": 0.8, "height": 0.1 },
            "isCorrect": true,
            "feedback": "כל הכבוד! שמת לב שהקישור לא מוביל לאתר הרשמי של דואר ישראל (israelpost.co.il). נוכלים משתמשים בשמות דומים כדי להטעות."
          }
        ],
        "missedFeedback": "כדאי להסתכל שוב על הקישור שמופיע בהודעה. האם הוא נראה כמו אתר רשמי?"
      }
    }
  ]
}
```

---

## 4. Architecture — Simulation Engine (Strategy Pattern)

### 4.1 Component Registry

```typescript
// /src/features/simulations/SimulationRegistry.tsx
const ENGINE_REGISTRY: Record<Scenario['type'], React.ComponentType<BaseSimulationProps>> = {
  hotspot: HotspotEngine,
  multipleChoice: MultipleChoiceEngine,
};
```

Adding a new engine type (e.g., `dragAndDrop`) requires:
1. Create `/src/features/simulations/engines/DragAndDropEngine.tsx`
2. Add one line to the registry
3. Zero changes to `SimulationScreen` or existing engines

### 4.2 Shared Interface

```typescript
// /src/features/simulations/engines/BaseSimulationProps.ts

interface AnswerResult {
  isCorrect: boolean;
  feedbackText: string;    // Per-hotspot or per-option specific feedback
}

interface BaseSimulationProps {
  scenario: Scenario;
  attemptNumber: 1 | 2;   // Passed down by SimulationScreen; engines use to reset interactive state
  isEnabled: boolean;      // false while FeedbackOverlay is visible; engines disable all inputs
  onAnswer: (result: AnswerResult) => void;
}
```

**Note:** Engines do NOT compute `pointsEarned`. Points are computed by `SimulationScreen` after receiving `AnswerResult`, using `SimulationScreen`'s own `currentAttempt` state. This keeps engines free of reward logic.

### 4.3 SimulationScreen (Orchestrator)

**Local state:**
```typescript
const [currentAttempt, setCurrentAttempt] = useState<1 | 2>(1);
const [isOverlayVisible, setIsOverlayVisible] = useState(false);
const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
```

**Responsibilities:**
1. Receive `levelId` navigation param
2. Look up scenario from `levels.json`
3. Resolve engine component from `ENGINE_REGISTRY`
4. Render wrapper chrome: back button, progress bar, points display
5. Pass `attemptNumber` and `isEnabled={!isOverlayVisible}` to engine
6. Intercept `onAnswer` callback:
   - Set `lastResult`
   - Show `FeedbackOverlay`
7. On "נסה שוב" (attempt 1 incorrect):
   - Hide overlay → `setCurrentAttempt(2)` → engine re-renders with `attemptNumber=2`, resetting its interactive state
8. On "המשך" (success or attempt 2):
   - Compute `pointsEarned = scenario.points + (currentAttempt === 1 ? 50 : 0)`
   - Call `completeLevel(levelId, pointsEarned)`
   - If all levels complete → navigate to `Certificate`
   - Else → navigate to `Home`

**Back button interrupt:**
If `currentAttempt > 1` or a tap has occurred (i.e., `lastResult !== null`), show a Hebrew confirmation alert before navigating back:
```
Alert.alert('לצאת מהתרגיל?', 'ההתקדמות בתרגיל זה לא תישמר.', [
  { text: 'המשך תרגיל', style: 'cancel' },
  { text: 'צא', onPress: () => navigation.goBack() }
])
```

### 4.4 HotspotEngine

- Renders mockup image with `accessibilityLabel={scenario.imageAltText}`
- Absolute `Pressable` overlay captures all taps when `isEnabled === true`
- Tap coordinates normalized to 0–1 against rendered image dimensions
- Iterates `hotspots` to check if tap falls within any `region`
- **Ripple indicator:** Animated circle at exact tap coordinates. Sequence: scale 0→1.5 + opacity 1→0. Duration: 400ms minimum. Respects `prefers-reduced-motion`: if detected on web, skip animation (instantly remove indicator).
- On attempt 2 after incorrect: render a highlighted bounding box over the correct hotspot region (semi-transparent green overlay with border), visible behind the `FeedbackOverlay`.
- `attemptNumber` change triggers reset of any highlighted state from prior attempt.

### 4.5 MultipleChoiceEngine

- Renders `scenario.task` as question header
- Maps `scenario.options` to pressable answer buttons
- Buttons are interactive only when `isEnabled === true`
- On tap → `onAnswer({ isCorrect: option.isCorrect, feedbackText: option.feedback })`
- After tap: all buttons visually disabled (opacity reduced)
- On attempt 2 after incorrect: buttons re-enabled (because `attemptNumber` changed to 2, engine re-renders from clean state). After attempt 2 selection, correct answer button is highlighted in green and selected wrong answer in soft orange.

---

## 5. FeedbackOverlay — Two-Attempt Logic

The overlay is a bottom sheet modal (slides up, does not navigate).

### Attempt 1 — Incorrect
- Soft orange header
- `lastResult.feedbackText`
- "נסה שוב" button → `SimulationScreen` hides overlay, increments `currentAttempt` to 2

### Attempt 2 — Incorrect
- Soft orange header
- `lastResult.feedbackText`
- `summaryTip` ("טיפ זהב") block
- "המשך" button → `SimulationScreen` calls `completeLevel` (0 bonus points), navigates

### Success (any attempt)
- Green header
- `lastResult.feedbackText`
- `summaryTip` ("טיפ זהב") block
- "המשך" button → `SimulationScreen` calls `completeLevel` with computed points, navigates

### Points Model (computed in SimulationScreen, not in engine)

```typescript
const FIRST_TRY_BONUS = 50;

// Called only on success or after attempt 2
const pointsEarned = lastResult.isCorrect
  ? scenario.points + (currentAttempt === 1 ? FIRST_TRY_BONUS : 0)
  : 0; // Incorrect on attempt 2 — no points awarded
```

---

## 6. State Management

### 6.1 Zustand Store

```typescript
// /src/store/gameStore.ts
interface GameState {
  cyberPoints: number;
  completedLevelIds: number[];
  completeLevel: (levelId: number, pointsEarned: number) => void;
  resetProgress: () => void;
}
```

**`completeLevel` idempotency:** If `levelId` is already in `completedLevelIds`, the action returns early — neither `completedLevelIds` nor `cyberPoints` are modified. Points from a replayed level are never re-applied regardless of score.

```typescript
completeLevel: (levelId, pointsEarned) => set(state => {
  if (state.completedLevelIds.includes(levelId)) return state; // idempotent guard
  return {
    cyberPoints: state.cyberPoints + pointsEarned,
    completedLevelIds: [...state.completedLevelIds, levelId],
  };
})
```

- `isCompleted` and `isUnlocked` are **derived at render time** — not stored.
- Persisted via Zustand `persist` middleware to `localStorage` (key: `cyber-ed-progress`).

### 6.2 Phase 2 Migration Seam

```typescript
// Web (Phase 1):   storage: localStorage  (default)
// Native (Phase 2): storage: AsyncStorage  (swap one import in gameStore.ts)
```

### 6.3 `useGameState` Hook

```typescript
// /src/hooks/useGameState.ts
export const useGameState = () => {
  const { cyberPoints, completedLevelIds, completeLevel } = useGameStore();
  const isLevelCompleted = (id: number) => completedLevelIds.includes(id);
  const isLevelUnlocked = (id: number) => id === 1 || isLevelCompleted(id - 1);
  const allLevelsComplete = (totalLevels: number) =>
    completedLevelIds.length >= totalLevels;
  return { cyberPoints, isLevelCompleted, isLevelUnlocked, allLevelsComplete, completeLevel };
};
```

Components import from `useGameState` only — they never reference Zustand directly.

---

## 7. Navigation

```
AppNavigator (Stack.Navigator)
  ├── 'Home'        → HomeScreen
  ├── 'Simulation'  → SimulationScreen  (param: { levelId: number })
  └── 'Certificate' → CertificateScreen (param: { totalPoints: number })
```

**`Certificate` trigger:** After `completeLevel` succeeds in `SimulationScreen`, call `useGameState().allLevelsComplete(TOTAL_LEVELS)`. If true, navigate to `Certificate` with `totalPoints`. Otherwise navigate to `Home`.

**Back button on `SimulationScreen`:** Custom back button (not system default). If `lastResult !== null` (user has made at least one interaction), show Hebrew confirmation alert before navigating back (see Section 4.3).

---

## 8. RTL Configuration

### React Native

```typescript
// App.tsx — called unconditionally on every app start (not once / not conditionally)
import { I18nManager } from 'react-native';
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);
```

`forceRTL` requires a full reload to take effect on React Native native builds. For Phase 1 (Expo Web), this is handled by `app.json` `dir: "rtl"` at the HTML level. For Phase 2 native builds, Expo's managed workflow handles the reload automatically on first launch when `forceRTL` is set unconditionally.

### Expo Web (`app.json`)

```json
{
  "web": {
    "lang": "he",
    "dir": "rtl",
    "backgroundColor": "#FAF9F6"
  }
}
```

### Layout Rules (enforced throughout)
- `marginStart` / `marginEnd` instead of `marginLeft` / `marginRight`
- `textAlign: 'right'` or `'auto'` on all text
- Directional icons: `transform: [{ scaleX: -1 }]` for RTL flip (no separate assets needed)
- `flexDirection: 'row'` automatically reverses under `forceRTL`

---

## 9. Theme Constants

```typescript
// /src/theme/index.ts
export const Colors = {
  primary: '#2E7D32',      // Warm Green — primary brand color (buttons, headers)
  success: '#2E7D32',      // Same value as primary intentionally: success states use brand green
  // Note: if success green is ever lightened for accessibility reasons, update both
  accent: '#F57C00',       // Soft Orange — warnings, caution, incorrect feedback
  background: '#FAF9F6',   // Cream — reduced eye strain
  text: '#212121',         // Dark Charcoal — maximum contrast on light backgrounds
  surface: '#FFFFFF',
};

export const Typography = {
  fontFamily: 'Heebo',
  bodySize: 18,            // Minimum body text
  titleSize: 24,
  captionSize: 14,
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const Radius = {
  card: 20,
  button: 16,
  badge: 12,
};

export const TouchTarget = {
  min: 48,                 // dp — WCAG / accessibility minimum
};
```

All color combinations meet WCAG AA contrast requirements.

---

## 10. Home Screen — Level Card Grid

### `LevelCard` Props Interface

```typescript
interface LevelCardProps {
  level: Level;
  isCompleted: boolean;    // from useGameState().isLevelCompleted(level.levelId)
  isUnlocked: boolean;     // from useGameState().isLevelUnlocked(level.levelId)
  onPress: () => void;     // navigates to SimulationScreen with levelId
}
```

### Card Layout
- Vertical `ScrollView` of `LevelCard` components
- Each card: Hebrew title, icon placeholder, status badge, "התחל" button (min 48dp height)
- Sequential unlock: Level N+1 locked until Level N completed
- **Completed:** green border + "נלמד ✓" badge, button label "שחק שוב"
- **Locked:** grayscale + lock icon, "התחל" button disabled with reduced opacity
- **Available:** full color, "התחל" button active

---

## 11. Content — Initial 5 Scenarios

| # | Title (Hebrew) | Type |
|---|---|---|
| 1 | החבילה המעוכבת | Hotspot |
| 2 | הקוד הסודי בטלפון | Multiple Choice |
| 3 | הטלפון שנשבר | Hotspot |
| 4 | כרטיסי טיסה בחינם | Multiple Choice |
| 5 | הודעת מערכת "דחופה" | Multiple Choice |

Full Hebrew content (descriptions, options, feedback, summaryTip) defined in `/src/data/levels/levels.json`. Schema validated by the sample entry in Section 3.6.

---

## 12. Milestone Certificate Screen

Triggered when `allLevelsComplete(5)` returns true after `completeLevel`.

Displays:
- Congratulations message in Hebrew
- Total Cyber-Points earned
- Shareable/screenshottable certificate card

**WhatsApp share button:**
- On mobile web / native: deep link `whatsapp://send?text=...`
- On desktop web: button is replaced with "העתק טקסט" (Copy text) button using `Clipboard.setString()`, since `whatsapp://` deep links fail silently on desktop browsers.
- Mobile detection: use a screen-width threshold (`Dimensions.get('window').width < 768`) as a simple, dependency-free heuristic. If `Platform.OS !== 'web'`, always show the WhatsApp button.

---

## 13. Directory Structure

```
/src
  /components
    FeedbackOverlay.tsx
    LevelCard.tsx
    ProgressBar.tsx
  /features/simulations
    SimulationScreen.tsx
    SimulationRegistry.tsx
    /engines
      HotspotEngine.tsx
      MultipleChoiceEngine.tsx
      BaseSimulationProps.ts
  /data/levels
    levels.json
  /hooks
    useGameState.ts
  /store
    gameStore.ts
  /theme
    index.ts
  /navigation
    AppNavigator.tsx
  /screens
    HomeScreen.tsx
    CertificateScreen.tsx
App.tsx
app.json
```

---

## 14. Out of Scope for Phase 1

- User accounts / authentication
- Cloud sync / Firebase
- Drag & Drop engine
- Leaderboard
- Push notifications
- Analytics
