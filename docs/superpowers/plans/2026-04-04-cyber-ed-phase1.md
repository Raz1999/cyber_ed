# Cyber_Ed Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable Phase 1 of Cyber_Ed — a gamified Hebrew cybersecurity education app for Israeli seniors — running on Expo Web with 5 interactive scenarios.

**Architecture:** Strategy Pattern simulation engine: each scenario type has an isolated renderer (`HotspotEngine`, `MultipleChoiceEngine`) registered in `SimulationRegistry`. `SimulationScreen` orchestrates attempt tracking, feedback, and navigation. Progress persisted locally via Zustand + persist middleware.

**Tech Stack:** React Native (Expo SDK), TypeScript, NativeWind v4 (Tailwind CSS), Zustand ^5, React Navigation v7 (Stack), Heebo via `@expo-google-fonts/heebo`, Jest + jest-expo + @testing-library/react-native

> **Note on installed versions:** NativeWind v4.2.3 and Zustand v5.0.12 are installed (plan was written for v2/v4 but v4/v5 are backwards-compatible for all code in this plan). Zustand v5 uses `import { create } from 'zustand'` named export. NativeWind v4 uses metro.config.js + global.css setup (already configured).

---

## File Map

```
/                               (Expo project root)
├── App.tsx                     RTL config, font loading, NavigationContainer
├── app.json                    web: lang=he, dir=rtl, backgroundColor=#FAF9F6
├── tailwind.config.js          NativeWind content paths
├── babel.config.js             NativeWind babel plugin
├── nativewind.d.ts             NativeWind type declarations
├── src/
│   ├── types/
│   │   └── scenario.ts         All TypeScript interfaces (Scenario, Level, etc.)
│   ├── theme/
│   │   └── index.ts            Colors, Typography, Spacing, Radius, TouchTarget
│   ├── data/
│   │   └── levels/
│   │       └── levels.json     All 5 Hebrew scenarios
│   ├── store/
│   │   └── gameStore.ts        Zustand store + persist (cyberPoints, completedLevelIds)
│   ├── hooks/
│   │   └── useGameState.ts     Thin store accessor (isLevelCompleted, isLevelUnlocked, etc.)
│   ├── navigation/
│   │   └── AppNavigator.tsx    Stack with Home / Simulation / Certificate screens
│   ├── components/
│   │   ├── LevelCard.tsx       Single scenario card (title, icon, status badge, CTA button)
│   │   ├── FeedbackOverlay.tsx Bottom-sheet modal with two-attempt logic
│   │   └── ProgressBar.tsx     Horizontal progress indicator for SimulationScreen header
│   ├── screens/
│   │   ├── HomeScreen.tsx      Vertical ScrollView of LevelCards
│   │   └── CertificateScreen.tsx  Milestone screen shown after all 5 levels complete
│   └── features/
│       └── simulations/
│           ├── SimulationScreen.tsx    Orchestrator (attempt state, overlay, navigation)
│           ├── SimulationRegistry.tsx  { hotspot: HotspotEngine, multipleChoice: MCEngine }
│           └── engines/
│               ├── BaseSimulationProps.ts   Shared interface for all engines
│               ├── HotspotEngine.tsx        Tap-on-image engine with ripple indicator
│               └── MultipleChoiceEngine.tsx  Button-selection engine
└── __tests__/
    ├── gameStore.test.ts
    ├── useGameState.test.ts
    ├── HotspotEngine.test.tsx
    ├── MultipleChoiceEngine.test.tsx
    ├── FeedbackOverlay.test.tsx
    └── SimulationScreen.test.tsx
```

---

## Task 1: Scaffold Expo Project

**Files:**
- Create: project root (all config files)

- [ ] **Step 1: Initialize Expo project**

```bash
cd /Users/razo/Desktop/Raz/ClaudeProjects
npx create-expo-app@latest Cyber_Ed --template blank-typescript
cd Cyber_Ed
```

- [ ] **Step 2: Install core runtime dependencies**

```bash
npx expo install react-native-screens react-native-safe-area-context
npm install @react-navigation/native @react-navigation/stack
npm install zustand
npx expo install @expo-google-fonts/heebo expo-font
npx expo install expo-clipboard
```

- [ ] **Step 3: Install NativeWind v2**

```bash
npm install nativewind
npm install --save-dev tailwindcss@3.3.2
npx tailwindcss init
```

- [ ] **Step 4: Install testing dependencies**

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 5: Configure NativeWind — replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 6: Configure NativeWind — replace `babel.config.js`**

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"],
  };
};
```

- [ ] **Step 7: Add NativeWind type declarations — create `nativewind.d.ts` at root**

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 8: Configure Jest — add to `package.json`**

Add this `jest` field to `package.json`:

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|zustand)"
  ]
}
```

- [ ] **Step 9: Create `src/` directory structure**

```bash
mkdir -p src/types src/theme src/data/levels src/store src/hooks src/navigation src/components src/screens src/features/simulations/engines __tests__
```

- [ ] **Step 10: Verify project runs**

```bash
npx expo start --web
```

Expected: Browser opens with default Expo screen. No errors in terminal.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: scaffold Expo project with NativeWind, Zustand, React Navigation"
```

---

## Task 2: Theme Constants

**Files:**
- Create: `src/theme/index.ts`

- [ ] **Step 1: Create theme file**

```typescript
// src/theme/index.ts

export const Colors = {
  primary: '#2E7D32',       // Warm Green — primary brand, success states
  success: '#2E7D32',       // Intentionally same as primary; update both if changed
  accent: '#F57C00',        // Soft Orange — warnings, incorrect feedback (not red)
  background: '#FAF9F6',    // Cream — reduces eye strain
  text: '#212121',          // Dark Charcoal — WCAG AA on background
  surface: '#FFFFFF',
  cardBorder: '#E0E0E0',
  locked: '#9E9E9E',
  disabled: '#BDBDBD',
};

export const Typography = {
  fontFamily: 'Heebo_400Regular',
  fontFamilyBold: 'Heebo_700Bold',
  bodySize: 18,
  titleSize: 24,
  subtitleSize: 20,
  captionSize: 14,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  card: 20,
  button: 16,
  badge: 12,
  sm: 8,
};

export const TouchTarget = {
  min: 48,   // dp — WCAG / accessibility minimum
};
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat: add theme constants (colors, typography, spacing)"
```

---

## Task 3: TypeScript Interfaces

**Files:**
- Create: `src/types/scenario.ts`

- [ ] **Step 1: Create scenario types file**

```typescript
// src/types/scenario.ts

export interface BaseScenario {
  id: string;
  type: 'hotspot' | 'multipleChoice';
  title: string;
  description: string;
  task: string;
  points: number;
  icon: string;
  summaryTip: string;
}

