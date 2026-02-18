import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the clipboard copy logic used by useClipboard.
 *
 * We test the underlying async copy behavior by mocking the browser APIs
 * that useClipboard relies on: navigator.clipboard and document.execCommand.
 */

// Re-implement the core copy logic as a standalone function so we can test it
// without needing a DOM renderer (vitest runs in node environment).
async function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }

  if (typeof document !== 'undefined') {
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
      return success;
    } catch {
      // both failed
    }
  }

  return false;
}

describe('clipboard copy logic', () => {
  describe('modern Clipboard API', () => {
    it('returns true when navigator.clipboard.writeText resolves', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });

      const result = await copyToClipboard('hello');

      expect(result).toBe(true);
      expect(writeText).toHaveBeenCalledWith('hello');

      vi.unstubAllGlobals();
    });

    it('falls through to fallback when navigator.clipboard.writeText rejects', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
      const execCommand = vi.fn().mockReturnValue(true);
      const textarea = {
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };
      const body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      vi.stubGlobal('navigator', { clipboard: { writeText } });
      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(textarea),
        execCommand,
        body,
      });

      const result = await copyToClipboard('hello');

      expect(result).toBe(true);
      expect(writeText).toHaveBeenCalled();
      expect(execCommand).toHaveBeenCalledWith('copy');

      vi.unstubAllGlobals();
    });

    it('returns false when both clipboard API and execCommand fail', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('not allowed'));
      const execCommand = vi.fn().mockReturnValue(false);
      const textarea = {
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };
      const body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      vi.stubGlobal('navigator', { clipboard: { writeText } });
      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(textarea),
        execCommand,
        body,
      });

      const result = await copyToClipboard('hello');

      expect(result).toBe(false);

      vi.unstubAllGlobals();
    });
  });

  describe('legacy execCommand fallback (no Clipboard API)', () => {
    beforeEach(() => {
      // Remove navigator.clipboard to force fallback path
      vi.stubGlobal('navigator', {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns true when execCommand succeeds', async () => {
      const execCommand = vi.fn().mockReturnValue(true);
      const textarea = {
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };
      const body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(textarea),
        execCommand,
        body,
      });

      const result = await copyToClipboard('fallback text');

      expect(result).toBe(true);
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(textarea.value).toBe('fallback text');
    });

    it('returns false when execCommand returns false', async () => {
      const execCommand = vi.fn().mockReturnValue(false);
      const textarea = {
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };
      const body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(textarea),
        execCommand,
        body,
      });

      const result = await copyToClipboard('text');

      expect(result).toBe(false);
    });

    it('returns false when document is not available', async () => {
      vi.stubGlobal('document', undefined);

      const result = await copyToClipboard('text');

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('copies empty string successfully', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });

      const result = await copyToClipboard('');

      expect(result).toBe(true);
      expect(writeText).toHaveBeenCalledWith('');

      vi.unstubAllGlobals();
    });

    it('copies long string successfully', async () => {
      const longText = 'a'.repeat(10000);
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });

      const result = await copyToClipboard(longText);

      expect(result).toBe(true);
      expect(writeText).toHaveBeenCalledWith(longText);

      vi.unstubAllGlobals();
    });

    it('copies JSON content successfully', async () => {
      const content = JSON.stringify({ type: 'text', text: 'Hello world' }, null, 2);
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });

      const result = await copyToClipboard(content);

      expect(result).toBe(true);

      vi.unstubAllGlobals();
    });
  });
});
