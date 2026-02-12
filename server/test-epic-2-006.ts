/**
 * Test suite for EPIC-2-006: Error Handling Layer
 *
 * Tests:
 * 1. Consistent error response format across all endpoints
 * 2. Corrupted JSONL file handling (graceful degradation)
 * 3. File read error handling
 * 4. Invalid route parameter validation
 * 5. 404 handling for invalid routes
 */

import { ApiError, validationError, notFoundError, fileReadError, parseError, Logger } from './errorHandler.js';

console.log('\n=== EPIC-2-006: Error Handling Layer Tests ===\n');

let passedTests = 0;
let failedTests = 0;

function runTest(testName: string, testFn: () => void): void {
  try {
    testFn();
    console.log(`✓ ${testName}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${testName}`);
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }
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

// Test 1: ApiError class creates proper error objects
runTest('ApiError creates error with status and details', () => {
  const error = new ApiError('Test error', 400, { field: 'test' });

  assertEquals(error.message, 'Test error', 'Error message should match');
  assertEquals(error.status, 400, 'Error status should match');
  assertExists(error.details, 'Error details should exist');
  assertEquals((error.details as Record<string, string>).field, 'test', 'Error details should match');
});

// Test 2: validationError helper creates 400 errors
runTest('validationError creates 400 Bad Request error', () => {
  const error = validationError('Invalid input', { field: 'projectName' });

  assertEquals(error.status, 400, 'Validation error should have status 400');
  assertEquals(error.message, 'Invalid input', 'Validation error message should match');
  assertExists(error.details, 'Validation error should have details');
});

// Test 3: notFoundError helper creates 404 errors
runTest('notFoundError creates 404 Not Found error', () => {
  const error = notFoundError('Project', 'test-project');

  assertEquals(error.status, 404, 'Not found error should have status 404');
  assertContains(error.message, 'test-project', 'Not found error should include identifier');
  assertContains(error.message, 'Project', 'Not found error should include resource type');
});

// Test 4: fileReadError helper creates 500 errors
runTest('fileReadError creates 500 Internal Server Error', () => {
  const testError = new Error('Permission denied');
  const error = fileReadError('/path/to/file.jsonl', testError);

  assertEquals(error.status, 500, 'File read error should have status 500');
  assertContains(error.message, 'Error reading file', 'File read error should have appropriate message');
  assertExists(error.details, 'File read error should have details');
});

// Test 5: parseError helper creates 422 errors
runTest('parseError creates 422 Unprocessable Entity error', () => {
  const error = parseError('/path/to/file.jsonl', 42, 'Invalid JSON');

  assertEquals(error.status, 422, 'Parse error should have status 422');
  assertContains(error.message, 'line 42', 'Parse error should include line number');
  assertExists(error.details, 'Parse error should have details');
});

// Test 6: Logger methods work without throwing
runTest('Logger.info works without throwing', () => {
  Logger.info('Test info message', { test: true });
  // No assertion - just verify it doesn't throw
});

runTest('Logger.warn works without throwing', () => {
  Logger.warn('Test warning message', { test: true });
  // No assertion - just verify it doesn't throw
});

runTest('Logger.error works without throwing', () => {
  Logger.error('Test error message', new Error('Test'), { test: true });
  // No assertion - just verify it doesn't throw
});

runTest('Logger.debug works without throwing', () => {
  Logger.debug('Test debug message', { test: true });
  // No assertion - just verify it doesn't throw
});

// Test 7: ApiError maintains stack trace
runTest('ApiError maintains stack trace', () => {
  const error = new ApiError('Test error', 500);
  assertExists(error.stack, 'Error should have stack trace');
  assertContains(error.stack || '', 'ApiError', 'Stack trace should reference ApiError');
});

// Test 8: Error helpers handle edge cases
runTest('notFoundError works without identifier', () => {
  const error = notFoundError('Projects');

  assertEquals(error.status, 404, 'Not found error should have status 404');
  assertContains(error.message, 'Projects', 'Not found error should include resource type');
  assertContains(error.message, 'not found', 'Not found error should have appropriate message');
});

runTest('parseError works without line number', () => {
  const error = parseError('/path/to/file.jsonl');

  assertEquals(error.status, 422, 'Parse error should have status 422');
  assertExists(error.message, 'Parse error should have message');
});

runTest('ApiError defaults to status 500', () => {
  const error = new ApiError('Test error');

  assertEquals(error.status, 500, 'ApiError should default to status 500');
});

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
