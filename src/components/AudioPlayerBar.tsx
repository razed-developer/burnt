import { useEffect, useState } from 'react';
import { Pause, Square } from 'lucide-react';
import { AudioTrack } from '../types';
import {
  playTrackPreview,
  stopAudioPlayback,
  subscribeToPlayback,
  getActivePlayingTrackId,
} from '../utils/audioDecoder';
import { formatTime } from '../utils/timeFormat';

interface AudioPlayerBarProps {
  tracks: AudioTrack[];
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ tracks }) => {
  const [activeId, setActiveId] = useState<string | null>(getActivePlayingTrackId());

  useEffect(() => {
    return subscribeToPlayback((trackId) => {
      setActiveId(trackId);
    });
  }, []);

  if (!activeId) return null;

  const currentTrack = tracks.find((t) => t.id === activeId);
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 text-white dark:bg-neutral-800/95 border border-neutral-700/80 rounded-full px-5 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-bottom-3 duration-200">
      {/* Animated sound bars */}
      <div className="flex items-end gap-0.5 h-4 w-5">
        <span className="w-1 bg-orange-500 rounded-full animate-[bounce_0.8s_infinite] h-3" />
        <span className="w-1 bg-orange-400 rounded-full animate-[bounce_0.6s_infinite] h-4" />
        <span className="w-1 bg-orange-500 rounded-full animate-[bounce_0.9s_infinite] h-2.5" />
      </div>

      <div className="flex items-baseline gap-2 max-w-[200px] sm:max-w-xs truncate">
        <span className="text-xs font-bold text-white truncate">
          {currentTrack.title}
        </span>
        <span className="text-[11px] text-neutral-400 truncate">
          {currentTrack.artist}
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
          ({formatTime(currentTrack.duration)})
        </span>
      </div>

      <div className="flex items-center gap-1.5 border-l border-neutral-700 pl-3">
        <button
          type="button"
          onClick={() => playTrackPreview(currentTrack)}
          aria-label="Pause audio preview"
          className="p-1 text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded-full transition-colors"
        >
          <Pause className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={stopAudioPlayback}
          aria-label="Stop audio preview"
          className="p-1 text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded-full transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
