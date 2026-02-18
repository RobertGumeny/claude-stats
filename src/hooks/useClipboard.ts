import { useState, useCallback } from 'react';

/**
 * Copy text to clipboard using modern Clipboard API with execCommand fallback.
 * Returns `copied` state that resets after `resetMs` milliseconds.
 */
export function useClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), resetMs);
          return true;
        } catch {
          // Fall through to legacy fallback
        }
      }

      // Legacy execCommand fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), resetMs);
          return true;
        }
      } catch {
        // Both methods failed
      }

      return false;
    },
    [resetMs]
  );

  return { copy, copied };
}
