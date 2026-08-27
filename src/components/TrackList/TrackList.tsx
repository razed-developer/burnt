import "./TrackList.css";
import TrackRow from "../TrackRow/TrackRow";
import AddAudioButton from "../AddAudioButton/AddAudioButton";
import { useApp } from "../../app/AppContext";
import { formatDuration } from "../../utils/format";

/**
 * The track list: ordered rows plus a running total. Reordering and removal
 * are delegated up to the app state.
 */
export default function TrackList() {
  const { tracks, removeTrack, moveTrack } = useApp();

  const total = tracks.reduce((sum, t) => sum + (t.valid ? t.durationSeconds : 0), 0);

  if (tracks.length === 0) {
    return null;
  }

  const invalidCount = tracks.filter((t) => !t.valid).length;

  return (
    <section className="tracklist section-block" aria-label="Tracks">
      <div className="section-header">
        <h2 className="section-title">Tracks</h2>
        <span className="tracklist-total">{formatDuration(total, { showHours: true })}</span>
      </div>

      <ul className="tracklist-rows">
        {tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            trackNumber={i + 1}
            isLast={i === tracks.length - 1}
            onRemove={removeTrack}
            onMove={moveTrack}
          />
        ))}
      </ul>

      {invalidCount > 0 && (
        <p className="tracklist-warning">
          {invalidCount} track{invalidCount === 1 ? "" : "s"} couldn't be read and must be removed before burning.
        </p>
      )}

      <div className="tracklist-add">
        <AddAudioButton />
      </div>
    </section>
  );
}
