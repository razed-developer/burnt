import { ChevronDown, ChevronUp, GripVertical, Music2, Trash2 } from "lucide-react";
import type { Track } from "../types/burner";
import { formatDuration } from "../utils/time";

interface TrackListProps {
  tracks: Track[];
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

export function TrackList({ tracks, onRemove, onMove, onReorder }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="empty-tracks">
        <Music2 size={30} strokeWidth={1.5} />
        <strong>No music added yet</strong>
        <span>Add the songs you want on this CD.</span>
      </div>
    );
  }

  return (
    <ol className="track-list">
      {tracks.map((track, index) => (
        <li
          className="track-row"
          key={track.id}
          draggable
          onDragStart={(event) => event.dataTransfer.setData("text/plain", track.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onReorder(event.dataTransfer.getData("text/plain"), track.id);
          }}
        >
          <GripVertical className="drag-handle" size={19} aria-hidden="true" />
          <span className="track-number">{index + 1}</span>
          <div className="track-copy">
            <strong title={track.name}>{track.name.replace(/\.[^.]+$/, "")}</strong>
            <small>{track.durationSeconds ? formatDuration(track.durationSeconds) : "Duration pending"}</small>
          </div>
          <div className="row-actions">
            <button className="icon-button" disabled={index === 0} onClick={() => onMove(track.id, -1)} title="Move up"><ChevronUp size={17} /></button>
            <button className="icon-button" disabled={index === tracks.length - 1} onClick={() => onMove(track.id, 1)} title="Move down"><ChevronDown size={17} /></button>
            <button className="icon-button danger" onClick={() => onRemove(track.id)} title="Remove"><Trash2 size={17} /></button>
          </div>
        </li>
      ))}
    </ol>
  );
}
