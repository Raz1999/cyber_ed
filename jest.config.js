/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // Minimal node project for pure TS/Zustand store tests (no RN/Expo setup)
    {
      displayName: 'store',
      testMatch: ['<rootDir>/__tests__/gameStore.test.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': [
          'babel-jest',
          {
            presets: [['babel-preset-expo', { worklets: false, reanimated: false }]],
          },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(zustand)/)',
      ],
    },
    // React Native / Expo project for component tests
    {
      displayName: 'rn',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
      testPathIgnorePatterns: ['/node_modules/', '__tests__/gameStore.test.ts'],
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|zustand)',
      ],
      moduleNameMapper: {
        // Prevent lazy-loaded Expo winter globals from being required outside Jest scope
        'expo/src/winter/ImportMetaRegistry': '<rootDir>/__mocks__/expo-import-meta-registry.js',
        'expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
      },
    },
  ],
};
