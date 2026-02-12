/**
 * Unit tests for File Scanner
 *
 * Tests scanning Claude Code project directories and aggregating session data
 * Note: These tests focus on the exported utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getClaudeProjectsPath,
} from './scanner';

describe('File Scanner', () => {
  describe('getClaudeProjectsPath', () => {
    it('should return a path containing .claude/projects', () => {
      const path = getClaudeProjectsPath();
      expect(path).toContain('.claude');
      expect(path).toContain('projects');
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });

    it('should return an absolute path', () => {
      const path = getClaudeProjectsPath();
      // Check for absolute path indicators (starts with / on Unix or drive letter on Windows)
      const isAbsolute = path.startsWith('/') || /^[A-Za-z]:\\/.test(path);
      expect(isAbsolute).toBe(true);
    });

    it('should consistently return the same path', () => {
      const path1 = getClaudeProjectsPath();
      const path2 = getClaudeProjectsPath();
      expect(path1).toBe(path2);
    });
  });

  describe('Scanner exports', () => {
    it('should export getClaudeProjectsPath function', () => {
      expect(typeof getClaudeProjectsPath).toBe('function');
    });
  });
});
