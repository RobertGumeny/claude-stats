# Research Report: Cost Calculation & Formatting Feature

**Generated**: 2026-02-12
**Scope Type**: Feature/Module Analysis
**Related Epic**: EPIC-3 (Primary UI Views)
**Related Tasks**: EPIC-1-004 (Cost Calculator Implementation)

---

## Overview

The cost calculation feature computes and displays Claude API usage costs across the application. Analysis reveals **significant duplication** with multiple implementations of the same functionality across server and client, unused documented code, and inconsistent formatting defaults.

---

## File Manifest

| File | Purpose | Status | Lines |
|------|---------|--------|-------|
| `server/costCalculator.ts` | Server-side cost calculation (TypeScript) | ✅ Active | 73 |
| `server/cost-calculator.js` | Server-side cost calculation (JavaScript) | ⚠️ Duplicate | 59 |
| `src/utils/costCalculator.ts` | Client-side cost utilities (full-featured) | ⚠️ Partially Unused | 190 |
| `src/utils/formatters.ts` | Client-side formatting utilities | ✅ Active | 102 |
| `src/utils/COST_CALCULATOR.md` | Standalone documentation | ⚠️ Duplicate | 285 |
| `docs/kb/features/cost-calculator.md` | Knowledge base documentation | ✅ Active | 308 |
| `server/costCalculator.test.ts` | Server-side tests | ✅ Active | - |
| `src/utils/costCalculator.test.ts` | Client-side tests | ✅ Active | - |
| `src/utils/test-cost-calculator.js` | Legacy test file | ❓ Unknown | - |

---

## Data Flow

### Server → Client Cost Calculation Flow

```
1. Server: scanner.ts scans .jsonl files
   ↓
2. Server: scanner.ts calls calculateMessageCost() from server/costCalculator.ts
   ↓
3. Server: Returns JSON with pre-calculated cost values
   {
     totalCost: 0.0086,  // Already calculated
     messages: [
       { cost: 0.0001, ... },  // Each message cost pre-calculated
       ...
     ]
   }
   ↓
4. Frontend: Receives cost values (NO calculation needed)
   ↓
5. Frontend: formatCost() from formatters.ts formats for display
   → "$0.0086" (always 4 decimals)
```

**Key Insight**: Server does ALL calculations, frontend only formats for display.

---

## Architecture Analysis

### Server-Side (Backend)

**Active Implementation:**
- **File**: `server/costCalculator.ts`
- **Import Location**: `server/scanner.ts:5`
- **Functions Used**:
  - `calculateMessageCost(usage)` - Called in scanner.ts lines 172, 512
- **Import Pattern**: `import { calculateMessageCost } from './costCalculator.js'`

**Duplicate Implementation:**
- **File**: `server/cost-calculator.js` (JavaScript version)
- **Status**: ❌ NOT IMPORTED ANYWHERE (dead code)
- **Contains**: Same logic as .ts version plus `calculateTotalCost()`
- **Issue**: Appears to be orphaned legacy file

**Calculation Points in scanner.ts:**
1. **Line 172**: `parseSessionFile()` calculates total session cost
   ```typescript
   const totalCost = messages.reduce((sum, msg) => {
     return sum + calculateMessageCost(msg.usage);
   }, 0);
   ```

2. **Line 512**: `getSessionDetail()` calculates per-message costs
   ```typescript
   const sessionMessages: SessionMessage[] = messages.map(msg => ({
     messageId: msg.messageId,
     cost: calculateMessageCost(msg.usage),  // ← Cost calculated here
     ...
   }));
   ```

### Client-Side (Frontend)

**Active Formatter:**
- **File**: `src/utils/formatters.ts`
- **Function**: `formatCost(cost: number): string`
- **Implementation**: Always 4 decimals → `$${cost.toFixed(4)}`
- **Used By**:
  - `MessageTable.tsx:3,80` - Individual message costs
  - `SessionCard.tsx:2,35` - Session total costs
  - `SummaryCard.tsx:2,100` - Summary costs

**Unused Calculator:**
- **File**: `src/utils/costCalculator.ts`
- **Functions Exported**:
  - ✅ `calculateMessageCost()` - **NOT USED** (server does this)
  - ✅ `calculateTotalCost()` - **NOT USED** (server does this)
  - ✅ `calculateCostBreakdown()` - **NOT USED**
  - ❌ `formatCost(cost, decimals=2)` - **NOT USED** (formatters.ts used instead)
- **Status**: Well-tested but orphaned code
- **Issue**: Documented as primary cost utility but never imported by components

**Direct Formatting (Anti-Pattern):**
- **Files**: `ProjectCard.tsx:14`, `ProjectListPage.tsx:29`, `TypeTest.tsx`
- **Pattern**: Direct `.toFixed(4)` instead of using formatter
- **Issue**: Violates DRY principle, bypasses centralized formatting

