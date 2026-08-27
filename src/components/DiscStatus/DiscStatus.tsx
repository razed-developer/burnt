import React from 'react';
import { Disc3, Flame, CheckCircle2, AlertTriangle, Disc } from 'lucide-react';
import { OpticalDrive, AudioTrack } from '../../types';

interface DiscStatusProps {
  activeDrive: OpticalDrive;
  tracks: AudioTrack[];
  maxSeconds: number;
  onBurn: () => void;
  onEject: () => void;
  onToggleMedia: () => void;
}

export const DiscStatus: React.FC<DiscStatusProps> = ({
  activeDrive,
  tracks,
  maxSeconds,
  onBurn,
  onEject,
  onToggleMedia,
}) => {
  const totalSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);
  const isOverCapacity = totalSeconds > maxSeconds;
  const hasTracks = tracks.length > 0;
  const hasErrorTracks = tracks.some((t) => t.status === 'error');
  const isReadyToBurn =
    hasTracks &&
    !isOverCapacity &&
    !hasErrorTracks &&
    activeDrive.mediaInserted &&
    activeDrive.isBlank;

  let disabledReason = '';
  if (!hasTracks) {
    disabledReason = 'Add at least one audio track to burn.';
  } else if (isOverCapacity) {
    disabledReason = 'Compilation exceeds disc capacity. Remove tracks or switch disc size.';
  } else if (hasErrorTracks) {
    disabledReason = 'One or more audio tracks failed to load. Remove or replace them.';
  } else if (!activeDrive.mediaInserted) {
    disabledReason = 'Please insert a blank CD-R into the optical drive.';
  } else if (!activeDrive.isBlank) {
    disabledReason = 'Inserted disc is not blank.';
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Left: Media Status */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            activeDrive.mediaInserted && activeDrive.isBlank
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Disc3 className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            {activeDrive.mediaInserted && activeDrive.isBlank ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Blank {Math.round(maxSeconds / 60)}-minute {activeDrive.mediaType} Ready
              </span>
            ) : !activeDrive.mediaInserted ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <Disc className="w-3.5 h-3.5" />
                No disc inserted
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                This disc is not blank
              </span>
            )}

            {/* Quick eject / insert simulation toggle */}
            <button
              type="button"
              onClick={activeDrive.mediaInserted ? onEject : onToggleMedia}
              className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 underline decoration-dotted ml-2 cursor-pointer"
              title="Eject or insert media into drive"
            >
              {activeDrive.mediaInserted ? '⏏ Eject' : 'Insert Blank CD'}
            </button>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[280px] sm:max-w-xs mt-0.5 font-medium">
            {activeDrive.name}
          </p>
        </div>
      </div>

      {/* Right: Burn Action & Explanation */}
      <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1.5">
        <button
          type="button"
          disabled={!isReadyToBurn}
          onClick={onBurn}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
            isReadyToBurn
              ? 'bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white shadow-orange-600/20 cursor-pointer'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-300/60 dark:border-neutral-700/60'
          }`}
        >
          <Flame className={`w-4 h-4 ${isReadyToBurn ? 'text-orange-200' : 'text-neutral-400'}`} />
          <span>Burn Audio CD</span>
        </button>

        {!isReadyToBurn && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            {disabledReason}
          </span>
        )}
      </div>
    </div>
  );
};
