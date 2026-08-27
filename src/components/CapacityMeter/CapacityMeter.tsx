interface CapacityMeterProps {
  usedSeconds: number;
  maxSeconds: number;
}

export function CapacityMeter({ usedSeconds, maxSeconds }: CapacityMeterProps) {
  const ratio = maxSeconds > 0 ? Math.min(usedSeconds / maxSeconds, 1) : 0;
  const isOver = usedSeconds > maxSeconds;
  const overSeconds = isOver ? usedSeconds - maxSeconds : 0;

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span className="font-medium uppercase tracking-wide text-xs text-text-faint">
          Disc Capacity
        </span>
        {isOver ? (
          <span className="text-danger font-medium">
            {format(usedSeconds)} &mdash; {format(overSeconds)} too long
          </span>
        ) : (
          <span>
            {format(usedSeconds)} used
            <span className="text-text-faint"> &middot; </span>
            {format(maxSeconds - usedSeconds)} remaining
          </span>
        )}
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded bg-surface-overlay">
        <div
          className={`absolute inset-y-0 left-0 rounded transition-all duration-300 ${
            isOver
              ? "bg-danger"
              : ratio > 0.9
                ? "bg-warning"
                : "bg-accent"
          }`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>

      <div className="text-right text-xs text-text-faint">
        {format(maxSeconds)} max
      </div>
    </div>
  );
}
