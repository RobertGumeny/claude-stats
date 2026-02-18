import { describe, it, expect } from 'vitest';
import { computeTotalTokens, VIRTUALIZATION_THRESHOLD } from './MessageTable';
import { TokenUsage } from '../types';

describe('VIRTUALIZATION_THRESHOLD', () => {
  it('is 200', () => {
    expect(VIRTUALIZATION_THRESHOLD).toBe(200);
  });
});

describe('computeTotalTokens', () => {
  it('sums all four token types', () => {
    const usage: TokenUsage = {
      input_tokens: 100,
      cache_creation_input_tokens: 50,
      cache_read_input_tokens: 200,
      output_tokens: 75,
    };
    expect(computeTotalTokens(usage)).toBe(425);
  });

  it('defaults missing fields to 0', () => {
    const usage: TokenUsage = { input_tokens: 300 };
    expect(computeTotalTokens(usage)).toBe(300);
  });

  it('returns 0 for empty usage object', () => {
    expect(computeTotalTokens({})).toBe(0);
  });

  it('returns 0 for null/undefined usage', () => {
    expect(computeTotalTokens(null as unknown as TokenUsage)).toBe(0);
    expect(computeTotalTokens(undefined as unknown as TokenUsage)).toBe(0);
  });

  it('handles large token counts without overflow', () => {
    const usage: TokenUsage = {
      input_tokens: 1_000_000,
      cache_creation_input_tokens: 500_000,
      cache_read_input_tokens: 2_000_000,
      output_tokens: 250_000,
    };
    expect(computeTotalTokens(usage)).toBe(3_750_000);
  });

  it('treats 0-value fields correctly', () => {
    const usage: TokenUsage = {
      input_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 0,
    };
    expect(computeTotalTokens(usage)).toBe(0);
  });

  it('only output tokens', () => {
    const usage: TokenUsage = { output_tokens: 42 };
    expect(computeTotalTokens(usage)).toBe(42);
  });

  it('only cache tokens', () => {
    const usage: TokenUsage = {
      cache_creation_input_tokens: 10,
      cache_read_input_tokens: 20,
    };
    expect(computeTotalTokens(usage)).toBe(30);
  });
});
