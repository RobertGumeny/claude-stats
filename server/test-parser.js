import { parseJsonlFile, parseJsonlFileSimple, parseMultipleFiles } from './parser.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Create a temporary test JSONL file
 */
async function createTestJsonlFile() {
  const testDir = join(tmpdir(), 'claude-stats-test');
  await mkdir(testDir, { recursive: true });

  const testFile = join(testDir, 'test-session.jsonl');

  // Create test data with various scenarios
  const testLines = [
    // Valid message 1 - Complete data
    JSON.stringify({
      parentUuid: "ec625a62-801f-4a31-8949-93fcccc34556",
      isSidechain: true,
      userType: "external",
      cwd: "C:\\source\\test",
      sessionId: "14d75d9b-0b75-4fa9-acf5-dd86098f4513",
      version: "2.1.39",
      gitBranch: "feature/test",
      agentId: "a76ef17",
      slug: "test-crayon",
      message: {
        model: "claude-sonnet-4-5-20250929",
        id: "msg_0164zsTmFX94HAqLVBzTZ2xz",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Test response message" }],
        usage: {
          input_tokens: 5,
          cache_creation_input_tokens: 466,
          cache_read_input_tokens: 22661,
          output_tokens: 6
        }
      },
      timestamp: "2026-02-11T21:05:55.505Z"
    }),

    // Valid message 2 - User message
    JSON.stringify({
      sessionId: "14d75d9b-0b75-4fa9-acf5-dd86098f4513",
      isSidechain: false,
      message: {
        model: "claude-sonnet-4-5-20250929",
        id: "msg_user_001",
        type: "message",
        role: "user",
        content: [{ type: "text", text: "User question here" }],
        usage: {
          input_tokens: 100,
          output_tokens: 0
        }
      },
      timestamp: "2026-02-11T21:05:45.000Z"
    }),

    // Empty line (should be skipped)
    "",

    // Malformed JSON (missing closing brace)
    '{"sessionId": "test", "message": {"id": "bad"',

    // Valid message 3 - Missing some optional fields
    JSON.stringify({
      sessionId: "14d75d9b-0b75-4fa9-acf5-dd86098f4513",
      message: {
        id: "msg_minimal_001",
        role: "assistant",
        model: "claude-sonnet-4-5-20250929",
        content: "Simple string content",
        usage: {
          input_tokens: 50
          // Missing other token fields - should default to 0
        }
      },
      timestamp: "2026-02-11T21:06:00.000Z"
    }),

    // Whitespace line (should be skipped)
    "   ",

    // Valid message 4 - Main thread message
    JSON.stringify({
      sessionId: "14d75d9b-0b75-4fa9-acf5-dd86098f4513",
      isSidechain: false,
      message: {
        id: "msg_main_001",
        role: "assistant",
        model: "claude-sonnet-4-5-20250929",
        content: [
          { type: "text", text: "First block" },
          { type: "text", text: "Second block" }
        ],
        usage: {
          input_tokens: 1000,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 5000,
          output_tokens: 200
        }
      },
      timestamp: "2026-02-11T21:06:10.000Z"
    })
  ];

  await writeFile(testFile, testLines.join('\n'), 'utf8');
  return testFile;
}

/**
 * Run parser tests
 */
async function runTests() {
  console.log('🧪 Testing JSONL Parser\n');
  console.log('=' .repeat(60));

  try {
    // Create test file
    console.log('\n📝 Creating test JSONL file...');
    const testFile = await createTestJsonlFile();
    console.log(`✅ Created: ${testFile}`);

    // Test 1: Parse with full details
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: parseJsonlFile (with error details)');
    console.log('='.repeat(60));

    const result = await parseJsonlFile(testFile);

    console.log(`\n✅ Success: ${result.success}`);
    console.log(`📊 Stats:`);
    console.log(`   Total lines: ${result.stats.totalLines}`);
    console.log(`   Empty lines: ${result.stats.emptyLines}`);
    console.log(`   Malformed lines: ${result.stats.malformedLines}`);
    console.log(`   Successful lines: ${result.stats.successfulLines}`);

    if (result.messages) {
      console.log(`\n📬 Parsed ${result.messages.length} messages:`);
      result.messages.forEach((msg, idx) => {
        console.log(`\n   Message ${idx + 1}:`);
        console.log(`   - ID: ${msg.messageId}`);
        console.log(`   - Role: ${msg.role}`);
        console.log(`   - Model: ${msg.model}`);
        console.log(`   - Sidechain: ${msg.isSidechain}`);
        console.log(`   - Timestamp: ${msg.timestamp}`);
        console.log(`   - Tokens: ${msg.usage.input_tokens} in, ${msg.usage.output_tokens} out`);
        console.log(`   - Cache: ${msg.usage.cache_read_input_tokens} read, ${msg.usage.cache_creation_input_tokens} write`);
        if (msg.content) {
          const preview = msg.content.substring(0, 50);
          console.log(`   - Content: ${preview}${msg.content.length > 50 ? '...' : ''}`);
        }
      });
    }

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Parse errors (${result.errors.length}):`);
      result.errors.forEach((err, idx) => {
        console.log(`\n   Error ${idx + 1}:`);
        console.log(`   - Line: ${err.lineNumber}`);
        console.log(`   - Message: ${err.error}`);
        console.log(`   - Content: ${err.line}...`);
      });
    }

    // Test 2: Simple parse (messages only)
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: parseJsonlFileSimple (messages only)');
    console.log('='.repeat(60));

    const messages = await parseJsonlFileSimple(testFile);
    console.log(`\n✅ Parsed ${messages.length} valid messages`);

    // Test acceptance criteria
    console.log('\n' + '='.repeat(60));
    console.log('Acceptance Criteria Validation');
    console.log('='.repeat(60));

    const checks = [
      {
        name: 'Parses valid JSONL files correctly',
        pass: result.success && result.messages.length >= 4
      },
      {
        name: 'Skips malformed JSON lines without crashing',
        pass: result.stats.malformedLines === 1 && result.errors.length === 1
      },
      {
        name: 'Extracts required fields (messageId, timestamp, role, model, usage)',
        pass: result.messages.every(m =>
          m.messageId && m.timestamp && m.role && m.model && m.usage
        )
      },
      {
        name: 'Returns parse errors with line numbers',
        pass: result.errors && result.errors.every(e => e.lineNumber && e.error)
      },
      {
        name: 'Handles missing token fields (defaults to 0)',
        pass: result.messages.some(m =>
          m.usage.cache_creation_input_tokens === 0 &&
          m.usage.output_tokens === 0
        )
      },
      {
        name: 'Extracts isSidechain field correctly',
        pass: result.messages.some(m => m.isSidechain === true) &&
              result.messages.some(m => m.isSidechain === false)
      }
    ];

    console.log('');
    let allPassed = true;
    checks.forEach(check => {
      const status = check.pass ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!check.pass) allPassed = false;
    });

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 All acceptance criteria passed!');
    } else {
      console.log('⚠️  Some acceptance criteria failed');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
