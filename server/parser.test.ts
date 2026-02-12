/**
 * Unit tests for JSONL Parser
 *
 * Tests parsing of Claude Code session log files with various edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { parseJsonlFile, parseMultipleFiles, parseJsonlFileSimple } from './parser';
import type { MessageData, TokenUsage } from './parser';

const TEST_DIR = join(process.cwd(), 'test-temp-parser');

describe('JSONL Parser', () => {
  beforeEach(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('parseJsonlFile', () => {
    it('should parse valid JSONL file with single message', async () => {
      const testFile = join(TEST_DIR, 'single-message.jsonl');
      const logEntry = {
        timestamp: '2026-02-12T10:00:00.000Z',
        isSidechain: false,
        sessionId: 'test-session-123',
        agentId: 'agent-456',
        parentUuid: 'parent-789',
        message: {
          id: 'msg_001',
          role: 'assistant',
          model: 'claude-sonnet-4-5-20250929',
          content: [{ type: 'text', text: 'Hello world' }],
          usage: {
            input_tokens: 100,
            cache_creation_input_tokens: 50,
            cache_read_input_tokens: 200,
            output_tokens: 25,
          },
        },
      };

      await writeFile(testFile, JSON.stringify(logEntry));

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0]).toMatchObject({
          messageId: 'msg_001',
          timestamp: '2026-02-12T10:00:00.000Z',
          isSidechain: false,
          role: 'assistant',
          model: 'claude-sonnet-4-5-20250929',
          sessionId: 'test-session-123',
          agentId: 'agent-456',
          parentUuid: 'parent-789',
          usage: {
            input_tokens: 100,
            cache_creation_input_tokens: 50,
            cache_read_input_tokens: 200,
            output_tokens: 25,
          },
          content: 'Hello world',
        });
        expect(result.stats.totalLines).toBe(1);
        expect(result.stats.successfulLines).toBe(1);
        expect(result.stats.malformedLines).toBe(0);
      }
    });

    it('should parse multiple messages from JSONL file', async () => {
      const testFile = join(TEST_DIR, 'multiple-messages.jsonl');
      const messages = [
        {
          timestamp: '2026-02-12T10:00:00.000Z',
          isSidechain: false,
          sessionId: 'session-1',
          message: {
            id: 'msg_001',
            role: 'user',
            model: 'claude-sonnet-4-5-20250929',
            content: [{ type: 'text', text: 'First message' }],
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        },
        {
          timestamp: '2026-02-12T10:01:00.000Z',
          isSidechain: true,
          sessionId: 'session-1',
          message: {
            id: 'msg_002',
            role: 'assistant',
            model: 'claude-sonnet-4-5-20250929',
            content: [{ type: 'text', text: 'Second message' }],
            usage: { input_tokens: 20, output_tokens: 50 },
          },
        },
      ];

      await writeFile(testFile, messages.map(m => JSON.stringify(m)).join('\n'));

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0]?.messageId).toBe('msg_001');
        expect(result.messages[1]?.messageId).toBe('msg_002');
        expect(result.messages[0]?.isSidechain).toBe(false);
        expect(result.messages[1]?.isSidechain).toBe(true);
        expect(result.stats.successfulLines).toBe(2);
      }
    });

    it('should skip empty lines without errors', async () => {
      const testFile = join(TEST_DIR, 'with-empty-lines.jsonl');
      const content = [
        JSON.stringify({
          message: { id: 'msg_001', usage: {} },
          timestamp: '2026-02-12T10:00:00.000Z',
        }),
        '',
        '  ',
        JSON.stringify({
          message: { id: 'msg_002', usage: {} },
          timestamp: '2026-02-12T10:01:00.000Z',
        }),
      ].join('\n');

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(2);
        expect(result.stats.totalLines).toBe(4);
        expect(result.stats.emptyLines).toBe(2);
        expect(result.stats.successfulLines).toBe(2);
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const testFile = join(TEST_DIR, 'malformed.jsonl');
      const content = [
        JSON.stringify({ message: { id: 'msg_001', usage: {} } }),
        '{ invalid json',
        JSON.stringify({ message: { id: 'msg_002', usage: {} } }),
        'not json at all',
        JSON.stringify({ message: { id: 'msg_003', usage: {} } }),
      ].join('\n');

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(3);
        expect(result.errors).toHaveLength(2);
        expect(result.stats.malformedLines).toBe(2);
        expect(result.stats.successfulLines).toBe(3);
      }
    });

    it('should reject lines missing required message.id field', async () => {
      const testFile = join(TEST_DIR, 'missing-id.jsonl');
      const content = JSON.stringify({
        timestamp: '2026-02-12T10:00:00.000Z',
        message: {
          // Missing 'id' field
          role: 'assistant',
          usage: {},
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.error).toContain('message.id');
      }
    });

    it('should default missing fields to safe values', async () => {
      const testFile = join(TEST_DIR, 'minimal.jsonl');
      const content = JSON.stringify({
        message: {
          id: 'msg_minimal',
          // All optional fields missing
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(1);
        const msg = result.messages[0];
        expect(msg?.messageId).toBe('msg_minimal');
        expect(msg?.role).toBe('unknown');
        expect(msg?.model).toBe('unknown');
        expect(msg?.isSidechain).toBe(false);
        expect(msg?.usage).toEqual({
          input_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          output_tokens: 0,
        });
        expect(msg?.content).toBeNull();
        // Timestamp should be auto-generated
        expect(msg?.timestamp).toBeDefined();
      }
    });

    it('should extract text content from content array', async () => {
      const testFile = join(TEST_DIR, 'content-array.jsonl');
      const content = JSON.stringify({
        message: {
          id: 'msg_content',
          content: [
            { type: 'text', text: 'First block' },
            { type: 'tool_use', id: 'tool_1' },
            { type: 'text', text: 'Second block' },
          ],
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages[0]?.content).toBe('First block\nSecond block');
      }
    });

    it('should handle string content directly', async () => {
      const testFile = join(TEST_DIR, 'string-content.jsonl');
      const content = JSON.stringify({
        message: {
          id: 'msg_string',
          content: 'Simple string content',
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages[0]?.content).toBe('Simple string content');
      }
    });

    it('should handle missing content field', async () => {
      const testFile = join(TEST_DIR, 'no-content.jsonl');
      const content = JSON.stringify({
        message: {
          id: 'msg_no_content',
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages[0]?.content).toBeNull();
      }
    });

    it('should handle file read errors', async () => {
      const nonExistentFile = join(TEST_DIR, 'does-not-exist.jsonl');

      const result = await parseJsonlFile(nonExistentFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to read file');
      }
    });

    it('should handle CRLF line endings', async () => {
      const testFile = join(TEST_DIR, 'crlf.jsonl');
      const content = [
        JSON.stringify({ message: { id: 'msg_001', usage: {} } }),
        JSON.stringify({ message: { id: 'msg_002', usage: {} } }),
      ].join('\r\n');

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(2);
      }
    });

    it('should default undefined token fields to 0', async () => {
      const testFile = join(TEST_DIR, 'partial-tokens.jsonl');
      const content = JSON.stringify({
        message: {
          id: 'msg_partial',
          usage: {
            input_tokens: 100,
            // Other token fields missing
          },
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages[0]?.usage).toEqual({
          input_tokens: 100,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          output_tokens: 0,
        });
      }
    });

    it('should preserve metadata fields (sessionId, agentId, parentUuid)', async () => {
      const testFile = join(TEST_DIR, 'metadata.jsonl');
      const content = JSON.stringify({
        sessionId: 'session-abc',
        agentId: 'agent-xyz',
        parentUuid: 'parent-123',
        message: {
          id: 'msg_metadata',
          usage: {},
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages[0]?.sessionId).toBe('session-abc');
        expect(result.messages[0]?.agentId).toBe('agent-xyz');
        expect(result.messages[0]?.parentUuid).toBe('parent-123');
      }
    });
  });

  describe('parseMultipleFiles', () => {
    it('should parse multiple files in parallel', async () => {
      const file1 = join(TEST_DIR, 'file1.jsonl');
      const file2 = join(TEST_DIR, 'file2.jsonl');

      await writeFile(file1, JSON.stringify({ message: { id: 'msg_1', usage: {} } }));
      await writeFile(file2, JSON.stringify({ message: { id: 'msg_2', usage: {} } }));

      const results = await parseMultipleFiles([file1, file2]);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
    });

    it('should handle mix of successful and failed parses', async () => {
      const file1 = join(TEST_DIR, 'valid.jsonl');
      const file2 = join(TEST_DIR, 'nonexistent.jsonl');

      await writeFile(file1, JSON.stringify({ message: { id: 'msg_1', usage: {} } }));

      const results = await parseMultipleFiles([file1, file2]);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
    });

    it('should handle empty file list', async () => {
      const results = await parseMultipleFiles([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('parseJsonlFileSimple', () => {
    it('should return only messages array on success', async () => {
      const testFile = join(TEST_DIR, 'simple.jsonl');
      const content = [
        JSON.stringify({ message: { id: 'msg_1', usage: {} } }),
        JSON.stringify({ message: { id: 'msg_2', usage: {} } }),
      ].join('\n');

      await writeFile(testFile, content);

      const messages = await parseJsonlFileSimple(testFile);

      expect(messages).toHaveLength(2);
      expect(messages[0]?.messageId).toBe('msg_1');
      expect(messages[1]?.messageId).toBe('msg_2');
    });

    it('should return empty array on file read error', async () => {
      const nonExistentFile = join(TEST_DIR, 'does-not-exist.jsonl');

      const messages = await parseJsonlFileSimple(nonExistentFile);

      expect(messages).toHaveLength(0);
    });

    it('should return valid messages even with parse errors', async () => {
      const testFile = join(TEST_DIR, 'partial-errors.jsonl');
      const content = [
        JSON.stringify({ message: { id: 'msg_1', usage: {} } }),
        '{ invalid json',
        JSON.stringify({ message: { id: 'msg_2', usage: {} } }),
      ].join('\n');

      await writeFile(testFile, content);

      const messages = await parseJsonlFileSimple(testFile);

      expect(messages).toHaveLength(2);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very long lines', async () => {
      const testFile = join(TEST_DIR, 'long-line.jsonl');
      const longText = 'x'.repeat(100000);
      const content = JSON.stringify({
        message: {
          id: 'msg_long',
          content: [{ type: 'text', text: longText }],
          usage: {},
        },
      });

      await writeFile(testFile, content);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(1);
      }
    });

    it('should handle empty file', async () => {
      const testFile = join(TEST_DIR, 'empty.jsonl');
      await writeFile(testFile, '');

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(0);
        expect(result.stats.totalLines).toBe(0);
      }
    });

    it('should handle file with only empty lines', async () => {
      const testFile = join(TEST_DIR, 'only-empty.jsonl');
      await writeFile(testFile, '\n\n  \n\t\n');

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messages).toHaveLength(0);
        expect(result.stats.emptyLines).toBeGreaterThan(0);
      }
    });

    it('should truncate error line preview to 100 chars', async () => {
      const testFile = join(TEST_DIR, 'long-error.jsonl');
      const longInvalidLine = '{ "invalid": "json" '.repeat(50);
      await writeFile(testFile, longInvalidLine);

      const result = await parseJsonlFile(testFile);

      expect(result.success).toBe(true);
      if (result.success && result.errors) {
        expect(result.errors[0]?.line.length).toBeLessThanOrEqual(100);
      }
    });
  });
});
