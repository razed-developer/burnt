import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Disc,
  Flame,
  Terminal,
  RotateCcw,
  FileCode,
  Download,
  AlertOctagon,
} from 'lucide-react';
import { BurnProgressState, AudioTrack, OpticalDrive } from '../../types';
import { formatTime } from '../../utils/timeFormat';
import {
  generateCueSheet,
  generateTocSheet,
  downloadTextFile,
} from '../../utils/audioDecoder';

interface BurnProgressProps {
  state: BurnProgressState;
  cdTitle: string;
  tracks: AudioTrack[];
  activeDrive: OpticalDrive;
  onBurnAnother: () => void;
  onCancelBurn: () => void;
  onEject: () => void;
  onReturnToEditor: () => void;
  enableCdText: boolean;
}

export const BurnProgress: React.FC<BurnProgressProps> = ({
  state,
  cdTitle,
  tracks,
  activeDrive,
  onBurnAnother,
  onCancelBurn,
  onEject,
  onReturnToEditor,
  enableCdText,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const totalSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);

  const handleExportCue = () => {
    const cue = generateCueSheet(cdTitle, tracks, enableCdText);
    downloadTextFile(`${cdTitle || 'Audio_CD'}.cue`, cue);
  };

  const handleExportToc = () => {
    const toc = generateTocSheet(cdTitle, tracks, enableCdText);
    downloadTextFile(`${cdTitle || 'Audio_CD'}.toc`, toc);
  };

  // SUCCESS STATE
  if (state.stage === 'success') {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-sm transition-colors text-center max-w-xl mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          Your CD is ready.
        </h2>
        <p className="text-base font-semibold text-orange-600 dark:text-orange-400 mb-1">
          {cdTitle || 'Untitled Audio CD'}
        </p>
        <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-6">
          {tracks.length} tracks • {formatTime(totalSeconds)} playing time • Red Book 16-bit 44.1kHz
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={onEject}
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-semibold border border-neutral-300/80 dark:border-neutral-700 transition-colors"
          >
            ⏏ Eject CD
          </button>
          <button
            type="button"
            onClick={onBurnAnother}
            className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
          >
            Burn Another
          </button>
          <button
            type="button"
            onClick={onReturnToEditor}
            className="w-full sm:w-auto px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            Edit Tracklist
          </button>
        </div>

        {/* Additional export tools */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={handleExportCue}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 flex items-center gap-1.5 font-mono"
          >
            <FileCode className="w-3.5 h-3.5 text-orange-500" />
            Download CUE Sheet
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <button
            type="button"
            onClick={handleExportToc}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 flex items-center gap-1.5 font-mono"
          >
            <Download className="w-3.5 h-3.5 text-orange-500" />
            Download TOC Sheet
          </button>
        </div>
      </div>
    );
  }

  // FAILURE STATE
  if (state.stage === 'failed') {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-sm transition-colors text-center max-w-xl mx-auto my-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
          <XCircle className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          The CD couldn't be written.
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2 max-w-md mx-auto">
          {state.errorMessage || 'The disc may be damaged or incompatible with your drive.'}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          Try another blank CD-R and burn again. Your track list and title have been preserved.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={onBurnAnother}
            className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <button
            type="button"
            onClick={onReturnToEditor}
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Editor
          </button>
        </div>

        {/* Technical logs toggle */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 text-left">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 flex items-center gap-1.5 mx-auto"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showLogs ? 'Hide technical details' : 'Show technical details'}</span>
          </button>

          {showLogs && (
            <div className="mt-3 bg-neutral-950 text-neutral-300 font-mono text-[11px] p-3 rounded-lg max-h-48 overflow-y-auto border border-neutral-800">
              {state.logs.map((log, i) => (
                <div key={i} className="py-0.5 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ACTIVE BURNING PROGRESS
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors max-w-xl mx-auto my-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Burning &ldquo;{cdTitle || 'Audio CD'}&rdquo;
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Drive: {activeDrive.name} ({state.speed || '24x'})
            </p>
          </div>
        </div>

        <span className="font-mono text-lg font-bold text-orange-600 dark:text-orange-400">
          {Math.round(state.percent)}%
        </span>
      </div>

      {/* Main Progress Bar */}
      <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-4 border border-neutral-200 dark:border-neutral-700">
        <div
          className="h-full bg-orange-600 dark:bg-orange-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(2, state.percent)}%` }}
        />
      </div>

      {/* Active Stage & Action */}
      <div className="bg-neutral-50 dark:bg-neutral-850 rounded-xl p-4 border border-neutral-200/80 dark:border-neutral-800 mb-6">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            {state.actionDescription || 'Processing compilation...'}
          </span>
          <span className="font-mono text-neutral-500 dark:text-neutral-400">
            {state.currentTrackIndex > 0
              ? `Track ${state.currentTrackIndex} of ${state.totalTracks}`
              : 'Preparing'}
          </span>
        </div>

        {state.currentTrackTitle && (
          <div className="text-xs font-mono text-orange-600 dark:text-orange-400 truncate mt-1 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span>{state.currentTrackTitle}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Please don&rsquo;t eject the disc or disconnect the drive during write operations.</span>
        </div>
      </div>

      {/* Bottom controls & Technical log view */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 flex items-center gap-1.5"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showLogs ? 'Hide logs' : 'Show live write logs'}</span>
        </button>

        <button
          type="button"
          onClick={onCancelBurn}
          className="text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium px-2 py-1 rounded"
        >
          Cancel
        </button>
      </div>

      {showLogs && (
        <div className="mt-3 bg-neutral-950 text-neutral-300 font-mono text-[11px] p-3 rounded-lg max-h-36 overflow-y-auto border border-neutral-800">
          {state.logs.map((log, i) => (
            <div key={i} className="py-0.5 leading-relaxed">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
