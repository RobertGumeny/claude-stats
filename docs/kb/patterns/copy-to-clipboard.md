---
title: Copy to Clipboard
updated: 2026-02-18
category: Patterns
tags: [react, hooks, clipboard, ux, browser-api]
related_articles:
  - docs/kb/features/session-detail-view.md
  - docs/kb/features/session-list-view.md
---

# Copy to Clipboard

## Overview

Reusable `useClipboard` hook and `CopyButton` component that provide copy-to-clipboard functionality with visual feedback. Uses the modern Clipboard API with an `execCommand` fallback for older browsers.

## Implementation

**Files:**
- `src/hooks/useClipboard.ts` — Hook wrapping Clipboard API with fallback
- `src/components/CopyButton.tsx` — Presentational button with icon feedback

**`useClipboard` hook:**
- Calls `navigator.clipboard.writeText()` (modern API)
- Falls back to `document.execCommand('copy')` if Clipboard API unavailable or throws
- Returns both APIs failure returns `false`
- `copied` state flips to `true` on success, auto-resets after 2 seconds via `setTimeout`

**`CopyButton` component:**
- Renders a clipboard SVG icon at rest; switches to a green checkmark for 2 seconds after copy
- Calls `e.stopPropagation()` to prevent triggering parent click handlers (row expansion, card navigation)
- Only renders in contexts where content is defined (caller guards against undefined)

**Integration points:**
- `SessionDetail.tsx` — Session ID in page header
- `SessionCard.tsx` — Truncated Session ID in session list cards
- `MessageTable.tsx` — Message ID column; full message content in expanded rows

## Key Decisions

1. **Hook + component split**: `useClipboard` handles browser API complexity; `CopyButton` handles visual presentation. Each is independently testable.

2. **`execCommand` fallback**: Clipboard API requires HTTPS or localhost. The fallback (create a textarea, select it, run `execCommand('copy')`) covers legacy browsers and non-secure contexts.

3. **`stopPropagation` required**: Without it, clicking the copy button inside a table row also triggers row expand. All `CopyButton` instances must stop propagation.

4. **Content guard**: The message content copy button only renders when `message.content` is defined — avoids copying placeholder text like "No content available".

5. **No icon library**: SVG icons are inline, consistent with the codebase-wide preference for avoiding extra icon dependencies.

## Usage Example

```tsx
import { useClipboard } from '../hooks/useClipboard';

function CopyButton({ text }: { text: string }) {
  const { copy, copied } = useClipboard();

  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy(text); }}
      className="text-zinc-400 hover:text-zinc-200"
    >
      {copied ? <CheckIcon className="text-green-400" /> : <ClipboardIcon />}
    </button>
  );
}
```

## Edge Cases & Gotchas

- **Test mocking**: Tests use `vi.stubGlobal` to mock `navigator.clipboard` and `document.execCommand` since these browser globals don't exist in the Node test environment.
- **HTTPS restriction**: `navigator.clipboard` requires a secure context. The fallback handles localhost (which is treated as secure) and truly old browsers.
- **2-second reset**: The `copied` timer uses `setTimeout`. In tests, use `vi.useFakeTimers()` to control the reset without waiting.

## Related Topics

- See [Session Detail View](../features/session-detail-view.md) for primary usage context
- See [Session List View](../features/session-list-view.md) for Session ID copy in cards
