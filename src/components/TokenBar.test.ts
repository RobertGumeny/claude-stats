import { describe, it, expect } from 'vitest';
import { buildSegments } from './TokenBar';
import { TokenUsage } from '../types';

describe('buildSegments', () => {
  describe('segment structure', () => {
    it('returns exactly 4 segments', () => {
      const usage: TokenUsage = {
        input_tokens: 100,
        cache_creation_input_tokens: 50,
        cache_read_input_tokens: 200,
        output_tokens: 75,
      };
      expect(buildSegments(usage)).toHaveLength(4);
    });

    it('segments are ordered: Input, Cache Write, Cache Read, Output', () => {
      const usage: TokenUsage = {
        input_tokens: 10,
        cache_creation_input_tokens: 20,
        cache_read_input_tokens: 30,
        output_tokens: 40,
      };
      const segs = buildSegments(usage);
      expect(segs[0].label).toBe('Input');
      expect(segs[1].label).toBe('Cache Write');
      expect(segs[2].label).toBe('Cache Read');
      expect(segs[3].label).toBe('Output');
    });

    it('each segment has a color and textColor', () => {
      const usage: TokenUsage = { input_tokens: 100 };
      buildSegments(usage).forEach((seg) => {
        expect(seg.color).toBeTruthy();
        expect(seg.textColor).toBeTruthy();
      });
    });
  });

  describe('token counts', () => {
    it('maps usage fields to correct segment counts', () => {
      const usage: TokenUsage = {
        input_tokens: 111,
        cache_creation_input_tokens: 222,
        cache_read_input_tokens: 333,
        output_tokens: 444,
      };
      const segs = buildSegments(usage);
      expect(segs[0].count).toBe(111); // Input
      expect(segs[1].count).toBe(222); // Cache Write
      expect(segs[2].count).toBe(333); // Cache Read
      expect(segs[3].count).toBe(444); // Output
    });

    it('defaults missing fields to 0', () => {
      const usage: TokenUsage = { input_tokens: 500 };
      const segs = buildSegments(usage);
      expect(segs[0].count).toBe(500); // Input
      expect(segs[1].count).toBe(0);   // Cache Write
      expect(segs[2].count).toBe(0);   // Cache Read
      expect(segs[3].count).toBe(0);   // Output
    });

    it('defaults all fields to 0 when usage is empty', () => {
      const usage: TokenUsage = {};
      buildSegments(usage).forEach((seg) => {
        expect(seg.count).toBe(0);
      });
    });

    it('treats undefined values as 0', () => {
      const usage = {
        input_tokens: undefined,
        output_tokens: 100,
      } as unknown as TokenUsage;
      const segs = buildSegments(usage);
      expect(segs[0].count).toBe(0);   // Input
      expect(segs[3].count).toBe(100); // Output
    });
  });

  describe('color coding', () => {
    it('Input segment uses blue', () => {
      const segs = buildSegments({ input_tokens: 100 });
      expect(segs[0].color).toContain('blue');
      expect(segs[0].textColor).toContain('blue');
    });

    it('Cache Write segment uses purple', () => {
      const segs = buildSegments({ cache_creation_input_tokens: 100 });
      expect(segs[1].color).toContain('purple');
      expect(segs[1].textColor).toContain('purple');
    });

    it('Cache Read segment uses green', () => {
      const segs = buildSegments({ cache_read_input_tokens: 100 });
      expect(segs[2].color).toContain('green');
      expect(segs[2].textColor).toContain('green');
    });

    it('Output segment uses amber', () => {
      const segs = buildSegments({ output_tokens: 100 });
      expect(segs[3].color).toContain('amber');
      expect(segs[3].textColor).toContain('amber');
    });
  });

  describe('proportional rendering logic', () => {
    it('segment percentages sum to 100 for typical usage', () => {
      const usage: TokenUsage = {
        input_tokens: 100,
        cache_creation_input_tokens: 200,
        cache_read_input_tokens: 300,
        output_tokens: 400,
      };
      const segs = buildSegments(usage);
      const total = segs.reduce((sum, s) => sum + s.count, 0);
      const pctSum = segs.reduce((sum, s) => sum + (s.count / total) * 100, 0);
      expect(pctSum).toBeCloseTo(100, 5);
    });

    it('single token type occupies full width (100%)', () => {
      const usage: TokenUsage = { output_tokens: 500 };
      const segs = buildSegments(usage);
      const total = segs.reduce((sum, s) => sum + s.count, 0);
      const outputSeg = segs.find((s) => s.label === 'Output')!;
      expect((outputSeg.count / total) * 100).toBe(100);
    });

    it('two equal segments each occupy 50%', () => {
      const usage: TokenUsage = { input_tokens: 250, output_tokens: 250 };
      const segs = buildSegments(usage);
      const total = segs.reduce((sum, s) => sum + s.count, 0);
      const inputPct = (segs[0].count / total) * 100;
      const outputPct = (segs[3].count / total) * 100;
      expect(inputPct).toBe(50);
      expect(outputPct).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('handles all zeros gracefully', () => {
      const usage: TokenUsage = {
        input_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 0,
      };
      const segs = buildSegments(usage);
      const total = segs.reduce((sum, s) => sum + s.count, 0);
      expect(total).toBe(0);
    });

    it('handles very large token counts without overflow', () => {
      const usage: TokenUsage = {
        input_tokens: 1_000_000,
        cache_read_input_tokens: 5_000_000,
        output_tokens: 500_000,
      };
      const segs = buildSegments(usage);
      expect(segs[0].count).toBe(1_000_000);
      expect(segs[2].count).toBe(5_000_000);
      expect(segs[3].count).toBe(500_000);
    });
  });
});
