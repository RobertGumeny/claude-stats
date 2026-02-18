import { SessionDetail } from '../types';
import { formatNumber } from '../utils/formatters';
import { formatCost } from '../utils/costCalculator';

interface SummaryCardProps {
  session: SessionDetail;
}

/**
 * Calculates cache hit rate from session messages
 * Cache hit rate = cache_read_tokens / (cache_read_tokens + cache_write_tokens)
 */
function calculateCacheHitRate(session: SessionDetail): string {
  let totalCacheRead = 0;
  let totalCacheWrite = 0;

  session.messages.forEach(msg => {
    const usage = msg.usage || {};
    totalCacheRead += usage.cache_read_input_tokens || 0;
    totalCacheWrite += usage.cache_creation_input_tokens || 0;
  });

  if (totalCacheRead === 0 && totalCacheWrite === 0) {
    return 'N/A';
  }

  if (totalCacheWrite === 0) {
    return '∞'; // Infinite hit rate (all reads, no writes)
  }

  const hitRate = totalCacheRead / totalCacheWrite;
  return `${hitRate.toFixed(1)}x`;
}

/**
 * Calculates session duration in human-readable format
 */
function calculateDuration(firstMessage: string, lastMessage: string): string {
  const first = new Date(firstMessage);
  const last = new Date(lastMessage);

  if (isNaN(first.getTime()) || isNaN(last.getTime())) {
    return 'Unknown';
  }

  const durationMs = last.getTime() - first.getTime();
  const durationSec = Math.floor(durationMs / 1000);

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

/**
 * Calculates total tokens across all messages
 */
function calculateTokenStats(session: SessionDetail) {
  let inputTokens = 0;
  let cacheWriteTokens = 0;
  let cacheReadTokens = 0;
  let outputTokens = 0;

  session.messages.forEach(msg => {
    const usage = msg.usage || {};
    inputTokens += usage.input_tokens || 0;
    cacheWriteTokens += usage.cache_creation_input_tokens || 0;
    cacheReadTokens += usage.cache_read_input_tokens || 0;
    outputTokens += usage.output_tokens || 0;
  });

  return {
    inputTokens,
    cacheWriteTokens,
    cacheReadTokens,
    outputTokens,
    totalInput: inputTokens + cacheWriteTokens + cacheReadTokens,
    totalOutput: outputTokens
  };
}

export function SummaryCard({ session }: SummaryCardProps) {
  const cacheHitRate = calculateCacheHitRate(session);
  const duration = calculateDuration(session.firstMessage, session.lastMessage);
  const tokenStats = calculateTokenStats(session);

  const mainThreadCount = session.messageCount - session.sidechainCount;

  return (
    <div className="bg-secondary border border-border rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-foreground mb-4">Session Summary</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Total Cost */}
        <div>
          <p className="text-subtle text-sm mb-1">Total Cost</p>
          <p className="text-success text-2xl font-bold">{formatCost(session.totalCost)}</p>
        </div>

        {/* Message Counts */}
        <div>
          <p className="text-subtle text-sm mb-1">Messages</p>
          <p className="text-foreground text-2xl font-bold">{formatNumber(session.messageCount)}</p>
          <p className="text-subtle text-xs mt-1">
            {formatNumber(mainThreadCount)} main, {formatNumber(session.sidechainCount)} sidechain
          </p>
        </div>

        {/* Tokens */}
        <div>
          <p className="text-subtle text-sm mb-1">Tokens</p>
          <p className="text-foreground text-2xl font-bold">
            {formatNumber(tokenStats.totalInput / 1000)}K in
          </p>
          <p className="text-subtle text-xs mt-1">
            {formatNumber(tokenStats.totalOutput / 1000)}K out
          </p>
        </div>

        {/* Cache Hit Rate */}
        <div>
          <p className="text-subtle text-sm mb-1">Cache Hit Rate</p>
          <p className="text-foreground text-2xl font-bold">{cacheHitRate}</p>
          <p className="text-subtle text-xs mt-1">
            {formatNumber(tokenStats.cacheReadTokens / 1000)}K read
          </p>
        </div>

        {/* Duration */}
        <div>
          <p className="text-subtle text-sm mb-1">Duration</p>
          <p className="text-foreground text-2xl font-bold">{duration}</p>
        </div>
      </div>

      {/* Additional Token Breakdown */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-subtle text-sm mb-2">Token Breakdown</p>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-subtle">Input: </span>
            <span className="text-foreground font-mono">{formatNumber(tokenStats.inputTokens)}</span>
          </div>
          <div>
            <span className="text-subtle">Cache Write: </span>
            <span className="text-foreground font-mono">{formatNumber(tokenStats.cacheWriteTokens)}</span>
          </div>
          <div>
            <span className="text-subtle">Cache Read: </span>
            <span className="text-foreground font-mono">{formatNumber(tokenStats.cacheReadTokens)}</span>
          </div>
          <div>
            <span className="text-subtle">Output: </span>
            <span className="text-foreground font-mono">{formatNumber(tokenStats.outputTokens)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
