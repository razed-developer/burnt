interface TrackRowProps {
  index: number;
  title: string;
  artist: string | null;
  duration: number;
  isValid: boolean;
  errorMessage?: string;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: Record<string, unknown>;
  isFirst: boolean;
  isLast: boolean;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TrackRow({
  index,
  title,
  artist,
  duration,
  isValid,
  errorMessage,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: TrackRowProps) {
  const displayName = artist ? `${artist} \u2014 ${title}` : title;

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 rounded transition-colors ${
        isValid
          ? "hover:bg-surface-overlay"
          : "bg-danger/5 border border-danger/20"
      }`}
      draggable
    >
      <span className="flex items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-text-faint hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Move track up"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="text-text-faint hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Move track down"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 10L2 5H10L6 10Z" fill="currentColor" />
          </svg>
        </button>
      </span>

      <span className="text-xs font-medium text-text-faint w-5 text-right tabular-nums">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        {isValid ? (
          <div className="truncate text-sm">{displayName}</div>
        ) : (
          <div>
            <div className="truncate text-sm text-danger">{title}</div>
            {errorMessage && (
              <div className="text-xs text-danger/70 mt-0.5">{errorMessage}</div>
            )}
          </div>
        )}
      </div>

      <span className="text-xs text-text-muted tabular-nums shrink-0">
        {formatDuration(duration)}
      </span>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger transition-opacity p-1"
        aria-label="Remove track"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
