import { useState, useCallback, memo, useMemo } from "react";
import { List, useDynamicRowHeight } from "react-window";
import { Message } from "../types";
import { formatNumber } from "../utils/formatters";
import { formatCost } from "../utils/costCalculator";
import { CopyButton } from "./CopyButton";
import { TokenBar } from "./TokenBar";

/** Threshold above which virtualization is activated */
export const VIRTUALIZATION_THRESHOLD = 200;

/** Base row height for the dynamic height cache */
const DEFAULT_ROW_HEIGHT = 49;

interface MessageTableProps {
  messages: Message[];
  totalMessages?: number;
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Invalid";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Compute total tokens from usage — pure helper exported for testing
 */
export function computeTotalTokens(usage: Message["usage"]): number {
  if (!usage) return 0;
  return (
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.output_tokens || 0)
  );
}

/**
 * Expanded content panel shared between standard and virtualized rows
 */
function ExpandedContent({ message }: { message: Message }) {
  const usage = message.usage || {};
  return (
    <div className="bg-tertiary px-4 py-4 space-y-3">
      {/* Message ID */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-subtle text-xs">Message ID</p>
          <CopyButton text={message.messageId} label="ID" />
        </div>
        <p className="text-foreground text-sm font-mono break-all">
          {message.messageId}
        </p>
      </div>

      {/* Model */}
      <div>
        <p className="text-subtle text-xs mb-1">Model</p>
        <p className="text-foreground text-sm font-mono">
          {message.model || "Unknown"}
        </p>
      </div>

      {/* Token Breakdown */}
      <div>
        <p className="text-subtle text-xs mb-1">Token Breakdown</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-subtle">Input: </span>
            <span className="text-foreground font-mono">
              {formatNumber(usage.input_tokens || 0)}
            </span>
          </div>
          <div>
            <span className="text-subtle">Cache Write: </span>
            <span className="text-foreground font-mono">
              {formatNumber(usage.cache_creation_input_tokens || 0)}
            </span>
          </div>
          <div>
            <span className="text-subtle">Cache Read: </span>
            <span className="text-foreground font-mono">
              {formatNumber(usage.cache_read_input_tokens || 0)}
            </span>
          </div>
          <div>
            <span className="text-subtle">Output: </span>
            <span className="text-foreground font-mono">
              {formatNumber(usage.output_tokens || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-subtle text-xs">Content Preview</p>
          {message.content && (
            <CopyButton
              text={JSON.stringify(message.content, null, 2)}
              label="Content"
            />
          )}
        </div>
        <div className="bg-primary border border-border rounded p-3 max-h-48 overflow-y-auto">
          <pre className="text-muted text-xs whitespace-pre-wrap wrap-break-word font-mono">
            {message.content
              ? JSON.stringify(message.content, null, 2)
              : "No content available"}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual message row with expandable content — memoized to avoid
 * re-rendering rows that haven't changed.
 */
interface MessageRowProps {
  message: Message;
  isExpanded: boolean;
  onToggle: () => void;
}

export const MessageRow = memo(function MessageRow({
  message,
  isExpanded,
  onToggle,
}: MessageRowProps) {
  const usage = message.usage || {};
  const totalTokens = computeTotalTokens(usage);

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-tertiary cursor-pointer transition-colors"
      >
        {/* Timestamp */}
        <td className="px-4 py-3 text-muted text-sm font-mono">
          {formatTime(message.timestamp)}
        </td>

        {/* Role */}
        <td className="px-4 py-3 text-foreground text-sm capitalize">
          {message.role}
        </td>

        {/* Type (Main/Sidechain) */}
        <td className="px-4 py-3 text-sm">
          {message.isSidechain ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-sidechain/20 text-sidechain">
              Sidechain
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
              Main
            </span>
          )}
        </td>

        {/* Tokens */}
        <td className="px-4 py-3 text-foreground text-sm font-mono">
          <div className="flex items-center gap-2">
            <span>{formatNumber(totalTokens)}</span>
            {message.usage && <TokenBar usage={message.usage} />}
          </div>
        </td>

        {/* Cost */}
        <td className="px-4 py-3 text-success text-sm font-mono">
          {formatCost(message.cost, 4)}
        </td>

        {/* Expand indicator */}
        <td className="px-4 py-3 text-subtle text-sm">
          {isExpanded ? "▼" : "▶"}
        </td>
      </tr>

      {/* Expanded row with full content */}
      {isExpanded && (
        <tr className="bg-tertiary border-b border-border">
          <td colSpan={6} className="px-4 py-4">
            <ExpandedContent message={message} />
          </td>
        </tr>
      )}
    </>
  );
});

/**
 * Extra props passed to the virtualized row via react-window v2 rowProps.
 */
interface VirtualRowExtraProps {
  messages: Message[];
  expandedRows: Set<string>;
  onToggle: (id: string) => void;
}

/**
 * Virtualized row component for react-window v2 List.
 * Uses div-based columns to work outside a <table> context.
 * Note: react-window v2 requires the component to return ReactElement | null
 * and to accept ariaAttributes, index, and style in addition to rowProps.
 */
function VirtualRow({
  index,
  style,
  messages,
  expandedRows,
  onToggle,
}: {
  ariaAttributes: { "aria-posinset": number; "aria-setsize": number; role: "listitem" };
  index: number;
  style: React.CSSProperties;
} & VirtualRowExtraProps): React.ReactElement | null {
  const message = messages[index];
  if (!message) return null;

  const usage = message.usage || {};
  const totalTokens = computeTotalTokens(usage);
  const isExpanded = expandedRows.has(message.messageId);

  return (
    <div style={style} className="border-b border-border">
      {/* Main row */}
      <div
        onClick={() => onToggle(message.messageId)}
        className="flex items-center hover:bg-tertiary cursor-pointer transition-colors px-4 h-[49px]"
      >
        {/* Timestamp */}
        <div className="w-[110px] shrink-0 text-muted text-sm font-mono">
          {formatTime(message.timestamp)}
        </div>

        {/* Role */}
        <div className="w-[90px] shrink-0 text-foreground text-sm capitalize">
          {message.role}
        </div>

        {/* Type */}
        <div className="w-[110px] shrink-0 text-sm">
          {message.isSidechain ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-sidechain/20 text-sidechain">
              Sidechain
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
              Main
            </span>
          )}
        </div>

        {/* Tokens */}
        <div className="flex-1 text-foreground text-sm font-mono">
          <div className="flex items-center gap-2">
            <span>{formatNumber(totalTokens)}</span>
            {message.usage && <TokenBar usage={message.usage} />}
          </div>
        </div>

        {/* Cost */}
        <div className="w-[100px] shrink-0 text-success text-sm font-mono">
          {formatCost(message.cost, 4)}
        </div>

        {/* Expand indicator */}
        <div className="w-[30px] shrink-0 text-subtle text-sm">
          {isExpanded ? "▼" : "▶"}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && <ExpandedContent message={message} />}
    </div>
  );
}

/**
 * Virtualized message list for large sessions (≥ VIRTUALIZATION_THRESHOLD messages).
 * Uses react-window v2 List with useDynamicRowHeight for expandable rows.
 */
interface VirtualMessageListProps {
  messages: Message[];
  expandedRows: Set<string>;
  onToggle: (id: string) => void;
}

function VirtualMessageList({
  messages,
  expandedRows,
  onToggle,
}: VirtualMessageListProps) {
  // useDynamicRowHeight — key resets height cache when expanded set changes
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_ROW_HEIGHT,
    key: expandedRows.size,
  });

  // rowProps must be stable; memoize to avoid unnecessary re-renders
  const rowProps = useMemo<VirtualRowExtraProps>(
    () => ({ messages, expandedRows, onToggle }),
    [messages, expandedRows, onToggle],
  );

  return (
    <List
      rowComponent={VirtualRow}
      rowProps={rowProps}
      rowCount={messages.length}
      rowHeight={dynamicRowHeight}
      overscanCount={5}
      style={{ width: "100%" }}
    />
  );
}

