/**
 * Core TypeScript interfaces for Claude Code Session Analyzer
 * Matches PRD data model specification
 */

/**
 * Token usage breakdown for a single message
 */
export interface TokenUsage {
  input_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  output_tokens: number;
}

/**
 * Individual message from a Claude Code session
 */
export interface Message {
  messageId: string;
  timestamp: string; // ISO timestamp
  isSidechain: boolean;
  role: "user" | "assistant";
  model: string;
  usage: TokenUsage;
  cost: number;
  content?: string; // Optional message content preview
}

/**
 * Session summary with basic metadata
 */
export interface Session {
  filename: string;
  sessionId: string;
  messageCount: number;
  totalCost: number;
  sidechainCount: number;
  sidechainPercentage: number;
  totalTokens: number;
  firstMessage: string; // ISO timestamp
  lastMessage: string; // ISO timestamp
}

/**
 * Detailed session view including all messages
 */
export interface SessionDetail extends Session {
  messages: Message[];
}

/**
 * Project containing multiple sessions
 */
export interface Project {
  name: string;
  path: string;
  totalSessions: number;
  totalCost: number;
  lastActivity: string; // ISO timestamp
  sessions: Session[];
}
