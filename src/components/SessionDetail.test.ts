import { describe, it, expect } from 'vitest';
import { applyFilters } from './SessionDetail';
import { Message } from '../types';

function makeMessage(overrides: Partial<Message>): Message {
  return {
    messageId: 'msg-default',
    timestamp: '2026-02-18T12:00:00Z',
    isSidechain: false,
    role: 'assistant',
    model: 'claude-sonnet-4-6',
    usage: {
      input_tokens: 100,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 50,
    },
    cost: 0.001,
    ...overrides,
  };
}

const mainUser = makeMessage({ messageId: 'mu', isSidechain: false, role: 'user' });
const mainAssistant = makeMessage({ messageId: 'ma', isSidechain: false, role: 'assistant' });
const sideUser = makeMessage({ messageId: 'su', isSidechain: true, role: 'user' });
const sideAssistant = makeMessage({ messageId: 'sa', isSidechain: true, role: 'assistant' });

const ALL = [mainUser, mainAssistant, sideUser, sideAssistant];

describe('applyFilters', () => {
  describe('thread filter', () => {
    it('all — returns all messages', () => {
      expect(applyFilters(ALL, 'all', true, true)).toHaveLength(4);
    });

    it('main — returns only non-sidechain messages', () => {
      const result = applyFilters(ALL, 'main', true, true);
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m.isSidechain).toBe(false));
    });

    it('sidechain — returns only sidechain messages', () => {
      const result = applyFilters(ALL, 'sidechain', true, true);
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m.isSidechain).toBe(true));
    });
  });

  describe('role filters', () => {
    it('showUser=false excludes user messages', () => {
      const result = applyFilters(ALL, 'all', false, true);
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m.role).toBe('assistant'));
    });

    it('showAssistant=false excludes assistant messages', () => {
      const result = applyFilters(ALL, 'all', true, false);
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m.role).toBe('user'));
    });

    it('both role filters false returns empty array', () => {
      expect(applyFilters(ALL, 'all', false, false)).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('main thread + assistant only returns main assistant messages', () => {
      const result = applyFilters(ALL, 'main', false, true);
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe('ma');
    });

    it('sidechain + user only returns sidechain user messages', () => {
      const result = applyFilters(ALL, 'sidechain', true, false);
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe('su');
    });

    it('sidechain + no roles returns empty array', () => {
      expect(applyFilters(ALL, 'sidechain', false, false)).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('empty messages array returns empty array', () => {
      expect(applyFilters([], 'all', true, true)).toHaveLength(0);
    });

    it('returns correct count when all messages match', () => {
      const messages = [mainAssistant, mainUser];
      expect(applyFilters(messages, 'all', true, true)).toHaveLength(2);
    });
  });
});
