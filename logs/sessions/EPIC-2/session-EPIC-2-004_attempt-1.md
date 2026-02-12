---
task_id: "EPIC-2-004"
outcome: "SUCCESS"
timestamp: "2026-02-12T20:15:00Z"
changelog_entry: "Implemented GET /api/session-detail/:projectName/:sessionId endpoint that returns full message-level breakdown for a single session with individual message costs"
files_modified:
  - server/scanner.ts
  - server/index.ts
  - server/test-epic-2-004.ts
tests_run: 1
tests_passed: 1
build_successful: true
---

## Implementation Summary

Successfully implemented the GET /api/session-detail/:projectName/:sessionId endpoint that returns complete message-level breakdown for a single session. The endpoint:

- Returns SessionDetail with complete messages array
- Each message includes messageId, timestamp, role, usage, cost, isSidechain
- Calculates individual message costs using the cost calculator utility
- Efficiently scans project files to find the target session by sessionId
- Returns 404 if project or session not found
- Handles edge cases like empty parameters and invalid session IDs

## Files Changed

### server/scanner.ts
- Added `SessionMessage` interface for individual message data with cost
- Added `SessionDetail` interface extending Session with messages array
- Added `SessionDetailResult` and `SessionDetailNotFoundResult` type interfaces
- Added `SessionDetailScanResult` union type
- Implemented `getSessionDetail()` function to retrieve full session detail
- Function iterates through project JSONL files to find matching session
- Calculates individual message costs and aggregates session statistics
- Reuses existing parsing and cost calculation utilities for consistency

### server/index.ts
- Added new route: `GET /api/session-detail/:projectName/:sessionId`
- Imports `getSessionDetail` from scanner.ts
- Returns 400 for invalid/empty project names or session IDs
- Returns 404 when project or session is not found
- Returns 200 with sessionDetail object containing all messages on success
- Updated server startup message to include new endpoint

### server/test-epic-2-004.ts
- Created comprehensive test file to verify implementation
- Tests session detail retrieval with real project data
- Validates response structure matches acceptance criteria
- Verifies all required fields are present in messages
- Tests cost calculation accuracy
- Tests error handling for non-existent sessions
- Includes performance validation for response time

## Key Decisions

1. **Session Lookup Strategy**: Implemented sequential file scanning to find the target session by sessionId. While this has O(n) complexity, it avoids needing to maintain a session-to-file mapping. For typical project sizes (dozens of sessions), this provides acceptable performance.

2. **Cost Calculation Per Message**: Used the existing `calculateMessageCost()` utility to calculate individual message costs, ensuring consistency with session and project-level cost aggregations.

3. **Type Safety**: Created explicit TypeScript interfaces (`SessionMessage`, `SessionDetail`) to ensure type safety and clear data contracts between the scanner and API layer.

4. **Error Handling**: Maintained consistent error response format with descriptive messages for different failure scenarios (project not found, session not found, invalid parameters).

5. **Data Reuse**: The function recalculates session statistics (totalCost, sidechainPercentage, etc.) from the parsed messages to ensure data consistency, even though this duplicates some work done during the project scan.

## Test Coverage

- ✅ Returns SessionDetail with complete messages array
- ✅ Each message includes all required fields: messageId, timestamp, role, usage, cost, isSidechain
- ✅ Individual message costs calculated using cost calculator utility
- ✅ Session statistics (totalCost, sidechainCount, etc.) match aggregated message data
- ✅ Returns 404 with descriptive error when project not found
- ✅ Returns 404 with descriptive error when session not found
- ✅ Returns 400 when projectName parameter is empty or missing
- ✅ Returns 400 when sessionId parameter is empty or missing
- ✅ Response includes all session metadata (filename, sessionId, messageCount, totalTokens, timestamp range)
- ✅ Build completes successfully with no TypeScript errors
- ✅ All acceptance criteria from tasks.yaml satisfied
