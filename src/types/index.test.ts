/**
 * Type tests to verify interfaces are correctly defined
 * This file ensures types can be imported and used without errors
 */

import { describe, it, expect } from 'vitest';
import type { Project, Session, SessionDetail, Message, TokenUsage } from './index';

describe('Type definitions', () => {
  it('should create valid TokenUsage object', () => {
    const usage: TokenUsage = {
      input_tokens: 100,
      cache_creation_input_tokens: 50,
      cache_read_input_tokens: 200,
      output_tokens: 75,
    };

    expect(usage.input_tokens).toBe(100);
    expect(usage.cache_creation_input_tokens).toBe(50);
    expect(usage.cache_read_input_tokens).toBe(200);
    expect(usage.output_tokens).toBe(75);
  });

  it('should create valid Message object', () => {
    const message: Message = {
      messageId: 'msg_123',
      timestamp: '2026-02-12T10:00:00Z',
      isSidechain: false,
      role: 'assistant',
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 100,
        cache_creation_input_tokens: 50,
        cache_read_input_tokens: 200,
        output_tokens: 75,
      },
      cost: 0.0042,
    };

    expect(message.messageId).toBe('msg_123');
    expect(message.role).toBe('assistant');
    expect(message.isSidechain).toBe(false);
  });

  it('should create valid Message with optional content', () => {
    const message: Message = {
      messageId: 'msg_456',
      timestamp: '2026-02-12T10:00:00Z',
      isSidechain: true,
      role: 'user',
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 100,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 0,
      },
      cost: 0.0003,
      content: 'This is a preview of the message content',
    };

    expect(message.content).toBe('This is a preview of the message content');
  });

  it('should create valid Session object', () => {
    const session: Session = {
      filename: 'test-session.jsonl',
      sessionId: 'session_123',
      messageCount: 47,
      totalCost: 0.0824,
      sidechainCount: 15,
      sidechainPercentage: 31.9,
      totalTokens: 125000,
      firstMessage: '2026-02-12T10:00:00Z',
      lastMessage: '2026-02-12T10:15:32Z',
    };

    expect(session.messageCount).toBe(47);
    expect(session.sidechainPercentage).toBe(31.9);
  });

  it('should create valid SessionDetail object', () => {
    const sessionDetail: SessionDetail = {
      filename: 'test-session.jsonl',
      sessionId: 'session_123',
      messageCount: 2,
      totalCost: 0.0046,
      sidechainCount: 1,
      sidechainPercentage: 50,
      totalTokens: 425,
      firstMessage: '2026-02-12T10:00:00Z',
      lastMessage: '2026-02-12T10:00:15Z',
      messages: [
        {
          messageId: 'msg_1',
          timestamp: '2026-02-12T10:00:00Z',
          isSidechain: false,
          role: 'assistant',
          model: 'claude-sonnet-4-5-20250929',
          usage: {
            input_tokens: 200,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            output_tokens: 100,
          },
          cost: 0.0021,
        },
        {
          messageId: 'msg_2',
          timestamp: '2026-02-12T10:00:15Z',
          isSidechain: true,
          role: 'assistant',
          model: 'claude-sonnet-4-5-20250929',
          usage: {
            input_tokens: 100,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            output_tokens: 25,
          },
          cost: 0.0025,
        },
      ],
    };

    expect(sessionDetail.messages.length).toBe(2);
    expect(sessionDetail.messageCount).toBe(2);
  });

  it('should create valid Project object', () => {
    const project: Project = {
      name: 'claude-stats',
      path: '/home/user/.claude/projects/claude-stats',
      totalSessions: 5,
      totalCost: 0.4123,
      lastActivity: '2026-02-12T10:15:32Z',
      sessions: [
        {
          filename: 'session-1.jsonl',
          sessionId: 'session_1',
          messageCount: 10,
          totalCost: 0.0824,
          sidechainCount: 3,
          sidechainPercentage: 30,
          totalTokens: 10000,
          firstMessage: '2026-02-12T09:00:00Z',
          lastMessage: '2026-02-12T09:05:00Z',
        },
      ],
    };

    expect(project.name).toBe('claude-stats');
    expect(project.totalSessions).toBe(5);
    expect(project.sessions.length).toBe(1);
  });

  it('should enforce role type restrictions', () => {
    // This should compile fine
    const validMessage: Message = {
      messageId: 'msg_123',
      timestamp: '2026-02-12T10:00:00Z',
      isSidechain: false,
      role: 'user', // Valid: 'user' | 'assistant'
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 100,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 0,
      },
      cost: 0.0003,
    };

    expect(validMessage.role).toBe('user');

    const assistantMessage: Message = {
      messageId: 'msg_456',
      timestamp: '2026-02-12T10:00:00Z',
      isSidechain: false,
      role: 'assistant', // Valid: 'user' | 'assistant'
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 100,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 50,
      },
      cost: 0.0008,
    };

    expect(assistantMessage.role).toBe('assistant');
  });
});