/**
 * Column header row — uses div layout for virtualized mode, thead for table mode.
 */
function TableHeader({ virtualized }: { virtualized: boolean }) {
  if (virtualized) {
    return (
      <div className="flex items-center bg-tertiary border-b border-border px-4 py-3">
        <div className="w-[110px] shrink-0 text-subtle text-xs font-semibold uppercase tracking-wider">
          Timestamp
        </div>
        <div className="w-[90px] shrink-0 text-subtle text-xs font-semibold uppercase tracking-wider">
          Role
        </div>
        <div className="w-[110px] shrink-0 text-subtle text-xs font-semibold uppercase tracking-wider">
          Type
        </div>
        <div className="flex-1 text-subtle text-xs font-semibold uppercase tracking-wider">
          Tokens
        </div>
        <div className="w-[100px] shrink-0 text-subtle text-xs font-semibold uppercase tracking-wider">
          Cost
        </div>
        <div className="w-[30px] shrink-0" />
      </div>
    );
  }

  return (
    <thead className="bg-tertiary border-b border-border">
      <tr>
        <th className="px-4 py-3 text-left text-subtle text-xs font-semibold uppercase tracking-wider">
          Timestamp
        </th>
        <th className="px-4 py-3 text-left text-subtle text-xs font-semibold uppercase tracking-wider">
          Role
        </th>
        <th className="px-4 py-3 text-left text-subtle text-xs font-semibold uppercase tracking-wider">
          Type
        </th>
        <th className="px-4 py-3 text-left text-subtle text-xs font-semibold uppercase tracking-wider">
          Tokens
        </th>
        <th className="px-4 py-3 text-left text-subtle text-xs font-semibold uppercase tracking-wider">
          Cost
        </th>
        <th className="px-4 py-3 text-left text-subtle text-xs font-semibold uppercase tracking-wider">
          {/* Expand column */}
        </th>
      </tr>
    </thead>
  );
}

export function MessageTable({ messages, totalMessages }: MessageTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((messageId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  if (messages.length === 0) {
    return (
      <div className="bg-secondary border border-border rounded-lg p-12 text-center">
        <p className="text-subtle text-lg">
          No messages found in this session.
        </p>
      </div>
    );
  }

  const useVirtualization = messages.length >= VIRTUALIZATION_THRESHOLD;

  return (
    <div className="bg-secondary border border-border rounded-lg overflow-hidden">
      {useVirtualization ? (
        /* Virtualized layout (div-based) for large lists */
        <div>
          <TableHeader virtualized={true} />
          <VirtualMessageList
            messages={messages}
            expandedRows={expandedRows}
            onToggle={toggleRow}
          />
        </div>
      ) : (
        /* Standard table layout for small lists */
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader virtualized={false} />
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
      )}

      {/* Table footer with message count */}
      <div className="bg-tertiary border-t border-border px-4 py-3">
        <p className="text-subtle text-sm">
          {totalMessages !== undefined && totalMessages !== messages.length
            ? `Showing ${formatNumber(messages.length)} of ${formatNumber(totalMessages)} message${totalMessages !== 1 ? "s" : ""}`
            : `Showing ${formatNumber(messages.length)} message${messages.length !== 1 ? "s" : ""}`}
          {useVirtualization && (
            <span className="ml-2 text-subtle text-xs">(virtualized)</span>
          )}
        </p>
      </div>
    </div>
  );
}
