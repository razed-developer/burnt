import React, { useState } from 'react';
import {
  GripVertical,
  Play,
  Pause,
  X,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { AudioTrack } from '../../types';
import { formatTime } from '../../utils/timeFormat';

interface TrackRowProps {
  track: AudioTrack;
  index: number;
  totalTracks: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateMetadata: (title: string, artist: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  totalTracks,
  isPlaying,
  onPlayToggle,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdateMetadata,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(track.title);
  const [editArtist, setEditArtist] = useState(track.artist);

  const formattedTrackNumber = (index + 1).toString().padStart(2, '0');

  const handleSaveEdit = () => {
    onUpdateMetadata(editTitle.trim() || track.title, editArtist.trim() || track.artist);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(track.title);
      setEditArtist(track.artist);
      setIsEditing(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all ${
        isPlaying
          ? 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/60 shadow-xs'
          : 'bg-white dark:bg-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-neutral-800'
      }`}
    >
      {/* Left side: Drag handle, index number, play button, and title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Drag handle */}
        <div
          className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-grab active:cursor-grabbing p-1 -ml-1"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Up/Down buttons for keyboard/click accessibility */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label={`Move track ${formattedTrackNumber} up`}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 disabled:hover:text-neutral-400"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={index === totalTracks - 1}
            onClick={onMoveDown}
            aria-label={`Move track ${formattedTrackNumber} down`}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 disabled:hover:text-neutral-400"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Track number */}
        <span className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 w-5 shrink-0">
          {formattedTrackNumber}
        </span>

        {/* Play/preview button */}
        <button
          type="button"
          onClick={onPlayToggle}
          aria-label={isPlaying ? `Pause preview for ${track.title}` : `Play preview for ${track.title}`}
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isPlaying
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-750 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {/* Track Title & Artist */}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2" onBlur={handleSaveEdit}>
              <input
                type="text"
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Artist"
                className="text-xs bg-white dark:bg-neutral-800 border border-orange-500 rounded px-1.5 py-0.5 w-1/3 focus:outline-none"
              />
              <span className="text-neutral-400 text-xs">—</span>
              <input
                type="text"
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Track Title"
                className="text-xs font-semibold bg-white dark:bg-neutral-800 border border-orange-500 rounded px-1.5 py-0.5 flex-1 focus:outline-none"
              />
            </div>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => setIsEditing(true)}
              title="Click to edit track metadata"
            >
              <div className="flex items-baseline gap-2 truncate">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {track.title}
                </span>
                {track.artist && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    — {track.artist}
                  </span>
                )}
              </div>
              {track.status === 'error' && (
                <div className="flex items-center gap-1 text-[11px] text-red-500 mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{track.errorMessage || 'Failed to decode audio'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Format badge, duration, and remove button */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Format badge */}
        <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-750">
          {track.format}
        </span>

        {/* Duration */}
        <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 w-12 text-right">
          {formatTime(track.duration)}
        </span>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove track ${track.title}`}
          title="Remove track"
          className="p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
