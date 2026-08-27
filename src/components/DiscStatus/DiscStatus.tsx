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
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium uppercase tracking-wide text-xs text-text-faint shrink-0">
        Disc
      </span>
      <span className="text-text-faint">{"\u00B7"}</span>
      {disc.hasDrive && disc.driveName && (
        <span className="text-text-muted text-xs">{disc.driveName}</span>
      )}
      <span className={entry.className + " text-xs"}>
        {message}
      </span>
    </div>
  );
}
