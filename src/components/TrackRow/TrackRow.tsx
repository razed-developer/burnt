import "./TrackRow.css";
import { formatDuration } from "../../utils/format";
import type { AudioTrack } from "../../types";

interface TrackRowProps {
  track: AudioTrack;
  index: number;
  trackNumber: number;
  isLast: boolean;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
}

/**
 * A single track row showing number, title, duration, and a remove action.
 * Supports keyboard-driven reordering via up/down buttons as an accessible
 * alternative to drag-and-drop.
 */
export default function TrackRow({ track, index, trackNumber, isLast, onRemove, onMove }: TrackRowProps) {
  return (
    <li className="track-row">
      <span className="track-index">{String(trackNumber).padStart(2, "0")}</span>
      <div className="track-info">
        <span className={"track-title" + (track.valid ? "" : " invalid")}>{track.displayTitle}</span>
        {track.valid === false && track.errorMessage && <span className="track-error">{track.errorMessage}</span>}
      </div>
      {track.valid ? (
        <span className="track-duration">{formatDuration(track.durationSeconds)}</span>
      ) : (
        <span className="track-duration invalid">—</span>
      )}
      <div className="track-actions">
        <button
          className="icon-btn"
          aria-label={`Move ${track.displayTitle} up`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          ↑
        </button>
        <button
          className="icon-btn"
          aria-label={`Move ${track.displayTitle} down`}
          disabled={isLast}
          onClick={() => onMove(index, index + 1)}
        >
          ↓
        </button>
        <button className="icon-btn remove" aria-label={`Remove ${track.displayTitle}`} onClick={() => onRemove(track.id)}>
          ×
        </button>
      </div>
    </li>
  );
}
