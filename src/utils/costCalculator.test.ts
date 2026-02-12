/**
 * Unit tests for Cost Calculator
 *
 * Tests accurate cost calculations against known examples from PRD
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMessageCost,
  calculateTotalCost,
  calculateCostBreakdown,
  formatCost,
  PRICING,
  type TokenUsage,
} from './costCalculator';

describe('Cost Calculator', () => {
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
      const usage = {
        cache_read_input_tokens: 10000,
        cache_tier: '1h' as const,
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
  });

  describe('calculateTotalCost', () => {
    it('should sum costs for multiple messages', () => {
      const messages: TokenUsage[] = [
        { input_tokens: 1000, output_tokens: 100 },
        { input_tokens: 2000, output_tokens: 200 },
        { input_tokens: 3000, output_tokens: 300 },
      ];

      const total = calculateTotalCost(messages);

      // Message 1: (1000 × $3 + 100 × $15) / 1M = 4500 / 1M = 0.0045
      // Message 2: (2000 × $3 + 200 × $15) / 1M = 9000 / 1M = 0.0090
      // Message 3: (3000 × $3 + 300 × $15) / 1M = 13500 / 1M = 0.0135
      // Total: 0.0045 + 0.0090 + 0.0135 = 0.0270
      expect(total).toBe(0.0270);
    });

    it('should handle empty array by returning 0', () => {
      expect(calculateTotalCost([])).toBe(0.0000);
    });

    it('should handle array with null/empty entries', () => {
      const messages: TokenUsage[] = [
        { input_tokens: 1000 },
        {},
        { output_tokens: 100 },
      ];

      const total = calculateTotalCost(messages);

      // Message 1: (1000 × $3) / 1M = 0.0030
      // Message 2: 0
      // Message 3: (100 × $15) / 1M = 0.0015
      // Total: 0.0045
      expect(total).toBe(0.0045);
    });
  });

  describe('calculateCostBreakdown', () => {
    it('should break down costs by token type', () => {
      const usage: TokenUsage = {
        input_tokens: 1000,
        cache_creation_input_tokens: 500,
        cache_read_input_tokens: 10000,
        output_tokens: 200,
      };

      const breakdown = calculateCostBreakdown(usage);

      expect(breakdown).toEqual({
        input: 0.0030,        // 1000 × $3 / 1M
        cacheWrite: 0.0019,   // 500 × $3.75 / 1M
        cacheRead: 0.0030,    // 10000 × $0.30 / 1M
        output: 0.0030,       // 200 × $15 / 1M
        total: 0.0109,        // Sum of all
      });
    });

    it('should handle missing usage object', () => {
      const breakdown = calculateCostBreakdown(null);

      expect(breakdown).toEqual({
        input: 0.0000,
        cacheWrite: 0.0000,
        cacheRead: 0.0000,
        output: 0.0000,
        total: 0.0000,
      });
    });

    it('should match total with calculateMessageCost', () => {
      const usage: TokenUsage = {
        input_tokens: 5,
        cache_creation_input_tokens: 466,
        cache_read_input_tokens: 22661,
        output_tokens: 6,
      };

      const breakdown = calculateCostBreakdown(usage);
      const directCost = calculateMessageCost(usage);

      expect(breakdown.total).toBe(directCost);
    });

    it('should handle 1h cache tier in breakdown', () => {
      const usage = {
        cache_read_input_tokens: 10000,
        cache_tier: '1h' as const,
      };

      const breakdown = calculateCostBreakdown(usage);

      expect(breakdown.cacheRead).toBe(0.0015); // 10000 × $0.15 / 1M
    });
  });

  describe('formatCost', () => {
    it('should format cost with $ prefix and 4 decimals by default', () => {
      expect(formatCost(0.0086)).toBe('$0.0086');
      expect(formatCost(1.2345)).toBe('$1.2345');
      expect(formatCost(0.0001)).toBe('$0.0001');
    });

    it('should support custom decimal places', () => {
      expect(formatCost(0.0086, 2)).toBe('$0.01');
      expect(formatCost(1.2345, 3)).toBe('$1.235');
      expect(formatCost(0.123456, 6)).toBe('$0.123456');
    });

    it('should handle zero cost', () => {
      expect(formatCost(0)).toBe('$0.0000');
      expect(formatCost(0, 2)).toBe('$0.00');
    });

    it('should handle large costs', () => {
      expect(formatCost(123.4567)).toBe('$123.4567');
      expect(formatCost(1000.5)).toBe('$1000.5000');
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
  });

  describe('Integration tests with realistic session data', () => {
    it('should calculate session with mixed message types', () => {
      // Simulating a real session with multiple messages
      const sessionMessages: TokenUsage[] = [
        // User message with cache creation
        {
          input_tokens: 1200,
          cache_creation_input_tokens: 5000,
          output_tokens: 0,
        },
        // Assistant response using cache
        {
          input_tokens: 50,
          cache_read_input_tokens: 5000,
          output_tokens: 850,
        },
        // User follow-up
        {
          input_tokens: 100,
          cache_read_input_tokens: 5000,
          output_tokens: 0,
        },
        // Assistant response
        {
          input_tokens: 30,
          cache_read_input_tokens: 5100,
          output_tokens: 1200,
        },
      ];

      const totalCost = calculateTotalCost(sessionMessages);

      // Should calculate realistic session cost
      expect(totalCost).toBeGreaterThan(0);
      expect(totalCost).toBeLessThan(1); // Typical session < $1
      expect(totalCost.toString()).toMatch(/^\d+\.\d{4}$/); // 4 decimal places
    });

    it('should handle sidechain vs main thread distinction in cost analysis', () => {
      // Main thread tends to have larger cache usage
      const mainThreadUsage: TokenUsage = {
        input_tokens: 500,
        cache_read_input_tokens: 25000,
        output_tokens: 1000,
      };

      // Sidechain tends to have fresh input
      const sidechainUsage: TokenUsage = {
        input_tokens: 2000,
        cache_creation_input_tokens: 500,
        output_tokens: 300,
      };

      const mainCost = calculateMessageCost(mainThreadUsage);
      const sidechainCost = calculateMessageCost(sidechainUsage);

      // Both should be calculated correctly
      expect(mainCost).toBeGreaterThan(0);
      expect(sidechainCost).toBeGreaterThan(0);

      // Cache read should be cheaper than input
      expect(mainCost).toBeLessThan(sidechainCost);
    });
  });
});
