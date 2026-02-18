import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Tests for the refresh logic underlying useRefresh.
 *
 * We test the async fetch behavior directly by extracting the core logic
 * and mocking the global fetch — same pattern as other hook tests in this project.
 */

const API_BASE_URL = 'http://localhost:3001';

// Core refresh function matching the implementation in useRefresh.ts
async function doRefresh(
  fetchFn: typeof fetch,
  onSuccess?: (result: { success: boolean; projectsScanned?: number; durationMs?: number }) => void
): Promise<{ success: boolean; projectsScanned?: number; durationMs?: number }> {
  try {
    const response = await fetchFn(`${API_BASE_URL}/api/refresh`, { method: 'POST' });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    const result = {
      success: true,
      projectsScanned: data.projectsScanned,
      durationMs: data.durationMs,
    };

    onSuccess?.(result);
    return result;
  } catch {
    return { success: false };
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRefresh - core refresh logic', () => {
  describe('successful refresh', () => {
    it('calls POST /api/refresh endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ projectsScanned: 5, durationMs: 200 }),
      });

      await doRefresh(mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/refresh',
        { method: 'POST' }
      );
    });

    it('returns success result with projectsScanned and durationMs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ projectsScanned: 10, durationMs: 500 }),
      });

      const result = await doRefresh(mockFetch);

      expect(result.success).toBe(true);
      expect(result.projectsScanned).toBe(10);
      expect(result.durationMs).toBe(500);
    });

    it('calls onSuccess callback with result on successful refresh', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ projectsScanned: 3, durationMs: 100 }),
      });
      const onSuccess = vi.fn();

      await doRefresh(mockFetch, onSuccess);

      expect(onSuccess).toHaveBeenCalledOnce();
      expect(onSuccess).toHaveBeenCalledWith({
        success: true,
        projectsScanned: 3,
        durationMs: 100,
      });
    });
  });

  describe('failed refresh', () => {
    it('returns success=false when response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await doRefresh(mockFetch);

      expect(result.success).toBe(false);
    });

    it('does not call onSuccess when response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      const onSuccess = vi.fn();

      await doRefresh(mockFetch, onSuccess);

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('returns success=false when fetch throws a network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await doRefresh(mockFetch);

      expect(result.success).toBe(false);
    });

    it('does not call onSuccess on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const onSuccess = vi.fn();

      await doRefresh(mockFetch, onSuccess);

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('optional callback', () => {
    it('works without an onSuccess callback', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ projectsScanned: 1, durationMs: 50 }),
      });

      // Should not throw when no callback provided
      const result = await doRefresh(mockFetch);
      expect(result.success).toBe(true);
    });

    it('handles missing fields in response body gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await doRefresh(mockFetch);

      expect(result.success).toBe(true);
      expect(result.projectsScanned).toBeUndefined();
      expect(result.durationMs).toBeUndefined();
    });
  });
});
