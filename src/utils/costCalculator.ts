/**
 * Cost Calculator for Claude Sonnet 4.5
 *
 * Calculates accurate costs based on token usage according to Anthropic pricing.
 * All prices are per million tokens (MTok).
 *
 * @see PRD.md Section 5 - Cost Calculator
 */

/**
 * Claude Sonnet 4.5 pricing model
 * All values are in USD per million tokens
 */
export const PRICING = {
  input: 3.0, // Standard input tokens
  cacheWrite: 3.75, // Cache creation tokens
  cacheRead5m: 0.3, // 5-minute cache tier (default assumption)
  cacheRead1h: 0.15, // 1-hour cache tier (future enhancement)
  output: 15.0, // Generated output tokens
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
  cache_tier?: "5m" | "1h"; // Cache tier (defaults to 5m)
}

/**
 * Calculate cost for a single message based on token usage
 *
 * Formula:
 * cost = (input × $3.00 + cache_write × $3.75 + cache_read × $0.30 + output × $15.00) / 1M
 *
 * @param usage - Token usage object from Claude API
 * @returns Cost in USD, rounded to 4 decimal places
 *
 * @example
 * const usage = {
 *   input_tokens: 5,
 *   cache_creation_input_tokens: 466,
 *   cache_read_input_tokens: 22661,
 *   output_tokens: 6
 * };
 * const cost = calculateMessageCost(usage);
 * // Returns: 0.0086
 */
export function calculateMessageCost(
  usage: TokenUsage | null | undefined,
): number {
  // Handle missing or null usage object
  if (!usage) {
    return 0.0;
  }

  // Extract token counts, defaulting to 0 for missing fields
  const inputTokens = Math.max(0, usage.input_tokens || 0);
  const cacheWriteTokens = Math.max(0, usage.cache_creation_input_tokens || 0);
  const cacheReadTokens = Math.max(0, usage.cache_read_input_tokens || 0);
  const outputTokens = Math.max(0, usage.output_tokens || 0);

  // Determine cache tier pricing (default to 5-minute tier)
  const cacheTier = (usage as TokenUsageWithTier).cache_tier || "5m";
  const cacheReadPrice =
    cacheTier === "1h" ? PRICING.cacheRead1h : PRICING.cacheRead5m;

  // Calculate total cost
  // (input × $3.00 + cache_write × $3.75 + cache_read × $0.30 + output × $15.00) / 1M
  const totalCost =
    (inputTokens * PRICING.input +
      cacheWriteTokens * PRICING.cacheWrite +
      cacheReadTokens * cacheReadPrice +
      outputTokens * PRICING.output) /
    1_000_000;

  // Round to 4 decimal places
  return Math.round(totalCost * 10000) / 10000;
}

/**
 * Calculate total cost for multiple messages
 *
 * @param messages - Array of token usage objects
 * @returns Total cost in USD, rounded to 4 decimal places
 *
 * @example
 * const messages = [
 *   { input_tokens: 100, output_tokens: 50 },
 *   { input_tokens: 200, cache_read_input_tokens: 1000, output_tokens: 100 }
 * ];
 * const totalCost = calculateTotalCost(messages);
 */
export function calculateTotalCost(messages: TokenUsage[]): number {
  if (!messages || messages.length === 0) {
    return 0.0;
  }

  const total = messages.reduce((sum, usage) => {
    return sum + calculateMessageCost(usage);
  }, 0);

  // Round to 4 decimal places
  return Math.round(total * 10000) / 10000;
}

/**
 * Calculate cost breakdown for analysis
 *
 * @param usage - Token usage object
 * @returns Detailed cost breakdown by token type
 *
 * @example
 * const breakdown = calculateCostBreakdown(usage);
 * // Returns:
 * // {
 * //   input: 0.0000,
 * //   cacheWrite: 0.0017,
 * //   cacheRead: 0.0068,
 * //   output: 0.0001,
 * //   total: 0.0086
 * // }
 */
export function calculateCostBreakdown(usage: TokenUsage | null | undefined): {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
  total: number;
} {
  if (!usage) {
    return {
      input: 0.0,
      cacheWrite: 0.0,
      cacheRead: 0.0,
      output: 0.0,
      total: 0.0,
    };
  }

  const inputTokens = Math.max(0, usage.input_tokens || 0);
  const cacheWriteTokens = Math.max(0, usage.cache_creation_input_tokens || 0);
  const cacheReadTokens = Math.max(0, usage.cache_read_input_tokens || 0);
  const outputTokens = Math.max(0, usage.output_tokens || 0);

  const cacheTier = (usage as TokenUsageWithTier).cache_tier || "5m";
  const cacheReadPrice =
    cacheTier === "1h" ? PRICING.cacheRead1h : PRICING.cacheRead5m;

  const inputCost = (inputTokens * PRICING.input) / 1_000_000;
  const cacheWriteCost = (cacheWriteTokens * PRICING.cacheWrite) / 1_000_000;
  const cacheReadCost = (cacheReadTokens * cacheReadPrice) / 1_000_000;
  const outputCost = (outputTokens * PRICING.output) / 1_000_000;

  return {
    input: Math.round(inputCost * 10000) / 10000,
    cacheWrite: Math.round(cacheWriteCost * 10000) / 10000,
    cacheRead: Math.round(cacheReadCost * 10000) / 10000,
    output: Math.round(outputCost * 10000) / 10000,
    total:
      Math.round(
        (inputCost + cacheWriteCost + cacheReadCost + outputCost) * 10000,
      ) / 10000,
  };
}

/**
 * Format cost as currency string
 *
 * @param cost - Cost in USD
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted cost string (e.g., "$0.01")
 *
 * @example
 * formatCost(0.0086);    // "$0.01"
 * formatCost(1.2345);    // "$1.23"
 * formatCost(0.0001, 4); // "$0.0001"
 */
export function formatCost(cost: number, decimals: number = 2): string {
  return `$${cost.toFixed(decimals)}`;
}
