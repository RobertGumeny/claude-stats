---
title: Tailwind CSS 4 Configuration
updated: 2026-02-12
category: Infrastructure
tags: [tailwind, css, styling, dark-theme]
related_articles:
  - docs/kb/infrastructure/vite-react-typescript-setup.md
  - docs/kb/dependencies/tailwind-css-4.md
---

# Tailwind CSS 4 Configuration

## Overview

Tailwind CSS 4.1.7 is configured using the new native CSS import syntax (`@import "tailwindcss"`), which replaces the PostCSS plugin approach from v3. The project uses a custom dark theme color palette matching PRD specifications.

## Implementation

**CSS Import (src/index.css):**
```css
@import "tailwindcss";
```

**PostCSS Configuration (postcss.config.js):**
```javascript
export default {
  plugins: {
    autoprefixer: {},
  },
};
```

**Tailwind Config (tailwind.config.js):**
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#18181b',   // zinc-900
          secondary: '#27272a', // zinc-800
          tertiary: '#3f3f46',  // zinc-700
        },
        text: {
          primary: '#f1f5f9',   // slate-100
          secondary: '#cbd5e1', // slate-300
          tertiary: '#94a3b8',  // slate-400
        },
        border: {
          primary: '#3f3f46',   // zinc-700
          secondary: '#52525b', // zinc-600
        },
        accent: {
          cost: '#4ade80',      // green-400
          sidechain: '#fbbf24', // amber-500
          warning: '#f87171',   // red-400
          primary: '#3b82f6',   // blue-500
        },
      },
    },
  },
};
```

## Key Decisions

**Tailwind 4 Native Import**: The new `@import "tailwindcss"` syntax eliminates the need for the Tailwind PostCSS plugin. Only `autoprefixer` is required in PostCSS config.

**Custom Color Palette**: Extended Tailwind's default theme with semantic color names (`background-primary`, `text-primary`, `accent-cost`) rather than using raw Tailwind color classes. This improves code readability and makes theme changes easier.

**Dark Theme First**: All colors are dark theme variants. No light theme support in v1.

**Semantic Naming**: Color names reflect purpose (`accent-cost` for money displays, `accent-sidechain` for sidechain badges) rather than visual appearance.

## Usage Example

```tsx
// Using custom colors in components
<div className="bg-background-primary text-text-primary border border-border-primary">
  <span className="text-accent-cost">$0.0824</span>
  <span className="text-accent-sidechain">Sidechain: 32%</span>
</div>
```

## Edge Cases & Gotchas

**Migration from v3**: If upgrading from Tailwind v3, remove `tailwindcss` from PostCSS plugins and replace `@tailwind` directives with `@import "tailwindcss"`.

**Color Conflicts**: Custom color names shadow Tailwind defaults. For example, `text-primary` refers to the custom color, not Tailwind's built-in `text-primary`.

**Content Paths**: Ensure all component file extensions are included in the `content` array. Missing extensions will result in unpurged CSS classes.

## Related Topics

See [Vite + React + TypeScript Setup](../infrastructure/vite-react-typescript-setup.md) for build configuration.
See [Tailwind CSS 4 Dependency](../dependencies/tailwind-css-4.md) for version details.