---

## Dependencies

### Internal Dependencies

**Server:**
- `server/scanner.ts` → `server/costCalculator.ts` (imports `calculateMessageCost`)
- `server/parser.ts` → Provides parsed messages to scanner

**Client:**
- `MessageTable.tsx` → `src/utils/formatters.ts` (imports `formatCost`)
- `SessionCard.tsx` → `src/utils/formatters.ts` (imports `formatCost`)
- `SummaryCard.tsx` → `src/utils/formatters.ts` (imports `formatCost`)
- `src/utils/costCalculator.test.ts` → `src/utils/costCalculator.ts` (tests unused code)

### External Dependencies
- None (pure calculation logic)

---

## Patterns Observed

### 1. **Server-Side Cost Calculation Pattern**
- ✅ Centralized calculation in scanner.ts
- ✅ Consistent rounding to 4 decimals: `Math.round(totalCost * 10000) / 10000`
- ✅ Graceful null handling with 0 defaults

### 2. **Frontend Formatting Pattern**
- ⚠️ Mixed approaches:
  - Components use `formatCost()` from formatters.ts
  - Some files use direct `.toFixed(4)`
  - Unused `formatCost()` in costCalculator.ts with different signature

### 3. **Pricing Model Duplication**
- Both server/costCalculator.ts and src/utils/costCalculator.ts define:
  ```typescript
  export const PRICING = {
    input: 3.0,
    cacheWrite: 3.75,
    cacheRead5m: 0.3,
    cacheRead1h: 0.15,
    output: 15.0,
  } as const;
  ```
- ⚠️ Issue: Two sources of truth for pricing

---

## Anti-Patterns & Tech Debt

### Critical Issues

#### 1. **Duplicate formatCost() Implementations**
- **Location**: `formatters.ts:91` vs `costCalculator.ts:188`
- **Problem**:
  - formatters.ts: `formatCost(cost)` → always 4 decimals
  - costCalculator.ts: `formatCost(cost, decimals=2)` → defaults to 2 decimals
- **Impact**: Documentation references costCalculator version, but code uses formatters version
- **Risk**: Future developers may use wrong function

#### 2. **Orphaned Server File**
- **Location**: `server/cost-calculator.js`
- **Problem**: JavaScript duplicate of TypeScript file, never imported
- **Impact**: Maintenance burden, confusion about which file is active
- **Evidence**: `grep "cost-calculator.js"` shows only scanner.js (also unused) imports it

#### 3. **Unused Client-Side Calculator**
- **Location**: `src/utils/costCalculator.ts`
- **Problem**: 190 lines of well-tested code that's never used
- **Why**: Server pre-calculates all costs before sending to frontend
- **Impact**: Dead code, misleading documentation

#### 4. **Documentation Duplication**
- **Locations**: `src/utils/COST_CALCULATOR.md` + `docs/kb/features/cost-calculator.md`
- **Problem**: Nearly identical content (285 vs 308 lines)
- **Discrepancy**: Both document `formatCost()` from costCalculator.ts but it's never used
- **Example Errors**: Docs claim `formatCost(0.0086) → "$0.01"` but actual behavior is `"$0.0086"`

#### 5. **Inconsistent Formatting Approach**
- **Issue**: Some components use `formatCost()`, others use `.toFixed(4)` directly
- **Locations**:
  - ✅ MessageTable.tsx, SessionCard.tsx, SummaryCard.tsx use `formatCost()`
  - ❌ ProjectCard.tsx:14, ProjectListPage.tsx:29 use `.toFixed(4)`
- **Impact**: Hard to change formatting globally

---

## State Management

**No state management needed** - Cost values are:
1. Calculated once on server during scan
2. Passed via API as plain numbers
3. Formatted on-demand during render

No caching, no derived state, no context needed.

---

## PRD Alignment

### ✅ Aligned with PRD

**PRD Section 5 - Cost Calculator:**
- ✅ Implements Claude Sonnet 4.5 pricing model correctly
- ✅ Handles all token types (input, cache_write, cache_read, output)
- ✅ Rounds to 4 decimal places
- ✅ Handles edge cases (null usage, missing fields)
- ✅ Formula matches PRD specification exactly

**PRD Performance Requirements:**
- ✅ Costs calculated during scan (not on-demand)
- ✅ No performance bottlenecks in calculation logic

### ⚠️ Deviation from PRD

**PRD Section 2 - Features:**
- PRD states "Cost displayed with 4 decimal places (`$0.0086`)"
- ✅ Currently correct (formatters.ts uses 4 decimals)
- ⚠️ User wants to change to 2 decimals by default (see issue discussion)
- ⚠️ Documentation shows 2-decimal examples but code uses 4

