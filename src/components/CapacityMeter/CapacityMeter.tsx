import React from 'react';
import { AlertCircle, Disc, Info } from 'lucide-react';
import { AudioTrack, DiscCapacityType } from '../../types';
import { formatTime, secondsToSectors } from '../../utils/timeFormat';

interface CapacityMeterProps {
  tracks: AudioTrack[];
  capacityType: DiscCapacityType;
  onCapacityTypeChange: (type: DiscCapacityType) => void;
  maxSeconds: number;
}

export const CapacityMeter: React.FC<CapacityMeterProps> = ({
  tracks,
  capacityType,
  onCapacityTypeChange,
  maxSeconds,
}) => {
  const totalSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);
  const remainingSeconds = maxSeconds - totalSeconds;
  const isOverCapacity = totalSeconds > maxSeconds;
  const isNearCapacity = !isOverCapacity && remainingSeconds < 300; // within 5 mins
  const usagePercentage = Math.min(100, (totalSeconds / maxSeconds) * 100);
  const totalSectors = secondsToSectors(totalSeconds);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            Disc Capacity
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
            ({tracks.length}/99 tracks • {totalSectors.toLocaleString()} sectors)
          </span>
        </div>

        {/* Capacity spec selector */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => onCapacityTypeChange('80min')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              capacityType === '80min'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            80 min (700 MB)
          </button>
          <button
            type="button"
            onClick={() => onCapacityTypeChange('74min')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              capacityType === '74min'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            74 min (650 MB)
          </button>
        </div>
      </div>

      {/* Visual Meter Bar */}
      <div className="w-full h-4 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden flex relative border border-neutral-200/70 dark:border-neutral-700/60">
        {/* Track segments */}
        {tracks.map((track, idx) => {
          const trackPct = (track.duration / maxSeconds) * 100;
          return (
            <div
              key={track.id}
              style={{ width: `${trackPct}%` }}
              title={`#${idx + 1}: ${track.title} (${formatTime(track.duration)})`}
              className={`h-full border-r border-white/20 dark:border-black/20 transition-all duration-300 ${
                isOverCapacity
                  ? 'bg-red-500 dark:bg-red-600'
                  : isNearCapacity
                  ? 'bg-amber-500 dark:bg-amber-600'
                  : 'bg-orange-600 dark:bg-orange-500'
              }`}
            />
          );
        })}

        {/* 80 min marker if custom */}
        {usagePercentage === 0 && (
          <div className="w-full flex items-center justify-center text-[10px] text-neutral-400 font-mono">
            Empty Disc ({formatTime(maxSeconds)})
          </div>
        )}
      </div>

      {/* Metrics labels */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 text-sm gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-base">
            {formatTime(totalSeconds)}
          </span>
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            used of {formatTime(maxSeconds)} total
          </span>
        </div>

        <div>
          {isOverCapacity ? (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {formatTime(Math.abs(remainingSeconds))} too long (disc full)
              </span>
            </div>
          ) : isNearCapacity ? (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>{formatTime(remainingSeconds)} remaining (near limit)</span>
            </div>
          ) : (
            <span className="font-mono text-neutral-600 dark:text-neutral-300 text-xs">
              <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                {formatTime(remainingSeconds)}
              </strong>{' '}
              remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
