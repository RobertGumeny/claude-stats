import { useState } from 'react';
import { TokenUsage } from '../types';
import { formatNumber } from '../utils/formatters';

interface TokenBarProps {
  usage: TokenUsage;
}

interface Segment {
  label: string;
  count: number;
  /** Tailwind bg color class */
  color: string;
  /** Tailwind text color class used in tooltip */
  textColor: string;
}

export function buildSegments(usage: TokenUsage): Segment[] {
  return [
    {
      label: 'Input',
      count: usage.input_tokens || 0,
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
    },
    {
      label: 'Cache Write',
      count: usage.cache_creation_input_tokens || 0,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
    },
    {
      label: 'Cache Read',
      count: usage.cache_read_input_tokens || 0,
      color: 'bg-green-500',
      textColor: 'text-green-400',
    },
    {
      label: 'Output',
      count: usage.output_tokens || 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
    },
  ];
}

/**
 * Inline horizontal bar chart showing token type distribution.
 * Tooltip on hover shows exact counts per type.
 */
export function TokenBar({ usage }: TokenBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const segments = buildSegments(usage);
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  // If no tokens at all (e.g. user messages), render nothing
  if (total === 0) {
    return null;
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Bar */}
      <div
        className="flex h-2 w-16 rounded overflow-hidden bg-tertiary shrink-0"
        role="img"
        aria-label={`Token distribution: ${segments.map((s) => `${s.label} ${formatNumber(s.count)}`).join(', ')}`}
      >
        {segments.map((seg) => {
          if (seg.count === 0) return null;
          const pct = (seg.count / total) * 100;
          return (
            <div
              key={seg.label}
              className={`${seg.color} shrink-0`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-primary border border-border rounded shadow-lg px-3 py-2 text-xs whitespace-nowrap">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2 py-0.5">
                <span className={`font-semibold ${seg.textColor} w-20`}>{seg.label}</span>
                <span className="text-foreground font-mono">{formatNumber(seg.count)}</span>
              </div>
            ))}
            <div className="border-t border-border mt-1 pt-1 flex items-center gap-2">
              <span className="text-subtle w-20">Total</span>
              <span className="text-foreground font-mono">{formatNumber(total)}</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-primary border-r border-b border-border rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}
