import { readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * Parse a single JSONL line and extract message data
 * @param {string} line - Raw JSONL line
 * @param {number} lineNumber - Line number for error reporting (1-indexed)
 * @returns {{success: boolean, data?: Object, error?: string}}
 */
function parseLine(line, lineNumber) {
  // Skip empty lines
  if (!line.trim()) {
    return { success: true, data: null };
  }

  try {
    const parsed = JSON.parse(line);

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
    const messageData = {
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
    return {
      success: false,
      error: `Malformed JSON at line ${lineNumber}: ${error.message}`
    };
  }
}

/**
 * Extract text content from message content array
 * @param {Array|string} content - Message content (can be array of objects or string)
 * @returns {string|null} Extracted text content or null
 */
function extractContent(content) {
  if (!content) return null;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    // Extract text from content blocks
    const textBlocks = content
      .filter(block => block && block.type === 'text')
      .map(block => block.text);

    return textBlocks.length > 0 ? textBlocks.join('\n') : null;
  }

  return null;
}

/**
 * Parse a JSONL file line-by-line and extract all messages
 * Handles malformed JSON gracefully by skipping bad lines and logging warnings
 *
 * @param {string} filePath - Absolute path to .jsonl file
 * @returns {Promise<{success: boolean, messages?: Array, errors?: Array, stats?: Object}>}
 */
export async function parseJsonlFile(filePath) {
  return new Promise((resolve) => {
    const messages = [];
    const errors = [];
    let lineNumber = 0;
    let totalLines = 0;
    let emptyLines = 0;
    let malformedLines = 0;

    const fileStream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity // Handle both \n and \r\n
    });

    rl.on('line', (line) => {
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

    rl.on('error', (error) => {
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
 * @param {string[]} filePaths - Array of absolute paths to .jsonl files
 * @returns {Promise<Array>} Array of parse results
 */
export async function parseMultipleFiles(filePaths) {
  return Promise.all(filePaths.map(path => parseJsonlFile(path)));
}

/**
 * Parse a JSONL file and return only valid messages (skip errors)
 * Convenience function for when you just want the messages
 *
 * @param {string} filePath - Absolute path to .jsonl file
 * @returns {Promise<Array>} Array of message objects
 */
export async function parseJsonlFileSimple(filePath) {
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
