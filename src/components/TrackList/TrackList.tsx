import type { Track } from "../../types";
import { TrackRow } from "../TrackRow/TrackRow";

interface TrackListProps {
  tracks: Track[];
  onRemove: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function TrackList({ tracks, onRemove, onMove }: TrackListProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {tracks.map((track, index) => (
        <TrackRow
          key={track.id}
          index={index}
          title={track.title}
          artist={track.artist}
          duration={track.duration}
          isValid={track.isValid}
          errorMessage={track.errorMessage}
          onRemove={() => onRemove(track.id)}
          onMoveUp={() => {
            if (index > 0) onMove(index, index - 1);
          }}
          onMoveDown={() => {
            if (index < tracks.length - 1) onMove(index, index + 1);
          }}
          isFirst={index === 0}
          isLast={index === tracks.length - 1}
        />
      ))}
    </div>
  );
}
