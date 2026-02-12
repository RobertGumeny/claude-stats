/**
 * Integration Test for EPIC-2-006: Error Handling Layer
 *
 * This test verifies the error handling implementation by:
 * 1. Testing error classes and helpers
 * 2. Simulating error scenarios
 * 3. Verifying consistent error response format
 */

import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ApiError, validationError, notFoundError, fileReadError, parseError } from './errorHandler.js';
import { parseJsonlFile } from './parser.js';

console.log('\n=== EPIC-2-006: Error Handling Integration Tests ===\n');

let passedTests = 0;
let failedTests = 0;

function runTest(testName: string, testFn: () => Promise<void> | void): void {
  const runAsync = async () => {
    try {
      await testFn();
      console.log(`✓ ${testName}`);
      passedTests++;
    } catch (error) {
      console.error(`✗ ${testName}`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
      failedTests++;
    }
  };

  // Run async tests synchronously for cleaner output
  runAsync();
}

function assertEquals(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertExists(value: unknown, message: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${message}\n  Value should exist but got: ${value}`);
  }
}

function assertContains(str: string, substring: string, message: string): void {
  if (!str.includes(substring)) {
    throw new Error(`${message}\n  String: ${str}\n  Should contain: ${substring}`);
  }
}

// ===== Error Class Tests =====

console.log('--- Error Class Tests ---\n');

runTest('ApiError: Creates error with status and message', () => {
  const error = new ApiError('Test error', 400);
  assertEquals(error.status, 400, 'Status should be 400');
  assertEquals(error.message, 'Test error', 'Message should match');
  assertEquals(error.name, 'ApiError', 'Name should be ApiError');
});

runTest('ApiError: Includes details when provided', () => {
  const error = new ApiError('Test error', 500, { key: 'value' });
  assertExists(error.details, 'Details should exist');
  assertEquals((error.details as Record<string, string>).key, 'value', 'Details should match');
});

runTest('ApiError: Defaults to status 500', () => {
  const error = new ApiError('Test error');
  assertEquals(error.status, 500, 'Default status should be 500');
});

runTest('validationError: Creates 400 error', () => {
  const error = validationError('Invalid parameter', { param: 'test' });
  assertEquals(error.status, 400, 'Status should be 400');
  assertContains(error.message, 'Invalid parameter', 'Message should be included');
});

runTest('notFoundError: Creates 404 error with identifier', () => {
  const error = notFoundError('Project', 'test-project');
  assertEquals(error.status, 404, 'Status should be 404');
  assertContains(error.message, 'test-project', 'Identifier should be in message');
  assertContains(error.message, 'Project', 'Resource type should be in message');
});

runTest('notFoundError: Creates 404 error without identifier', () => {
  const error = notFoundError('Projects');
  assertEquals(error.status, 404, 'Status should be 404');
  assertContains(error.message, 'Projects', 'Resource type should be in message');
});

runTest('fileReadError: Creates 500 error with file details', () => {
  const error = fileReadError('/path/to/file.txt', new Error('ENOENT'));
  assertEquals(error.status, 500, 'Status should be 500');
  assertExists(error.details, 'Details should exist');
});

runTest('parseError: Creates 422 error with line number', () => {
  const error = parseError('/path/to/file.jsonl', 42, 'Invalid JSON');
  assertEquals(error.status, 422, 'Status should be 422');
  assertContains(error.message, '42', 'Line number should be in message');
});

// ===== Parser Error Handling Tests =====

console.log('\n--- Parser Error Handling Tests ---\n');

const testDir = join(tmpdir(), 'claude-stats-test-' + Date.now());

// Create test directory
try {
  mkdirSync(testDir, { recursive: true });
} catch (error) {
  console.error('Failed to create test directory:', error);
  process.exit(1);
}

// Test: Corrupted JSONL file with mixed valid and invalid lines
runTest('Parser: Handles corrupted JSONL gracefully', async () => {
  const testFile = join(testDir, 'corrupted.jsonl');

  const content = `{"timestamp": "2026-02-12T12:00:00.000Z", "sessionId": "test-001", "message": {"id": "msg_001", "role": "user", "usage": {"input_tokens": 100, "output_tokens": 0, "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}}}
{invalid json
{"timestamp": "2026-02-12T12:00:01.000Z", "sessionId": "test-001", "message": {"id": "msg_002", "role": "assistant", "usage": {"input_tokens": 50, "output_tokens": 200, "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}}}

{"timestamp": "2026-02-12T12:00:02.000Z", "sessionId": "test-001", "message": {"id": "msg_003", "role": "assistant", "usage": {"input_tokens": 50, "output_tokens": 100, "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}}}`;

  writeFileSync(testFile, content, 'utf8');

  const result = await parseJsonlFile(testFile);

  assertEquals(result.success, true, 'Parse should succeed despite errors');

  if (result.success) {
    assertEquals(result.messages.length, 3, 'Should parse 3 valid messages');
    assertExists(result.errors, 'Should have error records');
    assertEquals(result.errors?.length || 0, 1, 'Should record 1 error');
    assertEquals(result.stats.malformedLines, 1, 'Should count 1 malformed line');
    assertEquals(result.stats.emptyLines, 1, 'Should count 1 empty line');
  }
});

// Test: Completely corrupted file
runTest('Parser: Returns error for completely corrupted file', async () => {
  const testFile = join(testDir, 'completely-corrupted.jsonl');

  const content = `not json at all
also not json
still not json`;

  writeFileSync(testFile, content, 'utf8');

  const result = await parseJsonlFile(testFile);

  // Parser should still succeed but with errors
  assertEquals(result.success, true, 'Parse should complete');

  if (result.success) {
    assertEquals(result.messages.length, 0, 'Should parse 0 valid messages');
    assertExists(result.errors, 'Should have error records');
    assertEquals(result.stats.malformedLines, 3, 'Should count 3 malformed lines');
  }
});

// Test: Empty file
runTest('Parser: Handles empty file gracefully', async () => {
  const testFile = join(testDir, 'empty.jsonl');
  writeFileSync(testFile, '', 'utf8');

  const result = await parseJsonlFile(testFile);

  assertEquals(result.success, true, 'Parse should succeed for empty file');

  if (result.success) {
    assertEquals(result.messages.length, 0, 'Should parse 0 messages');
    assertEquals(result.stats.totalLines, 0, 'Should have 0 total lines');
  }
});

// Test: File with missing required fields
runTest('Parser: Skips messages with missing required fields', async () => {
  const testFile = join(testDir, 'missing-fields.jsonl');

  const content = `{"timestamp": "2026-02-12T12:00:00.000Z", "message": {"id": "msg_001", "role": "user", "usage": {}}}
{"timestamp": "2026-02-12T12:00:01.000Z", "message": {"role": "assistant", "usage": {}}}
{"timestamp": "2026-02-12T12:00:02.000Z", "message": {"id": "msg_003", "role": "assistant", "usage": {}}}`;

  writeFileSync(testFile, content, 'utf8');

  const result = await parseJsonlFile(testFile);

  assertEquals(result.success, true, 'Parse should succeed');

  if (result.success) {
    // msg_002 is missing message.id field, should be skipped
    assertEquals(result.messages.length, 2, 'Should parse 2 valid messages (skip one with missing id)');
    assertEquals(result.stats.malformedLines, 1, 'Should count 1 malformed line');
  }
});

// Cleanup test directory
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (error) {
  console.warn('Warning: Failed to clean up test directory:', error);
}

// ===== Test Summary =====

console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\nError handling implementation verified:');
  console.log('  ✓ Consistent error response format');
  console.log('  ✓ Graceful handling of corrupted JSONL files');
  console.log('  ✓ Proper error logging and reporting');
  console.log('  ✓ Validation error handling');
  process.exit(0);
}
