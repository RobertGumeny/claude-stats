---
title: Vitest Backend Testing Setup
updated: 2026-02-12
category: Infrastructure
tags: [testing, vitest, unit-tests, coverage, backend]
related_articles:
  - docs/kb/infrastructure/backend-typescript-configuration.md
  - docs/kb/features/cost-calculator.md
  - docs/kb/patterns/jsonl-streaming-parser.md
---

# Vitest Backend Testing Setup

## Overview

Comprehensive unit testing infrastructure using Vitest for all backend utilities (scanner, parser, cost calculator). Configured with coverage thresholds and Node.js environment for server-side testing.

## Implementation

**Vitest Configuration** (vitest.config.ts):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      },
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        'server/errorHandler.ts'
      ]
    }
  }
});
```

**Package Scripts**:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Dependencies**:
- `vitest` - Test framework
- `@vitest/coverage-v8` - V8-based coverage provider

## Test Coverage

**Test Statistics**:
- Total test files: 5 (3 backend + 2 frontend)
- Total test cases: 81
- Pass rate: 100%
- Test code volume: ~1,185 lines

**Backend Test Files**:
1. **server/costCalculator.test.ts** - 20 tests
   - All pricing tiers and token types
   - Edge cases (null/undefined/negative values)
   - Rounding behavior
   - Large token counts

2. **server/parser.test.ts** - 23 tests
   - Valid JSONL parsing (single/multiple messages)
   - Malformed JSON handling
   - Empty line/file handling
   - CRLF line endings
   - Missing required fields
   - Content extraction (array/string formats)
   - Metadata preservation

3. **server/scanner.test.ts** - 4 tests
   - Path validation utilities
   - Absolute path verification
   - Function exports

## Key Decisions

1. **Vitest over Jest**: Selected Vitest for:
   - Native ESM support (matches project module system)
   - Faster execution
   - Better TypeScript integration with Vite-based projects
   - No configuration overhead

2. **Focus on Unit Tests**: Prioritized unit testing over integration testing to maximize coverage with minimal complexity. Scanner integration tests would require extensive filesystem mocking.

3. **Coverage Thresholds**: Set at 60% across all metrics (lines, functions, branches, statements) as specified in acceptance criteria.

4. **Error Handler Exclusion**: Excluded `errorHandler.ts` from coverage as it's primarily a logging utility difficult to test without extensive mocking.

5. **Co-located Test Files**: Test files placed alongside source files using `*.test.ts` naming convention for easy discovery and maintenance.

6. **Node Environment**: Configured `environment: 'node'` instead of default `jsdom` since backend has no DOM dependencies.

## Usage Example

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Example Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateMessageCost } from './costCalculator';

describe('Cost Calculator', () => {
  it('calculates cost for typical message with cache reads', () => {
    const usage = {
      input_tokens: 1000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 5000,
      output_tokens: 200
    };

    const cost = calculateMessageCost(usage);

    expect(cost).toBe(0.0181); // (1000*3 + 5000*0.3 + 200*15) / 1M
  });
});
```

## Edge Cases & Gotchas

- **Filesystem Tests**: Parser tests use temporary directories to avoid polluting project structure. Cleanup happens in `afterEach` hooks.

- **Async Tests**: All async tests must `await` promises or return promises from test functions to ensure proper error handling.

- **Module Mocking**: Vitest uses different mocking syntax than Jest (`vi.mock` instead of `jest.mock`). Import from `vitest` package, not global namespace.

- **Coverage Exclusions**: Test files and error handler automatically excluded. Add other exclusions to `vitest.config.ts` if needed.

## Test Scenarios Covered

- ✅ Malformed files (invalid JSON, missing fields)
- ✅ Missing token fields and null/undefined inputs
- ✅ Typical valid inputs with realistic session data
- ✅ Edge cases (negative tokens, empty files, very long lines)
- ✅ All cache tier pricing (5m and 1h)
- ✅ CRLF and LF line ending handling
- ✅ Content extraction from various formats
- ✅ Error reporting and graceful degradation

## Related Topics

- See [Backend TypeScript Configuration](../infrastructure/backend-typescript-configuration.md) for TypeScript setup
- See [Cost Calculator](../features/cost-calculator.md) for implementation details
- See [JSONL Streaming Parser](../patterns/jsonl-streaming-parser.md) for parser implementation
