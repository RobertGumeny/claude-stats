import { useClipboard } from '../hooks/useClipboard';

interface CopyButtonProps {
  text: string;
  /** Optional label shown beside the icon (screen-reader accessible) */
  label?: string;
  className?: string;
}

/**
 * Small inline button that copies `text` to clipboard.
 * Shows a checkmark icon for 2 s after a successful copy.
 */
export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const { copy, copied } = useClipboard();

  const handleClick = (e: React.MouseEvent) => {
    // Prevent row expansion or parent click handlers
    e.stopPropagation();
    copy(text);
  };

  return (
    <button
      onClick={handleClick}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      aria-label={label ? `Copy ${label}` : 'Copy to clipboard'}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors
        ${copied
          ? 'text-green-400 bg-green-400/10'
          : 'text-subtle hover:text-foreground hover:bg-tertiary'
        } ${className}`}
    >
      {copied ? (
        /* Checkmark icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        /* Clipboard icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
      )}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}
