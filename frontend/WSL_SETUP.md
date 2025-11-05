# WSL Environment Setup

## Issue
In WSL environment, Next.js dev server was not accessible from Windows host at localhost:3000 due to binding to 127.0.0.1 only.

## Solution Applied

### 1. Updated package.json scripts
Added `-H 0.0.0.0` flag to allow Next.js to listen on all network interfaces:

```json
"dev": "npm run clean && npm run genabi && next dev --turbopack -H 0.0.0.0"
"start": "next start -H 0.0.0.0"
```

### 2. Updated next.config.ts
Added experimental serverActions config to allow cross-origin access:

```typescript
experimental: {
  serverActions: {
    allowedOrigins: ['localhost:3000', '127.0.0.1:3000', '*'],
  },
}
```

## How to Run

```bash
cd frontend
pnpm dev
```

The server will now be accessible at:
- http://localhost:3000 (from Windows)
- http://127.0.0.1:3000 (from Windows)
- http://0.0.0.0:3000 (from WSL)

## Verification

After starting the dev server, you should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
```

You can now access the application from your Windows browser.