---

## Raw Notes

### Discovery Process

1. Started with user reporting duplicate `formatCost()` functions
2. Found TWO implementations with different signatures
3. Traced imports → formatters.ts is used, costCalculator.ts is documented but unused
4. Discovered server-side duplication (.ts vs .js files)
5. Found documentation duplication (2 markdown files)
6. Realized frontend never calculates costs (server does everything)

### Key Questions

**Q: Why does src/utils/costCalculator.ts exist if it's never used?**
- A: Likely created for frontend calculations, then architecture shifted to server-side calculation
- Tests still exist and pass, suggesting it was once intended for use
- Documentation was written for it but never updated when architecture changed

**Q: Why two server-side files (.ts and .js)?**
- A: scanner.ts imports from `'./costCalculator.js'` (note .js extension)
- TypeScript compiles to .js, so this should work
- cost-calculator.js appears to be orphaned legacy file

**Q: Should frontend have calculation capability?**
- Current: Server calculates everything, frontend just formats
- Pro: Centralized logic, no duplication
- Con: Frontend can't do client-side cost breakdowns without API call
- Decision needed: Keep current architecture or enable frontend calculations?

### Testing Status

**Server:**
- ✅ `server/costCalculator.test.ts` - Comprehensive tests
- ✅ Tests pass and validate PRD examples

**Client:**
- ✅ `src/utils/costCalculator.test.ts` - Tests for unused code
- ⚠️ Tests pass but test code that's never imported by components
- ❓ `src/utils/test-cost-calculator.js` - Legacy test file, unclear status

### Import Analysis

**Actual imports found in codebase:**
```typescript
// Server
import { calculateMessageCost } from './costCalculator.js'; // scanner.ts:5

// Client
import { formatCost, formatNumber } from '../utils/formatters'; // MessageTable.tsx:3
import { formatCost, formatNumber } from '../utils/formatters'; // SessionCard.tsx:2
import { formatCost, formatNumber } from '../utils/formatters'; // SummaryCard.tsx:2
```

**Expected but NOT found:**
```typescript
// Never imported anywhere!
import { formatCost } from '../utils/costCalculator';
import { calculateMessageCost } from '../utils/costCalculator';
import { calculateCostBreakdown } from '../utils/costCalculator';
```

---

## Recommendations

### Immediate Actions (High Priority)

1. **Delete Dead Code**
   - Remove `server/cost-calculator.js` (orphaned)
   - Consider removing client-side calculation functions if not needed
   - Remove `src/utils/test-cost-calculator.js` if obsolete

2. **Consolidate formatCost()**
   - Decision needed: Keep formatters.ts or costCalculator.ts version?
   - Update all imports to use single source
   - Delete duplicate implementation

3. **Fix Documentation**
   - Delete `src/utils/COST_CALCULATOR.md`
   - Update `docs/kb/features/cost-calculator.md` with accurate examples
   - Document actual architecture (server calculates, frontend formats)

4. **Standardize Formatting**
   - Replace all `.toFixed(4)` calls with `formatCost()` function
   - Files to update: ProjectCard.tsx, ProjectListPage.tsx, TypeTest.tsx

### Medium Priority

5. **Decide on Default Decimals**
   - User wants 2 decimals by default (human-readable)
   - Update formatCost() signature and all call sites
   - Document when to use 4 decimals (message-level details only)

6. **Consolidate Pricing Constants**
   - Keep PRICING in one location only (server or shared)
   - If needed by both, create shared types package

### Low Priority

7. **Architecture Decision**
   - Document why server does all calculations
   - If frontend needs calculations, import server code properly
   - If not, remove client-side calculator entirely

---

## Appendix: File Locations

### Cost Calculation
- Server (Active): `server/costCalculator.ts`
- Server (Dead): `server/cost-calculator.js`
- Client (Unused): `src/utils/costCalculator.ts`

### Formatting
- Active: `src/utils/formatters.ts`
- Unused: `src/utils/costCalculator.ts:formatCost()`

### Documentation
- Primary: `docs/kb/features/cost-calculator.md`
- Duplicate: `src/utils/COST_CALCULATOR.md`

### Tests
- Server: `server/costCalculator.test.ts`
- Client: `src/utils/costCalculator.test.ts`
- Legacy: `src/utils/test-cost-calculator.js`

### Usage in Components
- MessageTable.tsx:3,80
- SessionCard.tsx:2,35
- SummaryCard.tsx:2,100
- ProjectCard.tsx:14 (direct .toFixed)
- ProjectListPage.tsx:29 (direct .toFixed)
- TypeTest.tsx (direct .toFixed)
