import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'vite.config.ts', 'vite.config.test.ts', 'out', 'src/renderer/SimpleTest.tsx', 'src/renderer/TestStyles.tsx', 'src/renderer/components/KookStyleDemo.tsx', 'src/renderer/components/layout/ResponsiveGridDemo.tsx', 'src/renderer/components/layout/ChannelControlPanel.tsx', 'src/renderer/components/layout/ChannelList.tsx', 'src/renderer/components/layout/ChannelView.tsx', 'src/renderer/components/layout/Header.tsx', 'src/renderer/components/layout/ScreenView.tsx', 'src/renderer/components/layout/SettingsView.tsx', 'src/renderer/components/layout/Sidebar.tsx', 'src/renderer/components/layout/SubcategoryList.tsx', 'src/renderer/components/layout/VoiceView.tsx', 'src/renderer/components/ui/VoiceControl.tsx', 'src/renderer/components/ui/ChannelList.tsx', 'src/renderer/components/ui/ParticipantList.tsx', 'src/renderer/components/ui/__tests__'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
      }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['out/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-console': 'off',
    },
  },
)
