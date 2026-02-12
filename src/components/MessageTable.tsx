import { useState } from 'react';
import { Message } from '../types';
import { formatCost, formatNumber } from '../utils/formatters';

interface MessageTableProps {
  messages: Message[];
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return 'Invalid';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Individual message row with expandable content
 */
interface MessageRowProps {
  message: Message;
  isExpanded: boolean;
  onToggle: () => void;
}

function MessageRow({ message, isExpanded, onToggle }: MessageRowProps) {
  const usage = message.usage || {};
  const totalTokens =
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.output_tokens || 0);


  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border-primary hover:bg-background-tertiary cursor-pointer transition-colors"
      >
        {/* Timestamp */}
        <td className="px-4 py-3 text-text-secondary text-sm font-mono">
          {formatTime(message.timestamp)}
        </td>

        {/* Role */}
        <td className="px-4 py-3 text-text-primary text-sm capitalize">
          {message.role}
        </td>

        {/* Type (Main/Sidechain) */}
        <td className="px-4 py-3 text-sm">
          {message.isSidechain ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent-sidechain/20 text-accent-sidechain">
              Sidechain
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
              Main
            </span>
          )}
        </td>

        {/* Tokens */}
        <td className="px-4 py-3 text-text-primary text-sm font-mono">
          {formatNumber(totalTokens)}
        </td>

        {/* Cost */}
        <td className="px-4 py-3 text-accent-cost text-sm font-mono">
          {formatCost(message.cost)}
        </td>

        {/* Expand indicator */}
        <td className="px-4 py-3 text-text-tertiary text-sm">
          {isExpanded ? '▼' : '▶'}
        </td>
      </tr>

      {/* Expanded row with full content */}
      {isExpanded && (
        <tr className="bg-background-tertiary border-b border-border-primary">
          <td colSpan={6} className="px-4 py-4">
            <div className="space-y-3">
              {/* Message ID */}
              <div>
                <p className="text-text-tertiary text-xs mb-1">Message ID</p>
                <p className="text-text-primary text-sm font-mono break-all">{message.messageId}</p>
              </div>

              {/* Model */}
              <div>
                <p className="text-text-tertiary text-xs mb-1">Model</p>
                <p className="text-text-primary text-sm font-mono">{message.model || 'Unknown'}</p>
              </div>

              {/* Token Breakdown */}
              <div>
                <p className="text-text-tertiary text-xs mb-1">Token Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-text-tertiary">Input: </span>
                    <span className="text-text-primary font-mono">{formatNumber(usage.input_tokens || 0)}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Cache Write: </span>
                    <span className="text-text-primary font-mono">{formatNumber(usage.cache_creation_input_tokens || 0)}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Cache Read: </span>
                    <span className="text-text-primary font-mono">{formatNumber(usage.cache_read_input_tokens || 0)}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Output: </span>
                    <span className="text-text-primary font-mono">{formatNumber(usage.output_tokens || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <p className="text-text-tertiary text-xs mb-1">Content Preview</p>
                <div className="bg-background-primary border border-border-primary rounded p-3 max-h-96 overflow-y-auto">
                  <pre className="text-text-secondary text-xs whitespace-pre-wrap break-words font-mono">
                    {message.content ? JSON.stringify(message.content, null, 2) : 'No content available'}
                  </pre>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function MessageTable({ messages }: MessageTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (messageId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedRows(newExpanded);
  };

  if (messages.length === 0) {
    return (
      <div className="bg-background-secondary border border-border-primary rounded-lg p-12 text-center">
        <p className="text-text-tertiary text-lg">No messages found in this session.</p>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary border border-border-primary rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-3 text-left text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                Tokens
              </th>
              <th className="px-4 py-3 text-left text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                Cost
              </th>
              <th className="px-4 py-3 text-left text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                {/* Expand column */}
              </th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <MessageRow
                key={message.messageId}
                message={message}
                isExpanded={expandedRows.has(message.messageId)}
                onToggle={() => toggleRow(message.messageId)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Table footer with message count */}
      <div className="bg-background-tertiary border-t border-border-primary px-4 py-3">
        <p className="text-text-tertiary text-sm">
          Showing {formatNumber(messages.length)} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
