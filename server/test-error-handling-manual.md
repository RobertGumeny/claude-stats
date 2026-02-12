# Manual Test Plan for EPIC-2-006: Error Handling Layer

## Test Overview
This document outlines manual testing procedures to verify the error handling implementation meets all acceptance criteria.

## Acceptance Criteria
1. ✅ All endpoints return consistent error format (status, message, details)
2. ✅ Corrupted JSONL files logged but don't crash server
3. ✅ File read errors return 500 with helpful message
4. ✅ Invalid route parameters return 400 with validation details

## Test Cases

### Test 1: Consistent Error Response Format

**Test Steps:**
1. Start the server: `npm run server`
2. Test various error scenarios using curl or Postman
3. Verify all error responses follow the same format

**Expected Format:**
```json
{
  "status": <number>,
  "message": "<error message>",
  "details": "<optional details>",
  "timestamp": "<ISO timestamp>"
}
```

**Test Requests:**

#### 1a. 404 - Invalid Route
```bash
curl http://localhost:3001/api/invalid-route
```
Expected: 404 with consistent error format

#### 1b. 400 - Missing Project Name
```bash
curl http://localhost:3001/api/sessions/
```
Expected: 404 (route not found) or appropriate error

#### 1c. 400 - Empty Project Name
```bash
curl http://localhost:3001/api/sessions/%20
```
Expected: 400 with validation error

#### 1d. 404 - Project Not Found
```bash
curl http://localhost:3001/api/sessions/nonexistent-project-xyz
```
Expected: 404 with project not found error

#### 1e. 404 - Session Not Found
```bash
curl http://localhost:3001/api/session-detail/valid-project/invalid-session-id
```
Expected: 404 with session not found error

---

### Test 2: Corrupted JSONL File Handling

**Test Steps:**
1. Create a test project directory with corrupted JSONL files
2. Add various types of corruption:
   - Malformed JSON (missing braces, invalid syntax)
   - Missing required fields
   - Empty lines
   - Partial lines
3. Start server and scan projects
4. Verify server logs show warnings but doesn't crash
5. Verify valid messages are still processed

**Test Setup:**
```bash
# Create test directory
mkdir -p ~/.claude/projects/test-corrupted-session

# Create a corrupted JSONL file
cat > ~/.claude/projects/test-corrupted-session/corrupted.jsonl << 'EOF'
{"timestamp": "2026-02-12T12:00:00.000Z", "message": {"id": "msg_001", "role": "user", "usage": {"input_tokens": 100, "output_tokens": 0}}}
{invalid json here
{"timestamp": "2026-02-12T12:00:01.000Z", "message": {"id": "msg_002", "role": "assistant", "usage": {"input_tokens": 50, "output_tokens": 200}}}

{"timestamp": "2026-02-12T12:00:02.000Z"}
{"timestamp": "2026-02-12T12:00:03.000Z", "message": {"id": "msg_003", "role": "assistant", "usage": {"input_tokens": 50, "output_tokens": 100}}}
EOF
```

**Expected Behavior:**
- Server logs warnings for corrupted lines
- Valid messages (msg_001, msg_002, msg_003) are processed
- Session appears in API response with 3 messages
- No server crash

**Verification:**
```bash
curl http://localhost:3001/api/projects
```
Should see test-corrupted-session with some valid sessions

---

### Test 3: File Read Errors

**Test Steps:**
1. Test with non-existent Claude projects directory
2. Test with permission denied scenarios (if possible)
3. Verify helpful error messages

**Test 3a: Missing Projects Directory**
```bash
# Temporarily rename the projects directory
mv ~/.claude/projects ~/.claude/projects.backup

# Start server and test
npm run server

# In another terminal:
curl http://localhost:3001/api/projects

# Restore directory
mv ~/.claude/projects.backup ~/.claude/projects
```

**Expected Response:**
- Status: 500
- Message: Clear explanation that projects directory not found
- Details: Path to expected directory

---

### Test 4: Invalid Route Parameters

**Test Steps:**
1. Test all endpoints with invalid parameters
2. Verify validation error responses

**Test 4a: Empty Session ID**
```bash
curl http://localhost:3001/api/session-detail/some-project/
```
Expected: 404 (route not found)

**Test 4b: Whitespace-only parameters**
```bash
curl "http://localhost:3001/api/sessions/%20%20%20"
```
Expected: 400 with validation error

---

### Test 5: Server Logging

**Test Steps:**
1. Monitor server console output during all operations
2. Verify logs include:
   - INFO messages for successful operations
   - WARN messages for corrupted files
   - ERROR messages for failures
   - Timestamps and context data

**Expected Log Format:**
```
[INFO] <timestamp> <message> {...context}
[WARN] <timestamp> <message> {...context}
[ERROR] <timestamp> <message> {...error, ...context}
```

---

### Test 6: Graceful Degradation

**Test Steps:**
1. Create a project with mix of valid and invalid session files
2. Verify API returns partial data (valid sessions only)
3. Verify no crashes or incomplete responses

**Expected Behavior:**
- Invalid files are skipped
- Valid files are processed
- API returns complete response with available data
- Warnings logged but not exposed to API consumer

---

## Success Criteria

All tests pass if:
- ✅ All error responses use consistent format
- ✅ Server never crashes due to corrupted files
- ✅ Error messages are helpful and include relevant details
- ✅ Validation errors provide clear indication of what went wrong
- ✅ Logs provide sufficient information for debugging
- ✅ Valid data is processed even when some files are corrupted

---

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1a. 404 Invalid Route | ⏸️ Pending | |
| 1b. Missing Project Name | ⏸️ Pending | |
| 1c. Empty Project Name | ⏸️ Pending | |
| 1d. Project Not Found | ⏸️ Pending | |
| 1e. Session Not Found | ⏸️ Pending | |
| 2. Corrupted JSONL Files | ⏸️ Pending | |
| 3. File Read Errors | ⏸️ Pending | |
| 4. Invalid Parameters | ⏸️ Pending | |
| 5. Server Logging | ⏸️ Pending | |
| 6. Graceful Degradation | ⏸️ Pending | |

---

## Notes

- All tests should be run with the server in development mode
- Check server console for log output
- Verify error responses match the expected format
- Document any deviations from expected behavior
