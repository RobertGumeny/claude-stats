/**
 * Example usage of type definitions
 * This file demonstrates how to import and use the types in components
 * Can be deleted after verification
 */

import type { Project, Session, SessionDetail, Message } from './index';

// Example: Component receiving Project data
export function exampleProjectUsage(project: Project): void {
  console.log(`Project: ${project.name}`);
  console.log(`Total Sessions: ${project.totalSessions}`);
  console.log(`Total Cost: $${project.totalCost.toFixed(4)}`);
  console.log(`Last Activity: ${project.lastActivity}`);

  project.sessions.forEach((session) => {
    console.log(`  - ${session.filename}: ${session.messageCount} messages`);
  });
}

// Example: Component receiving Session data
export function exampleSessionUsage(session: Session): void {
  console.log(`Session ID: ${session.sessionId}`);
  console.log(`Messages: ${session.messageCount}`);
  console.log(`Cost: $${session.totalCost.toFixed(4)}`);
  console.log(`Sidechain: ${session.sidechainPercentage.toFixed(1)}%`);
}

// Example: Component receiving SessionDetail data
export function exampleSessionDetailUsage(detail: SessionDetail): void {
  console.log(`Session: ${detail.sessionId}`);
  console.log(`Total Messages: ${detail.messages.length}`);

  detail.messages.forEach((message) => {
    console.log(`  ${message.timestamp} - ${message.role}: $${message.cost.toFixed(4)}`);
  });
}

// Example: Component receiving Message data
export function exampleMessageUsage(message: Message): void {
  console.log(`Message ID: ${message.messageId}`);
  console.log(`Role: ${message.role}`);
  console.log(`Model: ${message.model}`);
  console.log(`Sidechain: ${message.isSidechain ? 'Yes' : 'No'}`);
  console.log(`Tokens: ${message.usage.input_tokens} in, ${message.usage.output_tokens} out`);
  console.log(`Cost: $${message.cost.toFixed(4)}`);

  if (message.content) {
    console.log(`Preview: ${message.content.substring(0, 50)}...`);
  }
}

// Example: Type-safe array operations
export function calculateTotalCost(messages: Message[]): number {
  return messages.reduce((total, msg) => total + msg.cost, 0);
}

export function filterSidechainMessages(messages: Message[]): Message[] {
  return messages.filter((msg) => msg.isSidechain);
}

export function groupMessagesByRole(messages: Message[]): Record<string, Message[]> {
  const grouped: Record<string, Message[]> = {
    user: [],
    assistant: [],
  };

  messages.forEach((msg) => {
    const roleGroup = grouped[msg.role];
    if (roleGroup) {
      roleGroup.push(msg);
    }
  });

  return grouped;
}
