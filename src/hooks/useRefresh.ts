import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export interface RefreshResult {
  success: boolean;
  projectsScanned?: number;
  durationMs?: number;
}

export interface UseRefreshOptions {
  onSuccess?: (result: RefreshResult) => void;
}

export interface UseRefreshReturn {
  isRefreshing: boolean;
  refresh: () => Promise<RefreshResult>;
}

/**
 * Hook that calls POST /api/refresh to clear server cache and re-scan projects.
 * After a successful refresh, calls onSuccess so the caller can re-fetch data.
 */
export function useRefresh(options: UseRefreshOptions = {}): UseRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { onSuccess } = options;

  const refresh = useCallback(async (): Promise<RefreshResult> => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        return { success: false };
      }

      const data = await response.json();
      const result: RefreshResult = {
        success: true,
        projectsScanned: data.projectsScanned,
        durationMs: data.durationMs,
      };

      onSuccess?.(result);
      return result;
    } catch {
      return { success: false };
    } finally {
      setIsRefreshing(false);
    }
  }, [onSuccess]);

  return { isRefreshing, refresh };
}
