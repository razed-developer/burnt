import type { DiscInfo } from "../../types";

interface DiscStatusProps {
  disc: DiscInfo;
}

const stateMessages: Record<string, { label: string; className: string }> = {
  "no-drive": {
    label: "No CD burner found",
    className: "text-text-muted",
  },
  "no-media": {
    label: "Please insert a blank CD",
    className: "text-text-muted",
  },
  checking: {
    label: "Checking disc\u2026",
    className: "text-text-muted",
  },
  blank: {
    label: "Blank {type} CD",
    className: "text-success",
  },
  "not-blank": {
    label: "This disc is not blank",
    className: "text-warning",
  },
  "not-writable": {
    label: "This disc cannot be used for an Audio CD",
    className: "text-danger",
  },
  unknown: {
    label: "Disc status unknown",
    className: "text-text-muted",
  },
};

export function DiscStatus({ disc }: DiscStatusProps) {
  const entry = stateMessages[disc.discState] ?? stateMessages.unknown;

  let message = entry.label;
  if (disc.discState === "blank" && disc.mediaType) {
    message = message.replace("{type}", disc.mediaType);
  }

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
        Disc
      </span>
      <div className={`text-sm ${entry.className}`}>
        {disc.hasDrive && disc.driveName && (
          <div className="text-text-muted text-xs mb-0.5">{disc.driveName}</div>
        )}
        {message}
      </div>
    </div>
  );
}
