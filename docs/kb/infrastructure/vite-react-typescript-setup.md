---
title: Vite + React 19 + TypeScript Project Setup
updated: 2026-02-12
category: Infrastructure
tags: [vite, react, typescript, build-tools]
related_articles:
  - docs/kb/infrastructure/tailwind-css-4-configuration.md
  - docs/kb/dependencies/react-19.md
---

# Vite + React 19 + TypeScript Project Setup

## Overview

The project uses Vite 7.3.1 as the build tool with React 19.0 and TypeScript 5.9 in strict mode. This modern stack provides fast HMR, optimized production builds, and comprehensive type safety for the Claude Code Session Analyzer application.

## Implementation

**Core Configuration Files:**
- `vite.config.ts` - React plugin with port 5173
- `tsconfig.json` - Strict mode with additional linting rules
- `tsconfig.node.json` - Composite mode for build tooling
- `package.json` - Dependencies and build scripts

**Build Scripts:**
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "server": "node server/index.js",
  "dev:all": "concurrently \"npm run dev\" \"npm run server\""
}
```

**TypeScript Configuration:**
- Strict mode enabled for maximum type safety
- Additional linting: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`
- Composite mode in `tsconfig.node.json` supports project references

## Key Decisions

**Vite 7.3 over Create React App**: Faster dev server with instant HMR and superior build performance. CRA is deprecated and no longer recommended for new React projects.

**TypeScript Strict Mode**: Enabled all strict type checking options to catch errors at compile time rather than runtime. The `noUncheckedIndexedAccess` flag ensures array/object access is properly null-checked.

**Composite TypeScript Config**: Separated `tsconfig.node.json` for build tooling allows proper type checking of Vite configuration files without polluting the main app config.

**Concurrently for Dev Servers**: Uses `concurrently` package to run both Vite frontend (port 5173) and Express backend (port 3001) in parallel during development.

## Usage Example

```bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev:all

# Build for production
npm run build

# Preview production build
npm run preview
```

## Edge Cases & Gotchas

**Windows Path Handling**: Vite config uses forward slashes (`/`) for paths. Windows backslashes work but forward slashes are cross-platform compatible.

**Port Conflicts**: Default port 5173 may conflict with other Vite projects. Change in `vite.config.ts` if needed.

**Build Errors**: TypeScript compilation runs before Vite build (`tsc && vite build`). Any TS errors will prevent the build from completing.

## Related Topics

See [Tailwind CSS 4 Configuration](../infrastructure/tailwind-css-4-configuration.md) for styling setup.
See [React 19](../dependencies/react-19.md) for framework details.
