---
title: Tailwind CSS 4
updated: 2026-02-12
category: Dependency
tags: [tailwind, css, styling]
related_articles:
  - docs/kb/infrastructure/tailwind-css-4-configuration.md
---

# Tailwind CSS 4

## Overview

Tailwind CSS 4.1.7 provides utility-first CSS styling for the application. Version 4 introduces native CSS import syntax, eliminating the need for the Tailwind PostCSS plugin used in v3.

## Implementation

**Installation:**
```bash
npm install tailwindcss@^4.1.7
```

**Import (src/index.css):**
```css
@import "tailwindcss";
```

**Configuration (postcss.config.js):**
```javascript
export default {
  plugins: {
    autoprefixer: {}, // Only autoprefixer needed
  },
};
```

## Key Decisions

**Native CSS Import**: Tailwind 4's `@import "tailwindcss"` replaces the PostCSS plugin approach. This simplifies the build pipeline and improves performance.

**No Plugin in PostCSS**: Unlike Tailwind v3, the `tailwindcss` plugin is not added to PostCSS config. The native import handles all processing.

**Autoprefixer Only**: PostCSS config only includes `autoprefixer` for cross-browser compatibility. No other PostCSS plugins are needed.

## Usage Example

```css
/* src/index.css */
@import "tailwindcss";

/* Custom utilities can be added after import */
@layer utilities {
  .truncate-2-lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

## Edge Cases & Gotchas

**Migration from v3**: When upgrading from Tailwind v3, remove `tailwindcss` from PostCSS plugins and replace `@tailwind base; @tailwind components; @tailwind utilities;` with `@import "tailwindcss"`.

**Build Performance**: Tailwind 4's native import is significantly faster than v3's PostCSS plugin, especially on large projects.

**JIT Mode**: Tailwind 4 uses JIT (Just-In-Time) compilation by default. All classes are generated on-demand during development.

## Related Topics

See [Tailwind CSS 4 Configuration](../infrastructure/tailwind-css-4-configuration.md) for theme and color customization.
