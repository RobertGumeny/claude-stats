/**
 * Test script for EPIC-2-004: GET /api/session-detail/:projectName/:sessionId endpoint
 *
 * This script validates that:
 * 1. The endpoint returns full message-level breakdown for a session
 * 2. Each message includes messageId, timestamp, role, usage, cost, isSidechain
 * 3. Individual message costs are calculated correctly
 * 4. Response time is acceptable (<1s for sessions with 100 messages)
 */

import { getSessionDetail } from './scanner.js';

async function testGetSessionDetail() {
  console.log('='.repeat(80));
  console.log('EPIC-2-004 Test: GET /api/session-detail/:projectName/:sessionId');
  console.log('='.repeat(80));
  console.log();

  // Test 1: Find a project and session to test with
  console.log('Test 1: Finding a valid project and session...');
  const { scanAllProjects } = await import('./scanner.js');
  const scanResult = await scanAllProjects();

  if (!scanResult.success || scanResult.projects.length === 0) {
    console.error('❌ No projects found to test with');
    console.log('Please ensure you have Claude Code session logs in ~/.claude/projects/');
    return;
  }

  // Get first project with sessions
  const project = scanResult.projects[0];
  console.log(`✅ Found project: ${project.name}`);
  console.log(`   Sessions available: ${project.sessions.length}`);

  if (project.sessions.length === 0) {
    console.error('❌ No sessions found in the project');
    return;
  }

  // Get first session
  const session = project.sessions[0];
  console.log(`✅ Using session: ${session.sessionId}`);
  console.log(`   Message count: ${session.messageCount}`);
  console.log(`   Total cost: $${session.totalCost.toFixed(4)}`);
  console.log();

  // Test 2: Retrieve session detail
  console.log('Test 2: Retrieving session detail...');
  const startTime = Date.now();
  const result = await getSessionDetail(project.name, session.sessionId);
  const duration = Date.now() - startTime;

  if (!result.success) {
    console.error(`❌ Failed to retrieve session detail: ${result.error}`);
    return;
  }

  console.log(`✅ Retrieved session detail in ${duration}ms`);
  console.log();

  // Test 3: Validate response structure
  console.log('Test 3: Validating response structure...');
  const detail = result.sessionDetail;

  // Check basic fields
  if (!detail.sessionId) {
    console.error('❌ Missing sessionId field');
    return;
  }
  console.log(`✅ Session ID: ${detail.sessionId}`);

  if (!detail.messages || !Array.isArray(detail.messages)) {
    console.error('❌ Missing or invalid messages array');
    return;
  }
  console.log(`✅ Messages array present with ${detail.messages.length} messages`);

  // Check first message structure
  if (detail.messages.length > 0) {
    const firstMsg = detail.messages[0];
    const requiredFields = ['messageId', 'timestamp', 'role', 'usage', 'cost', 'isSidechain'];
    const missingFields = requiredFields.filter(field => !(field in firstMsg));

    if (missingFields.length > 0) {
      console.error(`❌ First message missing fields: ${missingFields.join(', ')}`);
      return;
    }
    console.log('✅ All required message fields present');

    // Validate usage object structure
    const usageFields = ['input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'output_tokens'];
    const missingUsageFields = usageFields.filter(field => !(field in firstMsg.usage));

    if (missingUsageFields.length > 0) {
      console.error(`❌ Message usage missing fields: ${missingUsageFields.join(', ')}`);
      return;
    }
    console.log('✅ All required usage fields present');

    // Validate cost is a number
    if (typeof firstMsg.cost !== 'number' || firstMsg.cost < 0) {
      console.error(`❌ Invalid cost value: ${firstMsg.cost}`);
      return;
    }
    console.log(`✅ Cost is valid number: $${firstMsg.cost.toFixed(4)}`);
  }
  console.log();

  // Test 4: Validate message costs sum matches total
  console.log('Test 4: Validating cost calculations...');
  const calculatedTotal = detail.messages.reduce((sum, msg) => sum + msg.cost, 0);
  const roundedCalculated = Math.round(calculatedTotal * 10000) / 10000;

  if (Math.abs(roundedCalculated - detail.totalCost) > 0.0001) {
    console.error(`❌ Cost mismatch: Sum of messages ($${roundedCalculated.toFixed(4)}) != Total cost ($${detail.totalCost.toFixed(4)})`);
    return;
  }
  console.log(`✅ Cost calculation verified: $${detail.totalCost.toFixed(4)}`);
  console.log();

  // Test 5: Performance validation
  console.log('Test 5: Validating performance...');
  console.log(`   Response time: ${duration}ms`);
  console.log(`   Message count: ${detail.messages.length}`);

  if (detail.messages.length <= 100 && duration > 1000) {
    console.warn(`⚠️  Response time (${duration}ms) exceeds target (<1000ms) for ${detail.messages.length} messages`);
  } else {
    console.log('✅ Performance acceptable');
  }
  console.log();

  // Test 6: Sample message details
  console.log('Test 6: Sample message data...');
  const sampleSize = Math.min(3, detail.messages.length);
  console.log(`Showing first ${sampleSize} messages:`);
  console.log();

  for (let i = 0; i < sampleSize; i++) {
    const msg = detail.messages[i];
    console.log(`Message ${i + 1}:`);
    console.log(`  ID: ${msg.messageId}`);
    console.log(`  Timestamp: ${msg.timestamp}`);
    console.log(`  Role: ${msg.role}`);
    console.log(`  Sidechain: ${msg.isSidechain}`);
    console.log(`  Tokens: in=${msg.usage.input_tokens}, cache_write=${msg.usage.cache_creation_input_tokens}, cache_read=${msg.usage.cache_read_input_tokens}, out=${msg.usage.output_tokens}`);
    console.log(`  Cost: $${msg.cost.toFixed(4)}`);
    console.log();
  }

  // Test 7: Test error handling - non-existent session
  console.log('Test 7: Testing error handling...');
  const invalidResult = await getSessionDetail(project.name, 'non-existent-session-id-12345');

  if (invalidResult.success) {
    console.error('❌ Should have returned error for non-existent session');
    return;
  }
  console.log(`✅ Correctly returned error: ${invalidResult.error}`);
  console.log();

  // Final summary
  console.log('='.repeat(80));
  console.log('✅ ALL TESTS PASSED');
  console.log('='.repeat(80));
  console.log();
  console.log('Summary:');
  console.log(`  - Project: ${project.name}`);
  console.log(`  - Session ID: ${session.sessionId}`);
  console.log(`  - Messages: ${detail.messages.length}`);
  console.log(`  - Total Cost: $${detail.totalCost.toFixed(4)}`);
  console.log(`  - Sidechain: ${detail.sidechainPercentage}% (${detail.sidechainCount} messages)`);
  console.log(`  - Response Time: ${duration}ms`);
  console.log();
}

// Run the test
testGetSessionDetail().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
