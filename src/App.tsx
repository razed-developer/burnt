import { useState, useEffect, useCallback, useRef } from 'react';
import { Edit3 } from 'lucide-react';
import {
  AudioTrack,
  BurnSettings,
  DiscCapacityType,
  OpticalDrive,
  BurnProgressState,
} from './types';
import { Header } from './components/Header/Header';
import { CapacityMeter } from './components/CapacityMeter/CapacityMeter';
import { TrackList } from './components/TrackList/TrackList';
import { DiscStatus } from './components/DiscStatus/DiscStatus';
import { BurnProgress } from './components/BurnProgress/BurnProgress';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AudioDropZone } from './components/AudioDropZone/AudioDropZone';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import {
  INITIAL_SAMPLE_TRACKS,
  EXTRA_DEMO_TRACKS,
  VIRTUAL_OPTICAL_DRIVES,
} from './utils/sampleTracks';
import { loadSettings, saveSettings } from './utils/storage';
import { inspectAudioFile, playTrackPreview, stopAudioPlayback, subscribeToPlayback } from './utils/audioDecoder';
import { formatTime } from './utils/timeFormat';

export function App() {
  // Application State
  const [cdTitle, setCdTitle] = useState('Road Trip 2026');
  const [tracks, setTracks] = useState<AudioTrack[]>(INITIAL_SAMPLE_TRACKS);
  const [capacityType, setCapacityType] = useState<DiscCapacityType>('80min');
  const [settings, setSettings] = useState<BurnSettings>(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [drives, setDrives] = useState<OpticalDrive[]>(VIRTUAL_OPTICAL_DRIVES);
  const [activeDriveId, setActiveDriveId] = useState<string>(
    settings.preferredDriveId || VIRTUAL_OPTICAL_DRIVES[0].id
  );
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Burning state
  const [burnState, setBurnState] = useState<BurnProgressState>({
    stage: 'idle',
    percent: 0,
    currentTrackIndex: 0,
    totalTracks: 0,
    currentTrackTitle: '',
    actionDescription: '',
    speed: '24x',
    logs: [],
  });

  const burnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeDrive = drives.find((d) => d.id === activeDriveId) || drives[0];

  // Capacity calculations
  const maxCapacitySeconds =
    capacityType === '80min' ? 4800 : capacityType === '74min' ? 4440 : 5400;

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Subscribe to audio player changes
  useEffect(() => {
    return subscribeToPlayback((id) => setPlayingTrackId(id));
  }, []);

  // Update settings helper
  const handleUpdateSettings = (newSettings: Partial<BurnSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  // Add files
  const handleAddFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newTracks: AudioTrack[] = [];

    for (const file of files) {
      try {
        const track = await inspectAudioFile(file);
        newTracks.push(track);
      } catch (err) {
        console.error('Failed to parse audio file:', file.name, err);
      }
    }

    if (newTracks.length > 0) {
      setTracks((prev) => [...prev, ...newTracks]);
    }
  }, []);

  // Add Sample Tracks
  const handleAddSampleTracks = () => {
    const nextSample = EXTRA_DEMO_TRACKS[tracks.length % EXTRA_DEMO_TRACKS.length];
    const clonedSample: AudioTrack = {
      ...nextSample,
      id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    setTracks((prev) => [...prev, clonedSample]);
  };

  // Track management
  const handleRemoveTrack = (id: string) => {
    if (playingTrackId === id) {
      stopAudioPlayback();
    }
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReorderTracks = (newTracks: AudioTrack[]) => {
    setTracks(newTracks);
  };

  const handleUpdateMetadata = (id: string, title: string, artist: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, artist } : t))
    );
  };

  const handleClearTracks = () => {
    stopAudioPlayback();
    setTracks([]);
  };

  // Audio preview toggle
  const handleTogglePlay = (track: AudioTrack) => {
    playTrackPreview(track);
  };

  // Drive & media actions
  const handleSelectDrive = (id: string) => {
    setActiveDriveId(id);
    handleUpdateSettings({ preferredDriveId: id });
  };

  const handleEjectDrive = () => {
    setDrives((prev) =>
      prev.map((d) =>
        d.id === activeDrive.id ? { ...d, mediaInserted: false } : d
      )
    );
  };

  const handleToggleMedia = () => {
    setDrives((prev) =>
      prev.map((d) =>
        d.id === activeDrive.id
          ? { ...d, mediaInserted: true, isBlank: true, mediaType: 'CD-R' }
          : d
      )
    );
  };

  // BURNING PIPELINE
  const handleStartBurn = () => {
    stopAudioPlayback();

    const burnSpeedStr =
      settings.burnSpeed === 'auto' ? '24x' : settings.burnSpeed;

    const initialLogs = [
      `[INIT] Burnt v1.0.0 — Red Book Audio CD Engine`,
      `[DRIVE] Target writer: ${activeDrive.name}`,
      `[MEDIA] Blank CD-R detected (${Math.round(maxCapacitySeconds / 60)} min capacity)`,
      `[SPEED] Configured write speed: ${burnSpeedStr}`,
      `[LAYOUT] Total compilation: ${tracks.length} tracks, ${formatTime(
        tracks.reduce((acc, t) => acc + t.duration, 0)
      )}`,
      `[CD-TEXT] Metadata subchannels: ${
        settings.enableCdText ? 'ENABLED (Title, Performer, Track names)' : 'DISABLED'
      }`,
      `[PREGAP] Standard index gap: ${settings.pregapSeconds} seconds`,
    ];

    setBurnState({
      stage: 'validating',
      percent: 2,
      currentTrackIndex: 0,
      totalTracks: tracks.length,
      currentTrackTitle: 'Validating Red Book audio requirements...',
      actionDescription: 'Checking track sectors and sample rates...',
      speed: burnSpeedStr,
      logs: initialLogs,
      startTime: Date.now(),
    });

    // Simulated multi-stage burn sequence
    let currentStep = 0;

    const stepInterval = setInterval(() => {
      currentStep += 1;

      if (currentStep <= 15) {
        // Stage 1: Audio Decoding & WAV PCM 16-bit 44.1kHz conversion
        const trackIdx = Math.min(
          tracks.length - 1,
          Math.floor((currentStep / 15) * tracks.length)
        );
        const activeTrack = tracks[trackIdx];

        setBurnState((prev) => ({
          ...prev,
          stage: 'decoding',
          percent: currentStep,
          currentTrackIndex: trackIdx + 1,
          currentTrackTitle: activeTrack
            ? `${activeTrack.title} — ${activeTrack.artist}`
            : 'Encoding audio',
          actionDescription: `Decoding & converting to Red Book PCM (16-bit stereo 44.1 kHz)...`,
          logs:
            currentStep % 4 === 0 && activeTrack
              ? [
                  ...prev.logs,
                  `[DECODE] Track ${trackIdx + 1}: "${activeTrack.title}" (${activeTrack.format.toUpperCase()} -> 44100Hz/16-bit WAV)`,
                ]
              : prev.logs,
        }));
      } else if (currentStep <= 25) {
        // Stage 2: CUE/TOC Sheet & Subchannel generation
        setBurnState((prev) => ({
          ...prev,
          stage: 'generating_toc',
          percent: currentStep,
          currentTrackIndex: 0,
          currentTrackTitle: 'CD-TEXT & Red Book TOC Descriptor',
          actionDescription: 'Building Table of Contents and subchannel Q/P data...',
          logs:
            currentStep === 18
              ? [
                  ...prev.logs,
                  `[TOC] Generating Disc-At-Once cue descriptor sheet...`,
                  `[CD-TEXT] Album title written: "${cdTitle || 'Audio CD'}"`,
                ]
              : prev.logs,
        }));
      } else if (currentStep <= 32) {
        // Stage 3: Lead-In writing
        setBurnState((prev) => ({
          ...prev,
          stage: 'writing_leadin',
          percent: currentStep,
          currentTrackIndex: 0,
          currentTrackTitle: 'Disc Lead-In Area',
          actionDescription: 'Calibrating OPC laser power & writing Lead-In...',
          logs:
            currentStep === 28
              ? [
                  ...prev.logs,
                  `[SCSI] Optimum Power Calibration (OPC) verified OK`,
                  `[LASER] Writing TOC Lead-In track sectors at ${burnSpeedStr}...`,
                ]
              : prev.logs,
        }));
      } else if (currentStep <= 90) {
        // Stage 4: Writing disc tracks
        const trackProgressPct = (currentStep - 32) / (90 - 32);
        const trackIdx = Math.min(
          tracks.length - 1,
          Math.floor(trackProgressPct * tracks.length)
        );
        const activeTrack = tracks[trackIdx];

        setBurnState((prev) => ({
          ...prev,
          stage: 'burning_tracks',
          percent: currentStep,
          currentTrackIndex: trackIdx + 1,
          currentTrackTitle: activeTrack
            ? `${activeTrack.title} — ${activeTrack.artist}`
            : 'Writing audio tracks',
          actionDescription: `Writing audio data to CD-R (Track ${trackIdx + 1} of ${tracks.length})...`,
          logs:
            currentStep % 8 === 0 && activeTrack
              ? [
                  ...prev.logs,
                  `[WRITE] Burning Track ${trackIdx + 1}/${tracks.length} "${activeTrack.title}" @ ${burnSpeedStr}`,
                ]
              : prev.logs,
        }));
      } else if (currentStep < 100) {
        // Stage 5: Lead-out and finalization
        setBurnState((prev) => ({
          ...prev,
          stage: 'finalizing',
          percent: currentStep,
          currentTrackIndex: tracks.length,
          currentTrackTitle: 'Disc Lead-Out & Finalization',
          actionDescription: 'Writing Lead-Out and closing session...',
          logs:
            currentStep === 94
              ? [
                  ...prev.logs,
                  `[FINALIZE] Writing Lead-Out track...`,
                  `[SESSION] Disc session closed and finalized (DAO mode).`,
                ]
              : prev.logs,
        }));
      } else {
        // Completed!
        clearInterval(stepInterval);
        setBurnState((prev) => ({
          ...prev,
          stage: 'success',
          percent: 100,
          currentTrackIndex: tracks.length,
          currentTrackTitle: 'Ready',
          actionDescription: 'Audio CD burning completed successfully!',
          logs: [
            ...prev.logs,
            `[DONE] Burn finished successfully. Disc verified.`,
            settings.ejectAfterBurn ? `[DRIVE] Tray ejected.` : `[DRIVE] Ready.`,
          ],
        }));

        if (settings.ejectAfterBurn) {
          handleEjectDrive();
        }
      }
    }, 180);

    burnTimerRef.current = stepInterval;
  };

  const handleCancelBurn = () => {
    if (burnTimerRef.current) {
      clearInterval(burnTimerRef.current);
      burnTimerRef.current = null;
    }
    setBurnState((prev) => ({
      ...prev,
      stage: 'failed',
      errorMessage: 'Burn operation was cancelled by user.',
      logs: [...prev.logs, '[ABORT] Burning cancelled by user.'],
    }));
  };

  const handleBurnAnother = () => {
    if (burnTimerRef.current) {
      clearInterval(burnTimerRef.current);
    }
    setDrives((prev) =>
      prev.map((d) =>
        d.id === activeDrive.id
          ? { ...d, mediaInserted: true, isBlank: true, mediaType: 'CD-R' }
          : d
      )
    );
    handleStartBurn();
  };

  const handleReturnToEditor = () => {
    if (burnTimerRef.current) {
      clearInterval(burnTimerRef.current);
    }
    setBurnState((prev) => ({ ...prev, stage: 'idle' }));
  };

  const isBurningOrComplete =
    burnState.stage !== 'idle';

  return (
    <AudioDropZone onFilesDropped={handleAddFiles}>
      <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-orange-500 selection:text-white transition-colors">
        {/* Desktop Title Header */}
        <Header
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeDrive={activeDrive}
          drives={drives}
          onSelectDrive={handleSelectDrive}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
          {isBurningOrComplete ? (
            /* Burning Progress or Completion Screen */
            <BurnProgress
              state={burnState}
              cdTitle={cdTitle}
              tracks={tracks}
              activeDrive={activeDrive}
              onBurnAnother={handleBurnAnother}
              onCancelBurn={handleCancelBurn}
              onEject={handleEjectDrive}
              onReturnToEditor={handleReturnToEditor}
              enableCdText={settings.enableCdText}
            />
          ) : (
            /* Main Audio CD Editor View */
            <div className="flex flex-col gap-4">
              {/* CD Title Input Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="cd-title-input"
                    className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>CD Title (CD-TEXT Album Name)</span>
                  </label>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Red Book standard
                  </span>
                </div>
                <input
                  id="cd-title-input"
                  type="text"
                  value={cdTitle}
                  onChange={(e) => setCdTitle(e.target.value)}
                  placeholder="Enter CD Album Title (e.g. Summer Mix 2026)"
                  className="w-full text-base sm:text-lg font-bold bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3.5 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 placeholder:font-normal placeholder:text-neutral-400 transition-all"
                />
              </div>

              {/* Tracks Section */}
              <TrackList
                tracks={tracks}
                onAddFiles={handleAddFiles}
                onAddSampleTracks={handleAddSampleTracks}
                onRemoveTrack={handleRemoveTrack}
                onReorderTracks={handleReorderTracks}
                onUpdateMetadata={handleUpdateMetadata}
                onClearTracks={handleClearTracks}
                playingTrackId={playingTrackId}
                onTogglePlay={handleTogglePlay}
              />

              {/* Disc Capacity Meter */}
              <CapacityMeter
                tracks={tracks}
                capacityType={capacityType}
                onCapacityTypeChange={setCapacityType}
                maxSeconds={maxCapacitySeconds}
              />

              {/* Drive Status & Burn Primary Action */}
              <DiscStatus
                activeDrive={activeDrive}
                tracks={tracks}
                maxSeconds={maxCapacitySeconds}
                onBurn={handleStartBurn}
                onEject={handleEjectDrive}
                onToggleMedia={handleToggleMedia}
              />
            </div>
          )}
        </main>

        {/* Mini Preview Audio Player */}
        <AudioPlayerBar tracks={tracks} />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          drives={drives}
        />
      </div>
    </AudioDropZone>
  );
}
