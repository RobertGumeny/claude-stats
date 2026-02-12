/**
 * Cost Calculator for Claude Sonnet 4.5 (Server-side)
 *
 * This is a JavaScript version of the TypeScript cost calculator
 * used by the server-side scanner.
 */

const PRICING = {
  input: 3.0,           // Standard input tokens
  cacheWrite: 3.75,     // Cache creation tokens
  cacheRead5m: 0.30,    // 5-minute cache tier (default assumption)
  cacheRead1h: 0.15,    // 1-hour cache tier (future enhancement)
  output: 15.0,         // Generated output tokens
};

/**
 * Calculate cost for a single message based on token usage
 * @param {Object} usage - Token usage object
 * @returns {number} Cost in USD, rounded to 4 decimal places
 */
export function calculateMessageCost(usage) {
  if (!usage) {
    return 0.0000;
  }

  const inputTokens = Math.max(0, usage.input_tokens || 0);
  const cacheWriteTokens = Math.max(0, usage.cache_creation_input_tokens || 0);
  const cacheReadTokens = Math.max(0, usage.cache_read_input_tokens || 0);
  const outputTokens = Math.max(0, usage.output_tokens || 0);

  const cacheTier = usage.cache_tier || '5m';
  const cacheReadPrice = cacheTier === '1h' ? PRICING.cacheRead1h : PRICING.cacheRead5m;

  const totalCost = (
    (inputTokens * PRICING.input) +
    (cacheWriteTokens * PRICING.cacheWrite) +
    (cacheReadTokens * cacheReadPrice) +
    (outputTokens * PRICING.output)
  ) / 1_000_000;

  return Math.round(totalCost * 10000) / 10000;
}

/**
 * Calculate total cost for multiple messages
 * @param {Array} messages - Array of message objects with usage data
 * @returns {number} Total cost in USD, rounded to 4 decimal places
 */
export function calculateTotalCost(messages) {
  if (!messages || messages.length === 0) {
    return 0.0000;
  }

  const total = messages.reduce((sum, message) => {
    return sum + calculateMessageCost(message.usage);
  }, 0);

  return Math.round(total * 10000) / 10000;
}
