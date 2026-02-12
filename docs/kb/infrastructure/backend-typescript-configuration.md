---
title: Backend TypeScript Configuration
updated: 2026-02-12
category: Infrastructure
tags: [typescript, tsconfig, backend, nodejs, build]
related_articles:
  - docs/kb/architecture/typescript-type-system.md
  - docs/kb/infrastructure/vite-react-typescript-setup.md
  - docs/kb/dependencies/express.md
---

# Backend TypeScript Configuration

## Overview

Separate TypeScript configuration for the Express backend with strict type checking and ESNext module support. Isolates backend compiler settings from frontend Vite configuration to avoid conflicts.

## Implementation

**Configuration File** (tsconfig.server.json):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "outDir": "./dist/server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Package Scripts**:
```json
{
  "server": "tsx server/index.ts",
  "build:server": "tsc -p tsconfig.server.json",
  "server:build": "node dist/server/index.js"
}
```

**Dependencies Added**:
- `@types/express` - Type definitions for Express
- `@types/cors` - Type definitions for CORS middleware
- `tsx` - TypeScript execution for development

## Key Decisions

1. **Separate Configuration**: Created `tsconfig.server.json` instead of modifying main `tsconfig.json` to:
   - Allow different compiler settings for backend vs frontend
   - Exclude DOM types from backend (not needed for Node.js)
   - Avoid JSX processing overhead for server code

2. **Strict Type Checking**: Enabled all strict options including:
   - `noUncheckedIndexedAccess` - Prevents array access bugs by treating indexed access as potentially undefined
   - `noImplicitReturns` - Ensures all code paths return values
   - Full strict mode for maximum type safety

3. **ESNext Modules with .js Extensions**:
   - Using ESNext module system to match frontend
   - Import statements use `.js` extension (TypeScript convention for ESM)
   - Maintains compatibility with Node.js native ESM

4. **Development vs Production**:
   - Development: Use `tsx` for direct TypeScript execution (faster iteration)
   - Production: Compile to `dist/server/` and run JavaScript (standard deployment)

5. **Target ES2022**: Modern JavaScript target provides access to latest language features while maintaining broad Node.js compatibility (Node 16+).

## Usage Example

```bash
# Development - run TypeScript directly
npm run server

# Production - compile then run
npm run build:server
npm run server:build
```

## Edge Cases & Gotchas

- **Import Extensions**: TypeScript requires `.js` extensions in import statements even when importing `.ts` files. This is ESM convention, not a bug.

- **Type-Only Imports**: Use `import type` for type-only imports to ensure they're removed during compilation.

- **Module Resolution**: `moduleResolution: "bundler"` provides best compatibility with modern tooling but may differ from Node.js native resolution in edge cases.

## Related Topics

- See [TypeScript Type System](../architecture/typescript-type-system.md) for type definitions
- See [Vite React TypeScript Setup](../infrastructure/vite-react-typescript-setup.md) for frontend configuration
- See [Express Configuration](../dependencies/express.md) for server implementation
