/**
 * Unit tests for Server-side Cost Calculator
 *
 * Tests accurate cost calculations for server utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMessageCost,
  PRICING,
  type TokenUsage,
  type TokenUsageWithTier,
} from './costCalculator';

describe('Server Cost Calculator', () => {
  describe('calculateMessageCost', () => {
    it('should calculate cost correctly for example from PRD Appendix', () => {
      // Example from PRD.md Appendix: Example Log Entry
      const usage: TokenUsage = {
        input_tokens: 5,
        cache_creation_input_tokens: 466,
        cache_read_input_tokens: 22661,
        output_tokens: 6,
      };

      const cost = calculateMessageCost(usage);

      // Manual calculation:
      // (5 × $3.00 + 466 × $3.75 + 22661 × $0.30 + 6 × $15.00) / 1M
      // = (15 + 1747.5 + 6798.3 + 90) / 1M
      // = 8650.8 / 1M
      // = 0.0086508
      // Rounded to 4 decimals: 0.0087
      expect(cost).toBe(0.0087);
    });

    it('should calculate cost for input tokens only', () => {
      const usage: TokenUsage = {
        input_tokens: 1000,
      };

      const cost = calculateMessageCost(usage);

      // (1000 × $3.00) / 1M = 3000 / 1M = 0.0030
      expect(cost).toBe(0.0030);
    });

    it('should calculate cost for output tokens only', () => {
      const usage: TokenUsage = {
        output_tokens: 500,
      };

      const cost = calculateMessageCost(usage);

      // (500 × $15.00) / 1M = 7500 / 1M = 0.0075
      expect(cost).toBe(0.0075);
    });

    it('should calculate cost for cache write tokens only', () => {
      const usage: TokenUsage = {
        cache_creation_input_tokens: 1000,
      };

      const cost = calculateMessageCost(usage);

      // (1000 × $3.75) / 1M = 3750 / 1M = 0.0038
      expect(cost).toBe(0.0038);
    });

    it('should calculate cost for cache read tokens only (5m tier)', () => {
      const usage: TokenUsage = {
        cache_read_input_tokens: 10000,
      };

      const cost = calculateMessageCost(usage);

      // (10000 × $0.30) / 1M = 3000 / 1M = 0.0030
      expect(cost).toBe(0.0030);
    });

    it('should calculate cost for cache read tokens with 1h tier', () => {
      const usage: TokenUsageWithTier = {
        cache_read_input_tokens: 10000,
        cache_tier: '1h',
      };

      const cost = calculateMessageCost(usage);

      // (10000 × $0.15) / 1M = 1500 / 1M = 0.0015
      expect(cost).toBe(0.0015);
    });

    it('should handle missing usage object by returning 0', () => {
      expect(calculateMessageCost(null)).toBe(0.0000);
      expect(calculateMessageCost(undefined)).toBe(0.0000);
    });

    it('should handle empty usage object by returning 0', () => {
      const usage: TokenUsage = {};
      expect(calculateMessageCost(usage)).toBe(0.0000);
    });

    it('should default missing token fields to 0', () => {
      const usage: TokenUsage = {
        input_tokens: 100,
        // Other fields missing
      };

      const cost = calculateMessageCost(usage);

      // Only input tokens counted: (100 × $3.00) / 1M = 0.0003
      expect(cost).toBe(0.0003);
    });

    it('should treat negative token counts as 0', () => {
      const usage: TokenUsage = {
        input_tokens: -100,
        output_tokens: 50,
      };

      const cost = calculateMessageCost(usage);

      // Only output tokens counted: (50 × $15.00) / 1M = 0.0008
      expect(cost).toBe(0.0008);
    });

    it('should round to 4 decimal places', () => {
      const usage: TokenUsage = {
        input_tokens: 1,
        output_tokens: 1,
      };

      const cost = calculateMessageCost(usage);

      // (1 × $3.00 + 1 × $15.00) / 1M = 18 / 1M = 0.000018
      // Rounded to 4 decimals: 0.0000
      expect(cost).toBe(0.0000);
    });

    it('should handle large token counts correctly', () => {
      const usage: TokenUsage = {
        input_tokens: 100000,
        cache_read_input_tokens: 500000,
        output_tokens: 50000,
      };

      const cost = calculateMessageCost(usage);

      // (100000 × $3.00 + 500000 × $0.30 + 50000 × $15.00) / 1M
      // = (300000 + 150000 + 750000) / 1M
      // = 1200000 / 1M
      // = 1.2000
      expect(cost).toBe(1.2000);
    });

    it('should handle typical session message', () => {
      const usage: TokenUsage = {
        input_tokens: 2500,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 15000,
        output_tokens: 850,
      };

      const cost = calculateMessageCost(usage);

      // (2500 × $3.00 + 0 × $3.75 + 15000 × $0.30 + 850 × $15.00) / 1M
      // = (7500 + 0 + 4500 + 12750) / 1M
      // = 24750 / 1M
      // = 0.0248
      expect(cost).toBe(0.0248);
    });

    it('should handle undefined token fields gracefully', () => {
      const usage = {
        input_tokens: undefined,
        cache_creation_input_tokens: undefined,
        cache_read_input_tokens: undefined,
        output_tokens: undefined,
      };

      const cost = calculateMessageCost(usage);
      expect(cost).toBe(0.0000);
    });

    it('should default cache tier to 5m when not specified', () => {
      const usage: TokenUsage = {
        cache_read_input_tokens: 1000,
      };

      const cost = calculateMessageCost(usage);

      // Should use 5m tier pricing by default
      // (1000 × $0.30) / 1M = 0.0003
      expect(cost).toBe(0.0003);
    });

    it('should handle mixed positive and zero tokens', () => {
      const usage: TokenUsage = {
        input_tokens: 0,
        cache_creation_input_tokens: 100,
        cache_read_input_tokens: 0,
        output_tokens: 200,
      };

      const cost = calculateMessageCost(usage);

      // (0 + 100 × $3.75 + 0 + 200 × $15.00) / 1M
      // = (375 + 3000) / 1M
      // = 0.0034
      expect(cost).toBe(0.0034);
    });

    it('should handle realistic sidechain message', () => {
      const usage: TokenUsage = {
        input_tokens: 2000,
        cache_creation_input_tokens: 500,
        cache_read_input_tokens: 0,
        output_tokens: 300,
      };

      const cost = calculateMessageCost(usage);

      // (2000 × $3 + 500 × $3.75 + 0 + 300 × $15) / 1M
      // = (6000 + 1875 + 4500) / 1M
      // = 0.0124
      expect(cost).toBe(0.0124);
    });

    it('should handle realistic main thread message with heavy cache usage', () => {
      const usage: TokenUsage = {
        input_tokens: 500,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 25000,
        output_tokens: 1000,
      };

      const cost = calculateMessageCost(usage);

      // (500 × $3 + 0 + 25000 × $0.30 + 1000 × $15) / 1M
      // = (1500 + 7500 + 15000) / 1M
      // = 0.0240
      expect(cost).toBe(0.0240);
    });
  });

  describe('PRICING constants', () => {
    it('should have correct pricing values per PRD', () => {
      expect(PRICING.input).toBe(3.0);
      expect(PRICING.cacheWrite).toBe(3.75);
      expect(PRICING.cacheRead5m).toBe(0.30);
      expect(PRICING.cacheRead1h).toBe(0.15);
      expect(PRICING.output).toBe(15.0);
    });

    it('should have pricing as constant object', () => {
      // Test that PRICING object exists and has all required fields
      expect(PRICING).toBeDefined();
      expect(Object.keys(PRICING)).toHaveLength(5);
      expect(PRICING).toHaveProperty('input');
      expect(PRICING).toHaveProperty('cacheWrite');
      expect(PRICING).toHaveProperty('cacheRead5m');
      expect(PRICING).toHaveProperty('cacheRead1h');
      expect(PRICING).toHaveProperty('output');
    });
  });
});
