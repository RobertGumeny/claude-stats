import { Session } from '../types';
import { formatTimestampRange, truncateSessionId, formatCost, formatNumber } from '../utils/formatters';

interface SessionCardProps {
  session: Session;
  onClick: () => void;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  // Determine badge color based on sidechain percentage
  const getBadgeColor = (percentage: number) => {
    if (percentage > 70) return 'bg-accent-warning text-white';
    if (percentage > 40) return 'bg-amber-500 text-white';
    return 'bg-zinc-600 text-slate-300';
  };

  return (
    <div
      onClick={onClick}
      className="bg-background-secondary border border-border-primary rounded-lg p-4 hover:border-accent-primary cursor-pointer transition-colors"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-lg truncate mb-1">
            {session.filename}
          </h3>
          <div className="flex items-center gap-2 text-sm text-text-tertiary font-mono">
            <span className="truncate">ID: {truncateSessionId(session.sessionId)}</span>
          </div>
        </div>

        {/* Cost Display */}
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-accent-cost text-xl font-bold">
            {formatCost(session.totalCost)}
          </p>
        </div>
      </div>

      {/* Timestamp Range */}
      <div className="text-text-secondary text-sm mb-3">
        <span className="text-text-tertiary">⏱</span>{' '}
        {formatTimestampRange(session.firstMessage, session.lastMessage)}
      </div>

      {/* Session Metadata */}
      <div className="flex items-center gap-4 text-sm">
        {/* Message Count */}
        <div className="text-text-secondary">
          <span className="text-text-tertiary">Messages:</span>{' '}
          <span className="font-semibold">{formatNumber(session.messageCount)}</span>
        </div>

        {/* Total Tokens */}
        <div className="text-text-secondary">
          <span className="text-text-tertiary">Tokens:</span>{' '}
          <span className="font-semibold">{formatNumber(session.totalTokens)}</span>
        </div>

        {/* Sidechain Percentage Badge */}
        <div className="ml-auto">
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(
              session.sidechainPercentage
            )}`}
          >
            {session.sidechainPercentage}% sidechain
          </span>
        </div>
      </div>
    </div>
  );
}
