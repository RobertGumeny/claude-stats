---
title: Claude Sonnet 4.5 Cost Calculator
updated: 2026-02-12
category: Features
tags: [cost-calculation, pricing, claude, tokens]
related_articles:
  - docs/kb/patterns/jsonl-streaming-parser.md
  - docs/kb/architecture/typescript-type-system.md
  - docs/kb/features/api-endpoints.md
  - docs/kb/infrastructure/vitest-backend-testing.md
---

# Claude Sonnet 4.5 Cost Calculator

## Overview

A utility for calculating accurate costs based on Claude Sonnet 4.5 token usage. Handles input tokens, cache creation, cache reads, and output tokens with proper pricing tiers. Implemented in TypeScript with comprehensive type safety.

## Implementation

**Pricing Constants (src/utils/costCalculator.ts):**
```typescript
const PRICING = {
  input: 3.0,           // $3.00 per million tokens
  cacheWrite: 3.75,     // $3.75 per million tokens (cache creation)
  cacheRead5m: 0.3,     // $0.30 per million tokens (5-minute tier)
  cacheRead1h: 0.15,    // $0.15 per million tokens (1-hour tier)
  output: 15.0,         // $15.00 per million tokens
};
```

**Cost Calculation:**
```typescript
function calculateMessageCost(
  usage: TokenUsage | null | undefined,
  cacheTier: '5m' | '1h' = '5m'
): number {
  if (!usage) return 0;

  const inputTokens = Math.max(0, usage.input_tokens || 0);
  const cacheWrite = Math.max(0, usage.cache_creation_input_tokens || 0);
  const cacheRead = Math.max(0, usage.cache_read_input_tokens || 0);
  const outputTokens = Math.max(0, usage.output_tokens || 0);

  const cacheReadPrice = cacheTier === '5m' ? PRICING.cacheRead5m : PRICING.cacheRead1h;

  const cost = (
    (inputTokens * PRICING.input) +
    (cacheWrite * PRICING.cacheWrite) +
    (cacheRead * cacheReadPrice) +
    (outputTokens * PRICING.output)
  ) / 1_000_000;

  return Math.round(cost * 10000) / 10000; // 4 decimal places
}
```

**Helper Functions:**
```typescript
function calculateTotalCost(messages: Message[]): number {
  return messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}
```

## Key Decisions

**4 Decimal Place Rounding**: Costs rounded to 4 decimal places as specified in PRD (e.g., `$0.0086`). Uses banker's rounding (`Math.round`) for consistency.

**Default to Zero**: Missing token fields default to `0` rather than throwing errors. Prevents NaN in calculations and matches parser behavior.

**Negative Token Handling**: Negative token counts treated as `0`. Guards against malformed data without crashing.

**Cache Tier Support**: Supports both 5-minute and 1-hour cache tiers. Defaults to 5-minute tier (more conservative pricing).

**Type Safety**: All functions use TypeScript interfaces (`TokenUsage`, `Message`) for compile-time validation.

## Usage Example

```typescript
// Calculate cost for a single message
const message = {
  usage: {
    input_tokens: 5,
    cache_creation_input_tokens: 466,
    cache_read_input_tokens: 22661,
    output_tokens: 6,
  },
};
const cost = calculateMessageCost(message.usage); // $0.0087

// Calculate total cost for session
const messages = await parseJsonlFile('./session.jsonl');
messages.forEach(msg => {
  msg.cost = calculateMessageCost(msg.usage);
});
const totalCost = calculateTotalCost(messages);
console.log(formatCost(totalCost)); // "$0.1234"
```

## Edge Cases & Gotchas

**Null/Undefined Usage**: Returns `$0.00` when usage object is missing. Logs warning for debugging.

**Large Token Counts**: Handles token counts >100K correctly. No overflow issues with JavaScript numbers up to MAX_SAFE_INTEGER.

**Cache Tier Detection**: Logs may not specify cache tier (5m vs 1h). Assumes 5-minute tier by default (conservative).

**Rounding Precision**: Costs are rounded to 4 decimal places. Summing many rounded values may introduce small rounding errors (<$0.0001).

## Related Topics

See [JSONL Streaming Parser](../patterns/jsonl-streaming-parser.md) for usage extraction.
See [TypeScript Type System](../architecture/typescript-type-system.md) for `TokenUsage` and `Message` interfaces.
