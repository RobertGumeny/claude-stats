# JSONL Parser Module

Robust line-by-line parser for Claude Code session JSONL files with comprehensive error handling.

## Features

- ✅ **Line-by-line streaming** - Efficient memory usage even for large files
- ✅ **Graceful error handling** - Skips malformed JSON without crashing
- ✅ **Detailed error reporting** - Returns line numbers and error descriptions
- ✅ **Field extraction** - Extracts all required message fields per PRD spec
- ✅ **Default values** - Missing token fields default to 0
- ✅ **Content parsing** - Handles both string and array content formats

## API

### `parseJsonlFile(filePath)`

Parse a complete JSONL file with detailed error reporting.

**Parameters:**
- `filePath` (string) - Absolute path to .jsonl file

**Returns:** `Promise<Object>`

```javascript
{
  success: boolean,
  messages: Array<Message>,      // Parsed message objects
  errors: Array<ParseError>,     // Parse errors with line numbers (if any)
  stats: {
    totalLines: number,
    emptyLines: number,
    malformedLines: number,
    successfulLines: number,
    filePath: string
  }
}
```

**Example:**

```typescript
import { parseJsonlFile } from './parser.js';

const result = await parseJsonlFile('/path/to/session.jsonl');

if (result.success) {
  console.log(`Parsed ${result.messages.length} messages`);

  if (result.errors) {
    console.warn(`Found ${result.errors.length} malformed lines`);
    result.errors.forEach(err => {
      console.log(`Line ${err.lineNumber}: ${err.error}`);
    });
  }
}
```

### `parseJsonlFileSimple(filePath)`

Convenience function that returns only the messages array.

**Parameters:**
- `filePath` (string) - Absolute path to .jsonl file

**Returns:** `Promise<Array<Message>>`

**Example:**

```typescript
import { parseJsonlFileSimple } from './parser.js';

const messages = await parseJsonlFileSimple('/path/to/session.jsonl');
console.log(`Got ${messages.length} messages`);
```

### `parseMultipleFiles(filePaths)`

Parse multiple JSONL files in parallel.

**Parameters:**
- `filePaths` (Array<string>) - Array of absolute paths

**Returns:** `Promise<Array<Object>>` - Array of parse results

**Example:**

```typescript
import { parseMultipleFiles } from './parser.js';

const files = [
  '/path/to/session1.jsonl',
  '/path/to/session2.jsonl'
];

const results = await parseMultipleFiles(files);
results.forEach((result, idx) => {
  console.log(`File ${idx + 1}: ${result.messages.length} messages`);
});
```

## Message Object Structure

Extracted message fields (as per PRD specification):

```typescript
interface Message {
  // Required fields
  messageId: string;              // message.id
  timestamp: string;              // ISO timestamp
  isSidechain: boolean;           // true for sub-agent calls
  role: "user" | "assistant";     // message.role
  model: string;                  // e.g., "claude-sonnet-4-5-20250929"

  // Token usage (defaults to 0 if missing)
  usage: {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
  };

  // Optional fields
  content?: string;               // Extracted text content
  sessionId?: string;             // Session UUID
  agentId?: string;              // Agent identifier
  parentUuid?: string;           // Parent message UUID
}
```

## Error Handling

The parser is designed to be robust:

### Gracefully Handles

1. **Empty lines** - Skipped silently
2. **Malformed JSON** - Logged as error with line number, parsing continues
3. **Missing optional fields** - Uses sensible defaults
4. **Missing token counts** - Defaults to 0
5. **Different content formats** - Handles both string and array
6. **File read errors** - Returns error in result object

### Error Object Structure

```javascript
{
  lineNumber: number,          // 1-indexed line number
  error: string,              // Error description
  line: string               // First 100 chars of problematic line
}
```

## Performance

- **Streaming parsing** - Uses Node.js readline for line-by-line processing
- **Memory efficient** - Doesn't load entire file into memory
- **Fast** - Typical session file (<1000 messages) parses in <100ms

## Testing

Run the comprehensive test suite:

```bash
npm run test:parser
```

The test suite validates:
- ✅ Valid JSONL parsing
- ✅ Malformed JSON handling
- ✅ Empty line skipping
- ✅ Field extraction
- ✅ Default value handling
- ✅ Error reporting with line numbers
- ✅ Sidechain detection
- ✅ Content extraction from arrays

## Integration Example

Using the parser with the scanner:

```typescript
import { scanAllProjects } from './scanner.js';
import { parseJsonlFile } from './parser.js';

// Scan all projects
const { projects } = await scanAllProjects();

// Parse first session of first project
const firstProject = projects[0];
const firstSession = firstProject.sessionFiles[0];

const result = await parseJsonlFile(firstSession.path);
console.log(`Parsed ${result.messages.length} messages`);

// Calculate total tokens
const totalTokens = result.messages.reduce((sum, msg) => {
  return sum +
    msg.usage.input_tokens +
    msg.usage.cache_creation_input_tokens +
    msg.usage.cache_read_input_tokens +
    msg.usage.output_tokens;
}, 0);

console.log(`Total tokens: ${totalTokens.toLocaleString()}`);
```

## Acceptance Criteria ✅

All criteria from EPIC-1-003 are met:

- ✅ Parses valid JSONL files correctly (one JSON object per line)
- ✅ Skips malformed JSON lines and logs warning without crashing
- ✅ Extracts required fields: messageId, timestamp, isSidechain, role, model, usage, content
- ✅ Returns parse errors with line numbers for debugging

## Known Limitations

1. **Cache tier detection** - Currently assumes 5-minute cache tier (future enhancement)
2. **Content size** - Very large message content (>100MB) may impact memory
3. **File encoding** - Assumes UTF-8 encoding

## Future Enhancements

- [ ] Cache tier heuristics (5-minute vs 1-hour detection)
- [ ] Progress callbacks for large files
- [ ] Validation against message schema
- [ ] Support for streaming message processing (generator-based API)