export interface HotspotRegion {
  x: number;       // 0–1, fraction of container width from physical left edge
  y: number;       // 0–1, fraction of container height from physical top edge
  width: number;   // 0–1 fraction
  height: number;  // 0–1 fraction
}

export interface Hotspot {
  id: string;
  label: string;
  region: HotspotRegion;
  isCorrect: boolean;
  feedback: string;
}

export interface HotspotScenario extends BaseScenario {
  type: 'hotspot';
  imageAsset: string;       // Path to PNG mockup (Phase 2); empty string uses styled View
  imageAltText: string;     // accessibilityLabel for screen readers
  hotspots: Hotspot[];
  missedFeedback: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface MultipleChoiceScenario extends BaseScenario {
  type: 'multipleChoice';
  options: MultipleChoiceOption[];
}

export type Scenario = HotspotScenario | MultipleChoiceScenario;

export interface Level {
  levelId: number;
  scenario: Scenario;
  isCompleted: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  feedbackText: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/scenario.ts
git commit -m "feat: add TypeScript scenario and level interfaces"
```

---

## Task 4: Levels Data (levels.json)

**Files:**
- Create: `src/data/levels/levels.json`

> **Note on Hotspot Coordinates:** Scenarios 1 and 3 use a styled `MockMessageView` (a fixed-layout React Native View) instead of a PNG image (`imageAsset: ""`). The hotspot regions below are calibrated to a view of approximately 320×240dp. If layout differs, adjust coordinates after first render.

- [ ] **Step 1: Create levels.json with all 5 scenarios**

```json
{
  "levels": [
    {
      "levelId": 1,
      "isCompleted": false,
      "scenario": {
        "id": "scenario-1",
        "type": "hotspot",
        "title": "החבילה המעוכבת",
        "description": "דואר ישראל: חבילתך ממתינה במרכז המיון. עקב חוסר בפרטי כתובת, יש לשלם אגרת שחרור של 8.50 ש\"ח בקישור הבא: israel-post.shipping-update.com",
        "task": "לחץ על החלק בהודעה שנראה לך הכי חשוד.",
        "points": 100,
        "icon": "package",
        "summaryTip": "גופים רשמיים לעולם לא יבקשו תשלום דחוף דרך קישור ב-SMS. הכתובת הרשמית של דואר ישראל היא israelpost.co.il בלבד.",
        "imageAsset": "",
        "imageAltText": "צילום מסך של הודעת SMS מזויפת מדואר ישראל המכילה קישור חשוד",
        "hotspots": [
          {
            "id": "hotspot-url",
            "label": "קישור חשוד",
            "region": { "x": 0.0, "y": 0.65, "width": 1.0, "height": 0.25 },
            "isCorrect": true,
            "feedback": "כל הכבוד! שמת לב שהקישור לא מוביל לאתר הרשמי של דואר ישראל (israelpost.co.il). נוכלים משתמשים בשמות דומים כדי להטעות."
          }
        ],
        "missedFeedback": "כדאי להסתכל שוב על הקישור שמופיע בהודעה. האם הוא נראה כמו אתר רשמי של דואר ישראל?"
      }
    },
    {
      "levelId": 2,
      "isCompleted": false,
      "scenario": {
        "id": "scenario-2",
        "type": "multipleChoice",
        "title": "הקוד הסודי בטלפון",
        "description": "מישהו מתקשר אליך ומזדהה כנציג מחלקת הביטחון של הבנק. הוא אומר: \"יש ניסיון פריצה לחשבונך. שלחתי לך עכשיו קוד ב-SMS, אנא הקרא לי אותו כדי שאוכל לחסום את הפורץ\".",
        "task": "מה התגובה הנכונה ביותר?",
        "points": 100,
        "icon": "phone",
        "summaryTip": "בנק לעולם לא יבקש ממך את הקוד שנשלח אליך לנייד. הקוד הוא המפתח לכסף שלך — אסור לתת אותו לאף אחד, גם לא למי שטוען שהוא מהבנק.",
        "options": [
          {
            "id": "opt-1",
            "text": "להקריא לו את הקוד מהר כדי שלא יגנבו כסף",
            "isCorrect": false,
            "feedback": "זוהי בדיוק המטרה של הרמאי — לגרום לך לפעול במהירות מתוך פחד. הקוד שנשלח אליך הוא חד-פעמי ומאפשר גישה לחשבון שלך."
          },
          {
            "id": "opt-2",
            "text": "לנתק מיד ולהתקשר בעצמך למספר הרשמי של שירות הלקוחות בבנק",
            "isCorrect": true,
            "feedback": "מצוין! תמיד נתקו ויצרו קשר ביוזמתכם עם הבנק דרך המספר שעל גב כרטיס האשראי. לעולם אל תסמכו על מי שמתקשר אליכם."
          },
          {
            "id": "opt-3",
            "text": "לבקש ממנו את שמו המלא ומספר עובד ואז להקריא את הקוד",
            "isCorrect": false,
            "feedback": "לרמאים יש תשובות מוכנות לכל שאלה. שם ומספר עובד לא מוכיחים דבר. הפתרון היחיד הוא לנתק ולהתקשר לבנק ישירות."
          }
        ]
      }
    },
    {
      "levelId": 3,
      "isCompleted": false,
      "scenario": {
        "id": "scenario-3",
        "type": "hotspot",
        "title": "הטלפון שנשבר",
        "description": "היי אבא, זה אני. הטלפון שלי נפל למים וזה מספר זמני. אני חייב לשלם על תיקון דחוף ולא מצליח להיכנס לאפליקציה של הבנק. אתה יכול להעביר לי 1,500 ש\"ח בביט למספר הזה?",
        "task": "סמן את הדבר הכי מחשיד בהודעה.",
        "points": 100,
        "icon": "chat",
        "summaryTip": "תמיד כשקרוב משפחה מבקש כסף ממספר לא מוכר, יש לעצור ולהתקשר למספר הישן שלו לוודא שזה באמת הוא. אף אחד לא \"חייב\" כסף עכשיו דווקא.",
        "imageAsset": "",
        "imageAltText": "צילום מסך של הודעת וואטסאפ מזויפת מבן משפחה המבקש העברת כסף דחופה",
        "hotspots": [
          {
            "id": "hotspot-money",
            "label": "בקשת כסף דחופה",
            "region": { "x": 0.0, "y": 0.7, "width": 1.0, "height": 0.25 },
            "isCorrect": true,
            "feedback": "נכון מאוד! בקשה דחופה לכסף ממספר לא מוכר היא סימן אדום קלאסי. תמיד התקשרו לוודא לפני כל העברת כסף."
          }
        ],
        "missedFeedback": "הסתכלו שוב — מה יוצא דופן בהודעה הזו? מה הדבר שיכול לגרום לכם להיות חשדניים?"
      }
    },
    {
      "levelId": 4,
      "isCompleted": false,
      "scenario": {
        "id": "scenario-4",
        "type": "multipleChoice",
        "title": "כרטיסי טיסה בחינם",
        "description": "ראית פוסט בפייסבוק: \"לרגל חגיגות 75 שנה לאל-על, החברה מחלקת 2 כרטיסי טיסה חינם לכל מי שימלא סקר קצר וישתף את הפוסט עם 10 חברים\".",
        "task": "מה תעשה?",
        "points": 100,
        "icon": "airplane",
        "summaryTip": "הצעות שנראות 'טובות מדי מכדי להיות אמיתיות' הן בדרך כלל הונאות שנועדו לאסוף פרטים אישיים או להפיץ וירוסים. בדקו תמיד באתר הרשמי.",
        "options": [
          {
            "id": "opt-1",
            "text": "אשתף עם המשפחה — מקסימום נזכה",
            "isCorrect": false,
            "feedback": "שיתוף הפוסט עוזר לרמאים להגיע לעוד אנשים. גם אם לא תמלאו פרטים, אתם עוזרים להפיץ את ההונאה."
          },
          {
            "id": "opt-2",
            "text": "אכנס לאתר הרשמי של אל-על בגוגל כדי לבדוק אם המבצע מופיע שם",
            "isCorrect": true,
            "feedback": "בדיוק! בדיקה באתר הרשמי היא הדרך הנכונה. אם המבצע אמיתי, הוא יופיע שם. אל תלחצו על קישורים בפוסטים."
          },
          {
            "id": "opt-3",
            "text": "אלחץ על הקישור ואמלא את הפרטים האישיים שלי כדי לא לפספס",
            "isCorrect": false,
            "feedback": "מילוי פרטים אישיים בקישורים לא מוכרים עלול להוביל לגניבת זהות. הרמאים משתמשים בהצעות מפתות כדי לאסוף פרטים."
          }
        ]
      }
    },
    {
      "levelId": 5,
      "isCompleted": false,
      "scenario": {
        "id": "scenario-5",
        "type": "multipleChoice",
        "title": "הודעת מערכת דחופה",
        "description": "בזמן גלישה באינטרנט, קופצת הודעה על המסך: \"הטלפון שלך בסיכון! נמצאו 3 וירוסים. עליך להתקין את עדכון האבטחה מיד כדי למנוע מחיקת נתונים\". מתחת מופיע כפתור גדול: \"התקן עכשיו\".",
        "task": "מהו הצעד הבטוח ביותר?",
        "points": 100,
        "icon": "shield",
        "summaryTip": "אתרי אינטרנט לא יכולים לסרוק את הטלפון שלך. אלו פרסומות מפחידות שנועדו לגרום לך להתקין תוכנות זדוניות. תמיד סגרו את חלונית הדפדפן.",
        "options": [
          {
            "id": "opt-1",
            "text": "ללחוץ על 'התקן' כדי להגן על הטלפון",
            "isCorrect": false,
            "feedback": "לחיצה על הכפתור עלולה להוריד תוכנה זדונית לטלפון שלך. ההודעה עצמה היא האיום, לא הוירוסים שהיא מזהירה מפניהם."
          },
          {
            "id": "opt-2",
            "text": "לכבות את הטלפון ולהדליק מחדש",
            "isCorrect": false,
            "feedback": "כיבוי והדלקה לא יפתרו את הבעיה — כשתפתחו שוב את הדפדפן, ההודעה תחזור. הפתרון הנכון הוא לסגור את הכרטיסייה."
          },
          {
            "id": "opt-3",
            "text": "לסגור את חלונית הדפדפן ולא ללחוץ על שום דבר בתוך ההודעה",
            "isCorrect": true,
            "feedback": "מעולה! אתרי אינטרנט לא יכולים לסרוק את הטלפון שלך. תמיד סגרו הודעות כאלה בלחיצה על כפתור ה-X של הדפדפן, לא על הכפתורים בתוך ההודעה."
          }
        ]
      }
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/levels/levels.json
git commit -m "feat: add 5 Hebrew cybersecurity scenarios (levels.json)"
```

---

## Task 5: Zustand Store (TDD)

**Files:**
- Create: `__tests__/gameStore.test.ts`
- Create: `src/store/gameStore.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/gameStore.test.ts
import { useGameStore } from '../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [] });
});

describe('completeLevel', () => {
  it('awards points for a new completion', () => {
    useGameStore.getState().completeLevel(1, 100);
    expect(useGameStore.getState().cyberPoints).toBe(100);
  });

  it('adds levelId to completedLevelIds', () => {
    useGameStore.getState().completeLevel(1, 100);
    expect(useGameStore.getState().completedLevelIds).toContain(1);
  });

  it('is idempotent — completing same level twice does not double award', () => {
    useGameStore.getState().completeLevel(1, 100);
    useGameStore.getState().completeLevel(1, 50);
    expect(useGameStore.getState().cyberPoints).toBe(100);
    expect(useGameStore.getState().completedLevelIds.filter(id => id === 1).length).toBe(1);
  });
});

describe('resetProgress', () => {
  it('clears all progress', () => {
    useGameStore.getState().completeLevel(1, 100);
    useGameStore.getState().completeLevel(2, 100);
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().cyberPoints).toBe(0);
    expect(useGameStore.getState().completedLevelIds).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="gameStore" --no-coverage
```

Expected: FAIL — `Cannot find module '../src/store/gameStore'`

- [ ] **Step 3: Implement the store**

```typescript
// src/store/gameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  cyberPoints: number;
  completedLevelIds: number[];
  completeLevel: (levelId: number, pointsEarned: number) => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      cyberPoints: 0,
      completedLevelIds: [],

      completeLevel: (levelId, pointsEarned) => {
        if (get().completedLevelIds.includes(levelId)) return; // idempotent guard
        set(state => ({
          cyberPoints: state.cyberPoints + pointsEarned,
          completedLevelIds: [...state.completedLevelIds, levelId],
        }));
      },

      resetProgress: () => set({ cyberPoints: 0, completedLevelIds: [] }),
    }),
    {
      name: 'cyber-ed-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="gameStore" --no-coverage
```

Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts __tests__/gameStore.test.ts
git commit -m "feat: add Zustand game store with persist middleware (TDD)"
```

---

## Task 6: useGameState Hook (TDD)

**Files:**
- Create: `__tests__/useGameState.test.ts`
- Create: `src/hooks/useGameState.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/useGameState.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useGameState } from '../src/hooks/useGameState';
import { useGameStore } from '../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [] });
});

it('level 1 is always unlocked', () => {
  const { result } = renderHook(() => useGameState());
  expect(result.current.isLevelUnlocked(1)).toBe(true);
});

it('level 2 is locked until level 1 is complete', () => {
  const { result } = renderHook(() => useGameState());
  expect(result.current.isLevelUnlocked(2)).toBe(false);
  act(() => result.current.completeLevel(1, 100));
  expect(result.current.isLevelUnlocked(2)).toBe(true);
});

it('isLevelCompleted returns false for incomplete levels', () => {
  const { result } = renderHook(() => useGameState());
  expect(result.current.isLevelCompleted(1)).toBe(false);
});

it('isLevelCompleted returns true after completion', () => {
  const { result } = renderHook(() => useGameState());
  act(() => result.current.completeLevel(1, 100));
  expect(result.current.isLevelCompleted(1)).toBe(true);
});

it('allLevelsComplete returns true when all levels done', () => {
  const { result } = renderHook(() => useGameState());
  act(() => {
    result.current.completeLevel(1, 100);
    result.current.completeLevel(2, 100);
    result.current.completeLevel(3, 100);
    result.current.completeLevel(4, 100);
    result.current.completeLevel(5, 100);
  });
  expect(result.current.allLevelsComplete(5)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="useGameState" --no-coverage
```

Expected: FAIL — `Cannot find module '../src/hooks/useGameState'`

- [ ] **Step 3: Implement the hook**

```typescript
// src/hooks/useGameState.ts
import { useGameStore } from '../store/gameStore';

export const useGameState = () => {
  const { cyberPoints, completedLevelIds, completeLevel, resetProgress } = useGameStore();

  const isLevelCompleted = (id: number): boolean =>
    completedLevelIds.includes(id);

  const isLevelUnlocked = (id: number): boolean =>
    id === 1 || isLevelCompleted(id - 1);

  const allLevelsComplete = (totalLevels: number): boolean =>
    completedLevelIds.length >= totalLevels;

  return {
    cyberPoints,
    isLevelCompleted,
    isLevelUnlocked,
    allLevelsComplete,
    completeLevel,
    resetProgress,
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="useGameState" --no-coverage
```

Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameState.ts __tests__/useGameState.test.ts
git commit -m "feat: add useGameState hook with unlock/completion logic (TDD)"
```

---

## Task 7: AppNavigator

**Files:**
- Create: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Create navigator**

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import SimulationScreen from '../features/simulations/SimulationScreen';
import CertificateScreen from '../screens/CertificateScreen';

export type RootStackParamList = {
  Home: undefined;
  Simulation: { levelId: number };
  Certificate: { totalPoints: number };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FAF9F6' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Simulation" component={SimulationScreen} />
      <Stack.Screen name="Certificate" component={CertificateScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add React Navigation stack (Home/Simulation/Certificate)"
```

---

## Task 8: App.tsx — RTL, Fonts, Navigation Root

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Replace App.tsx**

```typescript
// App.tsx
import React from 'react';
import { I18nManager, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Heebo_400Regular, Heebo_700Bold } from '@expo-google-fonts/heebo';
import AppNavigator from './src/navigation/AppNavigator';

// Force RTL for Hebrew — called unconditionally on every launch
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function App() {
  const [fontsLoaded] = useFonts({
    Heebo_400Regular,
    Heebo_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>טוען...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: Update `app.json` web config**

Add `"web"` field inside `"expo"` object:

```json
"web": {
  "favicon": "./assets/favicon.png",
  "lang": "he",
  "dir": "rtl",
  "backgroundColor": "#FAF9F6",
  "bundler": "metro"
}
```

- [ ] **Step 3: Verify app loads with RTL and Heebo font**

```bash
npx expo start --web
```

Expected: App loads, text renders in Heebo font, layout is RTL.

- [ ] **Step 4: Commit**

```bash
git add App.tsx app.json
git commit -m "feat: configure RTL, Heebo fonts, and NavigationContainer in App.tsx"
```

---

## Task 9: BaseSimulationProps + SimulationRegistry

**Files:**
- Create: `src/features/simulations/engines/BaseSimulationProps.ts`
- Create: `src/features/simulations/SimulationRegistry.tsx`

> These files are stubs for now — engines will be wired in Tasks 10 and 11.

- [ ] **Step 1: Create BaseSimulationProps interface**

```typescript
// src/features/simulations/engines/BaseSimulationProps.ts
import { Scenario } from '../../../types/scenario';

export interface AnswerResult {
  isCorrect: boolean;
  feedbackText: string;
}

export interface BaseSimulationProps {
  scenario: Scenario;
  attemptNumber: 1 | 2;
  isEnabled: boolean;
  onAnswer: (result: AnswerResult) => void;
}
```

- [ ] **Step 2: Create SimulationRegistry (placeholder until engines exist)**

> ⚠️ **Do NOT run or test the app after this step.** The registry imports `HotspotEngine` and `MultipleChoiceEngine` which do not exist until Tasks 10 and 11. Attempting to run before those tasks will cause a compile error. Proceed directly to Task 10.

```typescript
// src/features/simulations/SimulationRegistry.tsx
import React from 'react';
import { Scenario } from '../../types/scenario';
import { BaseSimulationProps } from './engines/BaseSimulationProps';
import HotspotEngine from './engines/HotspotEngine';
import MultipleChoiceEngine from './engines/MultipleChoiceEngine';

export const ENGINE_REGISTRY: Record<
  Scenario['type'],
  React.ComponentType<BaseSimulationProps>
> = {
  hotspot: HotspotEngine,
  multipleChoice: MultipleChoiceEngine,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/features/simulations/engines/BaseSimulationProps.ts src/features/simulations/SimulationRegistry.tsx
git commit -m "feat: add BaseSimulationProps interface and SimulationRegistry"
```

---

## Task 10: MultipleChoiceEngine (TDD)

**Files:**
- Create: `__tests__/MultipleChoiceEngine.test.tsx`
- Create: `src/features/simulations/engines/MultipleChoiceEngine.tsx`

> Build MultipleChoiceEngine before HotspotEngine — simpler to test, validates shared interface.

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/MultipleChoiceEngine.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MultipleChoiceEngine from '../src/features/simulations/engines/MultipleChoiceEngine';
import { MultipleChoiceScenario } from '../src/types/scenario';

const mockScenario: MultipleChoiceScenario = {
  id: 'test-mc',
  type: 'multipleChoice',
  title: 'Test',
  description: 'תיאור בדיקה',
  task: 'מה לעשות?',
  points: 100,
  icon: 'test',
  summaryTip: 'טיפ',
  options: [
    { id: 'o1', text: 'תשובה שגויה', isCorrect: false, feedback: 'משוב שגוי' },
    { id: 'o2', text: 'תשובה נכונה', isCorrect: true, feedback: 'משוב נכון' },
  ],
};

it('renders the task question', () => {
  const { getByText } = render(
    <MultipleChoiceEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={true}
      onAnswer={jest.fn()}
    />
  );
  expect(getByText('מה לעשות?')).toBeTruthy();
});

it('renders all answer options', () => {
  const { getByText } = render(
    <MultipleChoiceEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={true}
      onAnswer={jest.fn()}
    />
  );
  expect(getByText('תשובה שגויה')).toBeTruthy();
  expect(getByText('תשובה נכונה')).toBeTruthy();
});

it('calls onAnswer with correct result when correct option tapped', () => {
  const onAnswer = jest.fn();
  const { getByText } = render(
    <MultipleChoiceEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={true}
      onAnswer={onAnswer}
    />
  );
  fireEvent.press(getByText('תשובה נכונה'));
  expect(onAnswer).toHaveBeenCalledWith({
    isCorrect: true,
    feedbackText: 'משוב נכון',
  });
});

it('calls onAnswer with incorrect result when wrong option tapped', () => {
  const onAnswer = jest.fn();
  const { getByText } = render(
    <MultipleChoiceEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={true}
      onAnswer={onAnswer}
    />
  );
  fireEvent.press(getByText('תשובה שגויה'));
  expect(onAnswer).toHaveBeenCalledWith({
    isCorrect: false,
    feedbackText: 'משוב שגוי',
  });
});

it('does not call onAnswer when isEnabled is false', () => {
  const onAnswer = jest.fn();
  const { getByText } = render(
    <MultipleChoiceEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={false}
      onAnswer={onAnswer}
    />
  );
  fireEvent.press(getByText('תשובה נכונה'));
  expect(onAnswer).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="MultipleChoiceEngine" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement MultipleChoiceEngine**

```typescript
// src/features/simulations/engines/MultipleChoiceEngine.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BaseSimulationProps } from './BaseSimulationProps';
import { MultipleChoiceScenario, MultipleChoiceOption } from '../../../types/scenario';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../../../theme';

export default function MultipleChoiceEngine({
  scenario,
  attemptNumber,
  isEnabled,
  onAnswer,
}: BaseSimulationProps) {
  const mc = scenario as MultipleChoiceScenario;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);

  // Reset when attemptNumber changes (Try Again pressed)
  useEffect(() => {
    setSelectedId(null);
    setRevealCorrect(false);
  }, [attemptNumber]);

  // On attempt 2 after an incorrect answer, reveal correct on next wrong selection
  const handlePress = (option: MultipleChoiceOption) => {
    if (!isEnabled || selectedId !== null) return;
    setSelectedId(option.id);
    if (attemptNumber === 2 && !option.isCorrect) {
      setRevealCorrect(true);
    }
    onAnswer({ isCorrect: option.isCorrect, feedbackText: option.feedback });
  };

  const getOptionStyle = (option: MultipleChoiceOption) => {
    if (!selectedId) return styles.optionDefault;
    if (option.id === selectedId && option.isCorrect) return styles.optionCorrect;
    if (option.id === selectedId && !option.isCorrect) return styles.optionIncorrect;
    if (revealCorrect && option.isCorrect) return styles.optionReveal;
    return styles.optionDefault;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.task}>{mc.task}</Text>
      <View style={styles.optionsContainer}>
        {mc.options.map(option => (
          <Pressable
            key={option.id}
            style={[styles.optionBase, getOptionStyle(option), !isEnabled && styles.disabled]}
            onPress={() => handlePress(option)}
            accessibilityRole="button"
            accessibilityLabel={option.text}
            accessibilityState={{ disabled: !isEnabled }}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  task: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  optionsContainer: { gap: Spacing.md },
  optionBase: {
    minHeight: TouchTarget.min,
    borderRadius: Radius.button,
    padding: Spacing.md,
    borderWidth: 2,
    justifyContent: 'center',
  },
  optionDefault: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
  },
  optionCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.success,
  },
  optionIncorrect: {
    backgroundColor: '#FFF3E0',
    borderColor: Colors.accent,
  },
  optionReveal: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.success,
    borderStyle: 'dashed',
  },
  disabled: { opacity: 0.6 },
  optionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="MultipleChoiceEngine" --no-coverage
```

Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/engines/MultipleChoiceEngine.tsx __tests__/MultipleChoiceEngine.test.tsx
git commit -m "feat: add MultipleChoiceEngine with attempt-aware reset and correct reveal (TDD)"
```

---

## Task 11: HotspotEngine (TDD)

**Files:**
- Create: `__tests__/HotspotEngine.test.tsx`
- Create: `src/features/simulations/engines/HotspotEngine.tsx`

> The coordinate-matching logic is extracted to a pure function `findHotspotHit` to make it unit-testable without needing layout events.

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/HotspotEngine.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import HotspotEngine, { findHotspotHit } from '../src/features/simulations/engines/HotspotEngine';
import { HotspotScenario, Hotspot } from '../src/types/scenario';

const hotspots: Hotspot[] = [
  {
    id: 'hs-url',
    label: 'קישור',
    region: { x: 0.0, y: 0.6, width: 1.0, height: 0.3 },
    isCorrect: true,
    feedback: 'משוב נכון',
  },
];

const mockScenario: HotspotScenario = {
  id: 'test-hs',
  type: 'hotspot',
  title: 'Test',
  description: 'הודעת SMS מזויפת',
  task: 'לחץ על הקישור החשוד',
  points: 100,
  icon: 'test',
  summaryTip: 'טיפ',
  imageAsset: '',
  imageAltText: 'תיאור תמונה',
  hotspots,
  missedFeedback: 'פספסת',
};

// Unit test the pure coordinate function
describe('findHotspotHit', () => {
  it('returns hotspot when tap is inside region', () => {
    const hit = findHotspotHit(hotspots, 0.5, 0.75);
    expect(hit?.id).toBe('hs-url');
  });

  it('returns null when tap is outside all regions', () => {
    const hit = findHotspotHit(hotspots, 0.5, 0.1);
    expect(hit).toBeNull();
  });

  it('returns null when tap is on region boundary edge', () => {
    // x=0.0, y=0.6 — on the exact boundary
    const hit = findHotspotHit(hotspots, 0.0, 0.6);
    expect(hit).not.toBeNull(); // boundary is inclusive
  });
});

// Component smoke test
it('renders the task instruction', () => {
  const { getByText } = render(
    <HotspotEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={true}
      onAnswer={jest.fn()}
    />
  );
  expect(getByText('לחץ על הקישור החשוד')).toBeTruthy();
});

it('renders message content', () => {
  const { getByText } = render(
    <HotspotEngine
      scenario={mockScenario}
      attemptNumber={1}
      isEnabled={true}
      onAnswer={jest.fn()}
    />
  );
  expect(getByText('הודעת SMS מזויפת')).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="HotspotEngine" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement HotspotEngine**

```typescript
// src/features/simulations/engines/HotspotEngine.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, Animated, StyleSheet, Platform
} from 'react-native';
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

const prefersReducedMotion =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
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

  // Reset on new attempt
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
      Animated.timing(rippleScale, {
        toValue: 1.5,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setRipple(null));
  };

  const handlePress = (event: any) => {
    if (!isEnabled) return;
    const { locationX, locationY } = event.nativeEvent;
    const tapX = locationX / layout.width;
    const tapY = locationY / layout.height;

    triggerRipple(locationX, locationY);

    const hit = findHotspotHit(hs.hotspots, tapX, tapY);

    if (!hit) {
      onAnswer({ isCorrect: false, feedbackText: hs.missedFeedback });
      return;
    }

    if (attemptNumber === 2 && !hit.isCorrect) {
      setRevealCorrect(true);
    }

    onAnswer({ isCorrect: hit.isCorrect, feedbackText: hit.feedback });
  };

  const correctHotspot = hs.hotspots.find(h => h.isCorrect);

  return (
    <View style={styles.container}>
      <Text style={styles.task}>{hs.task}</Text>

      <View
        ref={containerRef}
        style={styles.messageContainer}
        onLayout={e => setLayout(e.nativeEvent.layout)}
        accessible={true}
        accessibilityLabel={hs.imageAltText}
      >
        {/* Message content */}
        <View style={styles.messageBubble}>
          <Text style={styles.sender}>דואר ישראל / הודעה</Text>
          <Text style={styles.messageText}>{hs.description}</Text>
        </View>

        {/* Tap overlay */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="לחץ על החלק החשוד בהודעה"
        />

        {/* Correct hotspot reveal on attempt 2 */}
        {revealCorrect && correctHotspot && (
          <View
            style={[
              styles.hotspotReveal,
              {
                left: `${correctHotspot.region.x * 100}%`,
                top: `${correctHotspot.region.y * 100}%`,
                width: `${correctHotspot.region.width * 100}%`,
                height: `${correctHotspot.region.height * 100}%`,
              } as any,
            ]}
            pointerEvents="none"
          />
        )}

        {/* Ripple indicator */}
        {ripple && (
          <Animated.View
            style={[
              styles.ripple,
              {
                left: ripple.x - 25,
                top: ripple.y - 25,
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              },
            ]}
            pointerEvents="none"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  task: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  messageContainer: {
    position: 'relative',
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  messageBubble: {
    padding: Spacing.md,
    minHeight: 200,
  },
  sender: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.captionSize,
    color: Colors.locked,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 28,
  },
  hotspotReveal: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    borderWidth: 2,
    borderColor: Colors.success,
    borderRadius: Radius.sm,
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(245, 124, 0, 0.4)',
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="HotspotEngine" --no-coverage
```

Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/engines/HotspotEngine.tsx __tests__/HotspotEngine.test.tsx
git commit -m "feat: add HotspotEngine with coordinate detection and ripple animation (TDD)"
```

---

## Task 12: FeedbackOverlay (TDD)

**Files:**
- Create: `__tests__/FeedbackOverlay.test.tsx`
- Create: `src/components/FeedbackOverlay.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/FeedbackOverlay.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FeedbackOverlay from '../src/components/FeedbackOverlay';

const baseProps = {
  visible: true,
  isCorrect: true,
  feedbackText: 'כל הכבוד!',
  summaryTip: 'טיפ זהב',
  attemptNumber: 1 as const,
  onContinue: jest.fn(),
  onTryAgain: jest.fn(),
};

it('renders feedback text when visible', () => {
  const { getByText } = render(<FeedbackOverlay {...baseProps} />);
  expect(getByText('כל הכבוד!')).toBeTruthy();
});

it('shows "המשך" button on correct answer', () => {
  const { getByText } = render(<FeedbackOverlay {...baseProps} isCorrect={true} />);
  expect(getByText('המשך')).toBeTruthy();
});

it('shows "נסה שוב" button on attempt 1 incorrect', () => {
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={1} />
  );
  expect(getByText('נסה שוב')).toBeTruthy();
});

it('shows "המשך" on attempt 2 incorrect', () => {
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={2} />
  );
  expect(getByText('המשך')).toBeTruthy();
});

it('shows summaryTip on success', () => {
  const { getByText } = render(<FeedbackOverlay {...baseProps} isCorrect={true} />);
  expect(getByText('טיפ זהב')).toBeTruthy();
});

it('shows summaryTip on attempt 2 incorrect', () => {
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={2} />
  );
  expect(getByText('טיפ זהב')).toBeTruthy();
});

it('does NOT show summaryTip on attempt 1 incorrect', () => {
  const { queryByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={1} />
  );
  expect(queryByText('טיפ זהב')).toBeNull();
});

it('calls onTryAgain when "נסה שוב" pressed', () => {
  const onTryAgain = jest.fn();
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={1} onTryAgain={onTryAgain} />
  );
  fireEvent.press(getByText('נסה שוב'));
  expect(onTryAgain).toHaveBeenCalled();
});

it('calls onContinue when "המשך" pressed', () => {
  const onContinue = jest.fn();
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={true} onContinue={onContinue} />
  );
  fireEvent.press(getByText('המשך'));
  expect(onContinue).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="FeedbackOverlay" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement FeedbackOverlay**

```typescript
// src/components/FeedbackOverlay.tsx
import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

interface FeedbackOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  feedbackText: string;
  summaryTip: string;
  attemptNumber: 1 | 2;
  onContinue: () => void;
  onTryAgain: () => void;
}

export default function FeedbackOverlay({
  visible,
  isCorrect,
  feedbackText,
  summaryTip,
  attemptNumber,
  onContinue,
  onTryAgain,
}: FeedbackOverlayProps) {
  const showTryAgain = !isCorrect && attemptNumber === 1;
  const showSummaryTip = isCorrect || attemptNumber === 2;
  const headerColor = isCorrect ? Colors.success : Colors.accent;
  const headerText = isCorrect ? '✓ כל הכבוד!' : 'נסו שוב';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: headerColor }]}>
            <Text style={styles.headerText}>{headerText}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.feedbackText}>{feedbackText}</Text>

            {showSummaryTip && (
              <View style={styles.tipContainer}>
                <Text style={styles.tipLabel}>💡 טיפ זהב</Text>
                <Text style={styles.tipText}>{summaryTip}</Text>
              </View>
            )}

            {/* Action button */}
            {showTryAgain ? (
              <Pressable style={styles.buttonSecondary} onPress={onTryAgain}>
                <Text style={styles.buttonSecondaryText}>נסה שוב</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.buttonPrimary} onPress={onContinue}>
                <Text style={styles.buttonPrimaryText}>המשך</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  headerText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.titleSize,
    color: Colors.surface,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  feedbackText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 28,
  },
  tipContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: Radius.card,
    padding: Spacing.md,
    borderRightWidth: 4,
    borderRightColor: '#FFC107',
  },
  tipLabel: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  tipText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 26,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonPrimaryText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.surface,
  },
  buttonSecondary: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonSecondaryText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.surface,
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="FeedbackOverlay" --no-coverage
```

Expected: PASS — all 9 tests green

- [ ] **Step 5: Commit**

```bash
git add src/components/FeedbackOverlay.tsx __tests__/FeedbackOverlay.test.tsx
git commit -m "feat: add FeedbackOverlay with two-attempt logic and golden tip (TDD)"
```

---

## Task 13: ProgressBar Component

**Files:**
- Create: `src/components/ProgressBar.tsx`

- [ ] **Step 1: Create ProgressBar**

```typescript
// src/components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

interface ProgressBarProps {
  current: number;   // 0–total
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${progress * 100}%` as any }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProgressBar.tsx
git commit -m "feat: add ProgressBar component"
```

---

## Task 14: SimulationScreen — Orchestrator (TDD)

**Files:**
- Create: `__tests__/SimulationScreen.test.tsx`
- Create: `src/features/simulations/SimulationScreen.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/SimulationScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SimulationScreen from '../src/features/simulations/SimulationScreen';
import { useGameStore } from '../src/store/gameStore';

// Mock levels.json
jest.mock('../src/data/levels/levels.json', () => ({
  levels: [
    {
      levelId: 1,
      isCompleted: false,
      scenario: {
        id: 'sc-1',
        type: 'multipleChoice',
        title: 'Test Level',
        description: 'תיאור',
        task: 'מה לעשות?',
        points: 100,
        icon: 'test',
        summaryTip: 'טיפ',
        options: [
          { id: 'o1', text: 'נכון', isCorrect: true, feedback: 'מצוין' },
          { id: 'o2', text: 'שגוי', isCorrect: false, feedback: 'לא נכון' },
        ],
      },
    },
  ],
}));

const Stack = createStackNavigator();
const TestWrapper = ({ levelId = 1 }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="Simulation"
        component={SimulationScreen}
        initialParams={{ levelId }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [] });
});

it('renders the scenario task question', async () => {
  const { findByText } = render(<TestWrapper />);
  expect(await findByText('מה לעשות?')).toBeTruthy();
});

it('shows FeedbackOverlay after an answer is selected', async () => {
  const { findByText } = render(<TestWrapper />);
  const correctOption = await findByText('נכון');
  fireEvent.press(correctOption);
  expect(await findByText('מצוין')).toBeTruthy();
});

it('shows "נסה שוב" on first wrong answer', async () => {
  const { findByText } = render(<TestWrapper />);
  const wrongOption = await findByText('שגוי');
  fireEvent.press(wrongOption);
  expect(await findByText('נסה שוב')).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="SimulationScreen" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement SimulationScreen**

```typescript
// src/features/simulations/SimulationScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ENGINE_REGISTRY } from './SimulationRegistry';
import { AnswerResult } from './engines/BaseSimulationProps';
import FeedbackOverlay from '../../components/FeedbackOverlay';
import ProgressBar from '../../components/ProgressBar';
import { useGameState } from '../../hooks/useGameState';
import levelsData from '../../data/levels/levels.json';
import { Colors, Typography, Spacing, TouchTarget } from '../../theme';

const TOTAL_LEVELS = 5;
const FIRST_TRY_BONUS = 50;

type SimulationRouteProp = RouteProp<RootStackParamList, 'Simulation'>;
type SimulationNavProp = StackNavigationProp<RootStackParamList>;

export default function SimulationScreen() {
  const navigation = useNavigation<SimulationNavProp>();
  const route = useRoute<SimulationRouteProp>();
  const { levelId } = route.params;
  const { completeLevel, allLevelsComplete, cyberPoints } = useGameState();

  const levelData = (levelsData.levels as any[]).find(l => l.levelId === levelId);
  const scenario = levelData?.scenario;

  const [currentAttempt, setCurrentAttempt] = useState<1 | 2>(1);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);

  if (!scenario) return null;

  const EngineComponent = ENGINE_REGISTRY[scenario.type as keyof typeof ENGINE_REGISTRY];

  const handleAnswer = (result: AnswerResult) => {
    setLastResult(result);
    setIsOverlayVisible(true);
  };

  const handleTryAgain = () => {
    setIsOverlayVisible(false);
    setCurrentAttempt(2);
  };

  const handleContinue = () => {
    const wasFirstTry = currentAttempt === 1;
    const pointsEarned = lastResult?.isCorrect
      ? scenario.points + (wasFirstTry ? FIRST_TRY_BONUS : 0)
      : 0;

    completeLevel(levelId, pointsEarned);
    setIsOverlayVisible(false);

    if (allLevelsComplete(TOTAL_LEVELS)) {
      navigation.replace('Certificate', { totalPoints: cyberPoints + pointsEarned });
    } else {
      navigation.navigate('Home');
    }
  };

  const handleBack = () => {
    if (lastResult !== null) {
      Alert.alert(
        'לצאת מהתרגיל?',
        'ההתקדמות בתרגיל זה לא תישמר.',
        [
          { text: 'המשך תרגיל', style: 'cancel' },
          { text: 'צא', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backText}>→</Text>
        </Pressable>
        <Text style={styles.cyberPoints}>{cyberPoints} נק׳</Text>
      </View>

      <ProgressBar current={levelId - 1} total={TOTAL_LEVELS} />

      <Text style={styles.title}>{scenario.title}</Text>
      <Text style={styles.description}>{scenario.description}</Text>

      {/* Engine */}
      <View style={styles.engineContainer}>
        <EngineComponent
          scenario={scenario}
          attemptNumber={currentAttempt}
          isEnabled={!isOverlayVisible}
          onAnswer={handleAnswer}
        />
      </View>

      {/* Feedback Overlay */}
      {lastResult && (
        <FeedbackOverlay
          visible={isOverlayVisible}
          isCorrect={lastResult.isCorrect}
          feedbackText={lastResult.feedbackText}
          summaryTip={scenario.summaryTip}
          attemptNumber={currentAttempt}
          onContinue={handleContinue}
          onTryAgain={handleTryAgain}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
  },
  backButton: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: Colors.primary,
  },
  cyberPoints: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.primary,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.titleSize,
    color: Colors.text,
    textAlign: 'right',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    lineHeight: 28,
  },
  engineContainer: { flex: 1 },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="SimulationScreen" --no-coverage
```

Expected: PASS — all 3 tests green

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/SimulationScreen.tsx __tests__/SimulationScreen.test.tsx
git commit -m "feat: add SimulationScreen orchestrator with two-attempt logic (TDD)"
```

---

## Task 15: LevelCard + HomeScreen

**Files:**
- Create: `src/components/LevelCard.tsx`
- Create: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Create LevelCard**

```typescript
// src/components/LevelCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Level } from '../types/scenario';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

interface LevelCardProps {
  level: Level;
  isCompleted: boolean;
  isUnlocked: boolean;
  onPress: () => void;
}

export default function LevelCard({ level, isCompleted, isUnlocked, onPress }: LevelCardProps) {
  const buttonLabel = isCompleted ? 'שחק שוב' : isUnlocked ? 'התחל' : '🔒 נעול';

  return (
    <Pressable
      style={[styles.card, isCompleted && styles.cardCompleted, !isUnlocked && styles.cardLocked]}
      onPress={isUnlocked ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${level.scenario.title}${isCompleted ? ', נלמד' : !isUnlocked ? ', נעול' : ''}`}
      accessibilityState={{ disabled: !isUnlocked }}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.title, !isUnlocked && styles.lockedText]}>
            {level.scenario.title}
          </Text>
          <Text style={[styles.description, !isUnlocked && styles.lockedText]} numberOfLines={2}>
            {level.scenario.description}
          </Text>
        </View>

        <View style={styles.badgeContainer}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ נלמד</Text>
            </View>
          )}
          {!isUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
          <Text style={styles.levelNumber}>{level.levelId}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.button, !isUnlocked && styles.buttonDisabled]}
        onPress={isUnlocked ? onPress : undefined}
        disabled={!isUnlocked}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Text style={[styles.buttonText, !isUnlocked && styles.buttonTextDisabled]}>
          {buttonLabel}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompleted: { borderColor: Colors.success },
  cardLocked: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  info: { flex: 1 },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.captionSize,
    color: Colors.locked,
    textAlign: 'right',
    lineHeight: 20,
  },
  lockedText: { color: Colors.locked },
  badgeContainer: { alignItems: 'center', gap: Spacing.xs },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  completedBadgeText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.captionSize,
    color: Colors.success,
  },
  lockIcon: { fontSize: 20 },
  levelNumber: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 28,
    color: Colors.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: Colors.disabled },
  buttonText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.surface,
  },
  buttonTextDisabled: { color: Colors.surface },
});
```

- [ ] **Step 2: Create HomeScreen**

```typescript
// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LevelCard from '../components/LevelCard';
import { useGameState } from '../hooks/useGameState';
import levelsData from '../data/levels/levels.json';
import { Level } from '../types/scenario';
import { Colors, Typography, Spacing } from '../theme';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { isLevelCompleted, isLevelUnlocked, cyberPoints } = useGameState();

  const levels = levelsData.levels as unknown as Level[];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>מגן דיגיטלי</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{cyberPoints} נק׳</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>למד להגן על עצמך מהונאות ברשת</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {levels.map(level => (
          <LevelCard
            key={level.levelId}
            level={level}
            isCompleted={isLevelCompleted(level.levelId)}
            isUnlocked={isLevelUnlocked(level.levelId)}
            onPress={() => navigation.navigate('Simulation', { levelId: level.levelId })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  appTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.titleSize,
    color: Colors.text,
  },
  pointsBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pointsText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.surface,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.locked,
    textAlign: 'right',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  scrollContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelCard.tsx src/screens/HomeScreen.tsx
git commit -m "feat: add LevelCard component and HomeScreen with sequential unlock"
```

---

## Task 16: CertificateScreen

**Files:**
- Create: `src/screens/CertificateScreen.tsx`

- [ ] **Step 1: Create CertificateScreen**

```typescript
// src/screens/CertificateScreen.tsx
import React from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, Share, Platform, Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

type CertificateRouteProp = RouteProp<RootStackParamList, 'Certificate'>;
type CertificateNavProp = StackNavigationProp<RootStackParamList>;

const isMobileWeb = Platform.OS === 'web' && Dimensions.get('window').width < 768;

export default function CertificateScreen() {
  const navigation = useNavigation<CertificateNavProp>();
  const route = useRoute<CertificateRouteProp>();
  const { totalPoints } = route.params;

  const shareText = `🛡️ סיימתי את אימון הגנת הסייבר!\nצברתי ${totalPoints} נקודות.\nאני יודע עכשיו לזהות הונאות ברשת. 💪`;

  const handleShare = async () => {
    if (Platform.OS !== 'web' || isMobileWeb) {
      await Share.share({ message: shareText });
    } else {
      await Clipboard.setStringAsync(shareText);
      alert('הטקסט הועתק! תוכל לשתף אותו בוואטסאפ.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>כל הכבוד!</Text>
        <Text style={styles.subtitle}>סיימת את כל התרגילים בהצלחה</Text>

        <View style={styles.certificate}>
          <Text style={styles.certLabel}>תעודת מגן דיגיטלי</Text>
          <Text style={styles.points}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>נקודות סייבר</Text>
          <Text style={styles.certMessage}>
            אתה יודע עכשיו לזהות ולהתמודד עם הונאות נפוצות ברשת. שתף את הידע שלך עם המשפחה!
          </Text>
        </View>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>
            {Platform.OS === 'web' && !isMobileWeb ? 'העתק טקסט לשיתוף' : 'שתף בוואטסאפ'}
          </Text>
        </Pressable>

        <Pressable style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeButtonText}>חזור לתפריט הראשי</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emoji: { fontSize: 72 },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 32,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.subtitleSize,
    color: Colors.locked,
    textAlign: 'center',
  },
  certificate: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  certLabel: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.locked,
  },
  points: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 56,
    color: Colors.primary,
  },
  pointsLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
  },
  certMessage: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginTop: Spacing.sm,
  },
  shareButton: {
    backgroundColor: '#25D366',
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shareButtonText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.surface,
  },
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
  homeButtonText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.bodySize,
    color: Colors.primary,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/CertificateScreen.tsx
git commit -m "feat: add CertificateScreen with WhatsApp share / clipboard fallback"
```

---

## Task 17: Full Test Suite + Smoke Test

**Files:**
- Run all tests and verify app on web

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --no-coverage
```

Expected: All tests PASS. Summary shows 0 failed.

- [ ] **Step 2: Run app and verify basic navigation**

```bash
npx expo start --web
```

Manually verify:
- [ ] Home screen shows 5 level cards in Hebrew
- [ ] Level 1 is unlocked, levels 2–5 are locked
- [ ] Tapping "התחל" on Level 1 navigates to SimulationScreen
- [ ] Scenario title and description appear in Hebrew RTL
- [ ] Tapping a Multiple Choice answer shows FeedbackOverlay
- [ ] "נסה שוב" resets the engine for a second attempt
- [ ] "המשך" after success returns to HomeScreen
- [ ] Level 1 card shows "✓ נלמד" badge after completion
- [ ] Level 2 is now unlocked
- [ ] Tapping inside the message text area on Level 1 (Hotspot) shows a ripple and FeedbackOverlay
- [ ] Tapping outside any hotspot region shows the "missedFeedback" text in the overlay

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: Cyber_Ed Phase 1 complete — 5 Hebrew scenarios, RTL, Zustand persistence"
```

---

## Out of Scope (Phase 2)

- Firebase / cloud sync
- Drag & Drop engine
- Leaderboard
- Push notifications
- Real PNG mockup images for HotspotEngine (replace `imageAsset: ""` and update hotspot coordinates)
- App Store / Google Play submission
