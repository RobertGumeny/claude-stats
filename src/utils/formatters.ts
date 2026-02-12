/**
 * Formatting utilities for Claude Code Session Analyzer
 */

/**
 * Format timestamp range as "Jan 15, 2:30 PM → 2:45 PM"
 * @param firstMessage - ISO timestamp of first message
 * @param lastMessage - ISO timestamp of last message
 * @returns Formatted timestamp range string
 */
export function formatTimestampRange(firstMessage: string, lastMessage: string): string {
  const first = new Date(firstMessage);
  const last = new Date(lastMessage);

  // Check if timestamps are valid
  if (isNaN(first.getTime()) || isNaN(last.getTime())) {
    return 'Invalid timestamps';
  }

  // Format: "Jan 15, 2:30 PM → 2:45 PM"
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const datePart = first.toLocaleDateString('en-US', dateOptions);
  const firstTime = first.toLocaleTimeString('en-US', timeOptions);
  const lastTime = last.toLocaleTimeString('en-US', timeOptions);

  return `${datePart}, ${firstTime} → ${lastTime}`;
}

/**
 * Format a single timestamp as "Jan 15, 2:30 PM"
 * @param timestamp - ISO timestamp
 * @returns Formatted timestamp string
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return 'Invalid timestamp';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const datePart = date.toLocaleDateString('en-US', dateOptions);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);

  return `${datePart}, ${timePart}`;
}

/**
 * Truncate session ID for display
 * @param sessionId - Full session ID
 * @param length - Number of characters to show (default 8)
 * @returns Truncated session ID
 */
export function truncateSessionId(sessionId: string, length: number = 8): string {
  if (!sessionId || sessionId === 'unknown') {
    return 'unknown';
  }

  if (sessionId.length <= length) {
    return sessionId;
  }

  return `${sessionId.substring(0, length)}...`;
}

/**
 * Format cost with 4 decimal places
 * @param cost - Cost in dollars
 * @returns Formatted cost string
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Format large numbers with commas
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}
