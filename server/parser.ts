import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * Token usage information for a message
 */
export interface TokenUsage {
  input_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  output_tokens: number;
}

/**
 * Parsed message data from JSONL
 */
export interface MessageData {
  messageId: string;
  timestamp: string;
  isSidechain: boolean;
  role: string;
  model: string;
  usage: TokenUsage;
  content: string | null;
  sessionId?: string;
  agentId?: string;
  parentUuid?: string;
}

/**
 * Content block from Claude API response
 */
interface ContentBlock {
  type: string;
  text?: string;
}

/**
 * Message object from JSONL log entry
 */
interface LogMessage {
  id: string;
  role?: string;
  model?: string;
  content?: ContentBlock[] | string;
  usage?: Partial<TokenUsage>;
}

/**
 * Complete JSONL log entry structure
 */
interface LogEntry {
  timestamp?: string;
  isSidechain?: boolean;
  sessionId?: string;
  agentId?: string;
  parentUuid?: string;
  message?: LogMessage;
}

/**
 * Successful parse result for a single line
 */
interface ParseLineSuccess {
  success: true;
  data: MessageData | null;
}

/**
 * Failed parse result for a single line
 */
interface ParseLineError {
  success: false;
  error: string;
}

/**
 * Union type for parse line results
 */
type ParseLineResult = ParseLineSuccess | ParseLineError;

/**
 * Error information for a failed line
 */
export interface ParseError {
  lineNumber: number;
  error: string;
  line: string;
}

/**
 * Statistics about the parse operation
 */
export interface ParseStats {
  totalLines: number;
  emptyLines: number;
  malformedLines: number;
  successfulLines: number;
  filePath: string;
}

/**
 * Successful file parse result
 */
export interface ParseFileSuccess {
  success: true;
  messages: MessageData[];
  errors?: ParseError[];
  stats: ParseStats;
}

/**
 * Failed file parse result
 */
export interface ParseFileError {
  success: false;
  error: string;
  filePath: string;
}

/**
 * Union type for file parse results
 */
export type ParseFileResult = ParseFileSuccess | ParseFileError;

/**
 * Parse a single JSONL line and extract message data
 * @param line - Raw JSONL line
 * @param lineNumber - Line number for error reporting (1-indexed)
 * @returns Parse result with data or error
 */
function parseLine(line: string, lineNumber: number): ParseLineResult {
  // Skip empty lines
  if (!line.trim()) {
    return { success: true, data: null };
  }

  try {
    const parsed = JSON.parse(line) as LogEntry;

    // Extract required fields according to PRD
    // See PRD Appendix for log entry structure
    const message = parsed.message || {};
    const usage = message.usage || {};

    // Validate that we have the minimum required data
    if (!message.id) {
      return {
        success: false,
        error: `Missing required field 'message.id' at line ${lineNumber}`
      };
    }

    // Extract message data
    const messageData: MessageData = {
      messageId: message.id,
      timestamp: parsed.timestamp || new Date().toISOString(),
      isSidechain: parsed.isSidechain || false,
      role: message.role || 'unknown',
      model: message.model || 'unknown',
      usage: {
        input_tokens: usage.input_tokens || 0,
        cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
        cache_read_input_tokens: usage.cache_read_input_tokens || 0,
        output_tokens: usage.output_tokens || 0
      },
      content: extractContent(message.content),
      // Additional metadata that might be useful
      sessionId: parsed.sessionId,
      agentId: parsed.agentId,
      parentUuid: parsed.parentUuid
    };

    return { success: true, data: messageData };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Malformed JSON at line ${lineNumber}: ${errorMessage}`
    };
  }
}

/**
 * Extract text content from message content array
 * @param content - Message content (can be array of objects or string)
 * @returns Extracted text content or null
 */
function extractContent(content: ContentBlock[] | string | undefined): string | null {
  if (!content) return null;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    // Extract text from content blocks
    const textBlocks = content
      .filter(block => block && block.type === 'text')
      .map(block => block.text)
      .filter((text): text is string => text !== undefined);

    return textBlocks.length > 0 ? textBlocks.join('\n') : null;
  }

  return null;
}

/**
 * Parse a JSONL file line-by-line and extract all messages
 * Handles malformed JSON gracefully by skipping bad lines and logging warnings
 *
 * @param filePath - Absolute path to .jsonl file
 * @returns Promise resolving to parse result with messages or error
 */
export async function parseJsonlFile(filePath: string): Promise<ParseFileResult> {
  return new Promise((resolve) => {
    const messages: MessageData[] = [];
    const errors: ParseError[] = [];
    let lineNumber = 0;
    let totalLines = 0;
    let emptyLines = 0;
    let malformedLines = 0;

    const fileStream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity // Handle both \n and \r\n
    });

    rl.on('line', (line: string) => {
      lineNumber++;
      totalLines++;

      if (!line.trim()) {
        emptyLines++;
        return;
      }

      const result = parseLine(line, lineNumber);

      if (result.success && result.data) {
        messages.push(result.data);
      } else if (!result.success) {
        malformedLines++;
        errors.push({
          lineNumber,
          error: result.error,
          line: line.substring(0, 100) // First 100 chars for debugging
        });
        console.warn(`[PARSER WARNING] ${result.error}`);
      }
    });

    rl.on('error', (error: Error) => {
      resolve({
        success: false,
        error: `Failed to read file: ${error.message}`,
        filePath
      });
    });

    rl.on('close', () => {
      resolve({
        success: true,
        messages,
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          totalLines,
          emptyLines,
          malformedLines,
          successfulLines: messages.length,
          filePath
        }
      });
    });
  });
}

/**
 * Parse multiple JSONL files in parallel
 * @param filePaths - Array of absolute paths to .jsonl files
 * @returns Array of parse results
 */
export async function parseMultipleFiles(filePaths: string[]): Promise<ParseFileResult[]> {
  return Promise.all(filePaths.map(path => parseJsonlFile(path)));
}

/**
 * Parse a JSONL file and return only valid messages (skip errors)
 * Convenience function for when you just want the messages
 *
 * @param filePath - Absolute path to .jsonl file
 * @returns Array of message objects
 */
export async function parseJsonlFileSimple(filePath: string): Promise<MessageData[]> {
  const result = await parseJsonlFile(filePath);

  if (!result.success) {
    console.error(`Failed to parse ${filePath}: ${result.error}`);
    return [];
  }

  if (result.errors && result.errors.length > 0) {
    console.warn(`Parsed ${filePath} with ${result.errors.length} errors`);
  }

  return result.messages || [];
}
