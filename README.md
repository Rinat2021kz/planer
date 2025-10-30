# Planer - React + TypeScript + Vite + Capacitor

A cross-platform application built with React, TypeScript, Vite, and Capacitor for web, iOS, and Android.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Capacitor Mobile Development

This project includes Capacitor for building iOS and Android apps.

### Prerequisites

**For Android:**
- Android Studio with Android SDK installed
- See `ANDROID_SETUP.md` for detailed installation instructions

**For iOS (macOS only):**
- Xcode 14+
- CocoaPods (`sudo gem install cocoapods`)
- Xcode Command Line Tools

### Available Scripts

**Quick commands (build + sync + open):**
- `npm run android` - Build, sync, and open Android project
- `npm run ios` - Build, sync, and open iOS project

**Individual commands:**
- `npm run cap:sync` - Sync web assets to native projects
- `npm run cap:copy` - Copy web bundle to native projects
- `npm run cap:add:ios` - Add iOS platform
- `npm run cap:add:android` - Add Android platform
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:open:android` - Open Android project in Android Studio

### Development Workflow

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Add native platforms:**
   ```bash
   # For iOS
   npm run cap:add:ios
   
   # For Android
   npm run cap:add:android
   ```

3. **Sync changes to native projects:**
   ```bash
   npm run cap:sync
   ```

4. **Open in native IDE:**
   ```bash
   # Open iOS in Xcode
   npm run cap:open:ios
   
   # Open Android in Android Studio
   npm run cap:open:android
   ```

### Live Reload Development

To enable live reload during development:

1. Run the dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts` to point to your dev server:
   ```typescript
   server: {
     url: 'http://localhost:5173',
     cleartext: true
   }
   ```

3. Sync and run:
   ```bash
   npm run cap:sync
   ```

### Production Build

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Remove the server configuration from `capacitor.config.ts` (or comment it out)

3. Sync to native projects:
   ```bash
   npm run cap:sync
   ```

4. Build and run in native IDEs as usual
