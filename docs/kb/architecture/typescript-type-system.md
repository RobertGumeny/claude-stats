---
title: TypeScript Type System and Interfaces
updated: 2026-02-12
category: Architecture
tags: [typescript, types, interfaces, data-model]
related_articles:
  - docs/kb/features/cost-calculator.md
  - docs/kb/patterns/jsonl-streaming-parser.md
  - docs/kb/infrastructure/vite-react-typescript-setup.md
---

# TypeScript Type System and Interfaces

## Overview

The project defines comprehensive TypeScript interfaces for all data structures, matching the PRD data model specification exactly. All types are exported from `src/types/index.ts` for consistent usage across components and utilities.

## Implementation

**Core Type Definitions (src/types/index.ts):**
```typescript
export interface TokenUsage {
  input_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  output_tokens: number;
}

export interface Message {
  messageId: string;
  timestamp: string; // ISO 8601 format
  isSidechain: boolean;
  role: "user" | "assistant";
  model: string;
  usage: TokenUsage;
  cost: number;
  content?: string; // Optional preview
}

export interface Session {
  filename: string;
  sessionId: string;
  messageCount: number;
  totalCost: number;
  sidechainCount: number;
  sidechainPercentage: number;
  totalTokens: number;
  firstMessage: string; // ISO timestamp
  lastMessage: string;
}

export interface SessionDetail extends Session {
  messages: Message[];
}

export interface Project {
  name: string;
  path: string;
  totalSessions: number;
  totalCost: number;
  lastActivity: string; // ISO timestamp
  sessions: Session[];
}
```

## Key Decisions

**Separate TokenUsage Interface**: Created dedicated interface for token usage rather than inlining in `Message`. Improves reusability and clarity.

**Strict Role Typing**: Used union type `"user" | "assistant"` instead of generic `string`. Provides compile-time safety and better autocomplete.

**Optional Content Field**: Made `content` optional in `Message` interface. Used for previews, not always populated to save memory.

**SessionDetail Extends Session**: Used TypeScript's `extends` keyword to avoid duplicating fields between `Session` and `SessionDetail`. Ensures consistency.

**ISO Timestamp Documentation**: Added inline comments clarifying that timestamp fields expect ISO 8601 format strings (`2026-02-12T18:30:00Z`).

**No `any` Types**: All types are fully defined with no `any` escape hatches. Strict mode enforces this.

## Usage Example

```typescript
// Import types
import type { Project, Session, Message } from './types';

// Type-safe function
function calculateProjectCost(project: Project): number {
  return project.sessions.reduce((sum, session) => sum + session.totalCost, 0);
}

// Type-safe component props
interface ProjectCardProps {
  project: Project;
  onClick: (projectName: string) => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div onClick={() => onClick(project.name)}>
      <h3>{project.name}</h3>
      <p>${project.totalCost.toFixed(4)}</p>
    </div>
  );
}

// Array operations with type inference
const expensiveSessions = project.sessions.filter(s => s.totalCost > 0.01);
const totalMessages = project.sessions.reduce((sum, s) => sum + s.messageCount, 0);
```

## Edge Cases & Gotchas

**Role Validation**: TypeScript enforces `"user" | "assistant"` at compile time, but runtime data may have other values. Validate with type guards if parsing untrusted data.

**Optional Fields**: The `content` field is optional (`content?: string`). Always check for existence before accessing: `if (message.content) { ... }`.

**Timestamp Format**: TypeScript types timestamps as `string`, but runtime values must be valid ISO 8601 strings. Consider using a library like `date-fns` for parsing.

**Extends vs Intersection**: `SessionDetail extends Session` is cleaner than intersection types (`Session & { messages: Message[] }`) for this use case.

## Related Topics

See [Cost Calculator](../features/cost-calculator.md) for `TokenUsage` and `Message` usage.
See [JSONL Streaming Parser](../patterns/jsonl-streaming-parser.md) for `Message` construction.
See [Vite + React + TypeScript Setup](../infrastructure/vite-react-typescript-setup.md) for TypeScript configuration.
