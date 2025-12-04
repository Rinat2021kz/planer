# Environment Configuration

This project uses environment variables to configure the API base URL for different build targets.

## Build Types

### Web Build (Default)
For web builds, the API is hosted on the same domain as the frontend, so no base URL is needed.

```bash
npm run build
npm run deploy
```

The `VITE_API_BASE_URL` will be empty, resulting in relative API calls.

### Mobile Build (Capacitor)
For mobile builds (iOS/Android), the app needs to point to the remote Cloudflare Workers API.

```bash
npm run android  # Build and open Android Studio
npm run ios      # Build and open Xcode
```

These commands automatically set `VITE_API_BASE_URL=https://planer.gassimov2014.workers.dev` during the build.

## Manual Configuration

If you need to set a custom API URL, create a `.env.local` file:

```env
VITE_API_BASE_URL=https://your-custom-domain.workers.dev
```

Then build normally:

```bash
npm run build
```

## How It Works

1. All API client files (`src/api/*.ts`) use `import.meta.env.VITE_API_BASE_URL`
2. For web builds, this is empty → API calls are relative (e.g., `/api/protected/tasks`)
3. For mobile builds, this is set via PowerShell → API calls are absolute (e.g., `https://planer.gassimov2014.workers.dev/api/protected/tasks`)
4. The `build:mobile` script in `package.json` sets the environment variable before building

## Commands Summary

- `npm run build` - Web build (no API base URL)
- `npm run build:mobile` - Mobile build (with API base URL)
- `npm run android` - Build for mobile → sync → open Android Studio
- `npm run ios` - Build for mobile → sync → open Xcode
- `npm run deploy` - Deploy web build to Cloudflare

