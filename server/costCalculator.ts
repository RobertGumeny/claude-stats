/**
 * Cost Calculator for Claude Sonnet 4.5
 * Server-side version
 *
 * Calculates accurate costs based on token usage according to Anthropic pricing.
 * All prices are per million tokens (MTok).
 */

/**
 * Claude Sonnet 4.5 pricing model
 * All values are in USD per million tokens
 */
export const PRICING = {
  input: 3.0,           // Standard input tokens
  cacheWrite: 3.75,     // Cache creation tokens
  cacheRead5m: 0.30,    // 5-minute cache tier (default assumption)
  cacheRead1h: 0.15,    // 1-hour cache tier (future enhancement)
  output: 15.0,         // Generated output tokens
} as const;

/**
 * Token usage data structure matching Claude API response
 */
export interface TokenUsage {
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

/**
 * Extended token usage with cache tier information
 */
export interface TokenUsageWithTier extends TokenUsage {
  cache_tier?: '5m' | '1h';  // Cache tier (defaults to 5m)
}

/**
 * Calculate cost for a single message based on token usage
 *
 * Formula:
 * cost = (input × $3.00 + cache_write × $3.75 + cache_read × $0.30 + output × $15.00) / 1M
 *
 * @param usage - Token usage object from Claude API
 * @returns Cost in USD, rounded to 4 decimal places
 */
export function calculateMessageCost(usage: TokenUsage | null | undefined): number {
  // Handle missing or null usage object
  if (!usage) {
    return 0.0000;
  }

  // Extract token counts, defaulting to 0 for missing fields
  const inputTokens = Math.max(0, usage.input_tokens || 0);
  const cacheWriteTokens = Math.max(0, usage.cache_creation_input_tokens || 0);
  const cacheReadTokens = Math.max(0, usage.cache_read_input_tokens || 0);
  const outputTokens = Math.max(0, usage.output_tokens || 0);

  // Determine cache tier pricing (default to 5-minute tier)
  const cacheTier = (usage as TokenUsageWithTier).cache_tier || '5m';
  const cacheReadPrice = cacheTier === '1h' ? PRICING.cacheRead1h : PRICING.cacheRead5m;

  // Calculate total cost
  const totalCost = (
    (inputTokens * PRICING.input) +
    (cacheWriteTokens * PRICING.cacheWrite) +
    (cacheReadTokens * cacheReadPrice) +
    (outputTokens * PRICING.output)
  ) / 1_000_000;

  // Round to 4 decimal places
  return Math.round(totalCost * 10000) / 10000;
}
