import React, { useRef, useState } from 'react';
import { Plus, Music2, FolderPlus, Sparkles, Trash2 } from 'lucide-react';
import { AudioTrack } from '../../types';
import { TrackRow } from '../TrackRow/TrackRow';
import { formatTime } from '../../utils/timeFormat';

interface TrackListProps {
  tracks: AudioTrack[];
  onAddFiles: (files: FileList | File[]) => void;
  onAddSampleTracks: () => void;
  onRemoveTrack: (id: string) => void;
  onReorderTracks: (newTracks: AudioTrack[]) => void;
  onUpdateMetadata: (id: string, title: string, artist: string) => void;
  onClearTracks: () => void;
  playingTrackId: string | null;
  onTogglePlay: (track: AudioTrack) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onAddFiles,
  onAddSampleTracks,
  onRemoveTrack,
  onReorderTracks,
  onUpdateMetadata,
  onClearTracks,
  playingTrackId,
  onTogglePlay,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...tracks];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    onReorderTracks(reordered);
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...tracks];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    onReorderTracks(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === tracks.length - 1) return;
    const reordered = [...tracks];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    onReorderTracks(reordered);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col min-h-[340px]">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="audio/*,.mp3,.flac,.wav,.m4a,.ogg,.aac,.aiff,.opus"
        className="hidden"
        id="audio-file-input"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            Tracks
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
            ({tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} • {formatTime(totalDuration)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tracks.length > 0 && (
            <button
              type="button"
              onClick={onClearTracks}
              className="text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded transition-colors"
              title="Clear all tracks"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear List</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Audio Files</span>
          </button>
        </div>
      </div>

      {/* Track list content or Empty State */}
      {tracks.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 border-2 border-dashed border-neutral-300 dark:border-neutral-750 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-850/40"
        >
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-1">
            Drop your music here
          </h3>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-4">
            MP3 • FLAC • WAV • M4A • OGG • AAC
          </p>

          <div className="flex flex-wrap gap-2 items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 text-neutral-800 dark:text-neutral-200 text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              + Browse Files
            </button>
            <button
              type="button"
              onClick={onAddSampleTracks}
              className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Compilation
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              totalTracks={tracks.length}
              isPlaying={playingTrackId === track.id}
              onPlayToggle={() => onTogglePlay(track)}
              onRemove={() => onRemoveTrack(track.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onUpdateMetadata={(title, artist) => onUpdateMetadata(track.id, title, artist)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}

          {/* Quick add bottom bar */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Audio Files</span>
            </button>
            <button
              type="button"
              onClick={onAddSampleTracks}
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>Add Demo Track</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
