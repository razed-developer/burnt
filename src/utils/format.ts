export interface DurationFormatOptions {
  /** When true, show hours as needed (e.g. 1:02:03). Default false. */
  showHours?: boolean;
}

/**
 * Format a number of seconds as M:SS or H:MM:SS.
 * Negative values are treated as zero for display.
 */
export function formatDuration(seconds: number, options: DurationFormatOptions = {}): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = String(minutes).padStart(options.showHours ? 2 : 1, "0");
  const ss = String(secs).padStart(2, "0");
  if (options.showHours && hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
