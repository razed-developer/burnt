import { useState, useCallback } from "react";
import { useTrackList } from "../../hooks/useTrackList";
import { useDiscInfo } from "../../hooks/useDiscInfo";
import type { Settings, BurnStatus } from "../../types";
import { MAX_CD_SECONDS } from "../../types";
import { AudioDropZone } from "../../components/AudioDropZone/AudioDropZone";
import { TrackList } from "../../components/TrackList/TrackList";
import { CapacityMeter } from "../../components/CapacityMeter/CapacityMeter";
import { DiscStatus } from "../../components/DiscStatus/DiscStatus";
import { BurnProgress } from "../../components/BurnProgress/BurnProgress";
import { formatDuration } from "../../utils/timeFormat";

interface BurnerPageProps {
  settings: Settings;
  onOpenSettings: () => void;
}

const SAMPLE_TRACKS = [
  { path: "/music/dreams.mp3", fileName: "dreams.mp3", title: "Dreams", artist: "Fleetwood Mac", album: "Rumours", duration: 257, format: "mp3" },
  { path: "/music/everywhere.flac", fileName: "everywhere.flac", title: "Everywhere", artist: "Fleetwood Mac", album: "Tango in the Night", duration: 223, format: "flac" },
  { path: "/music/africa.m4a", fileName: "africa.m4a", title: "Africa", artist: "Toto", album: "Toto IV", duration: 295, format: "m4a" },
  { path: "/music/dont-stop-believin.mp3", fileName: "Don't Stop Believin'.mp3", title: "Don't Stop Believin'", artist: "Journey", album: "Escape", duration: 251, format: "mp3" },
];

export function BurnerPage({ settings, onOpenSettings }: BurnerPageProps) {
  const {
    tracks,
    totalDuration,
    addTracks,
    removeTrack,
    moveTrack,
    createTrack,
  } = useTrackList();

  const { disc } = useDiscInfo();
  const [cdTitle, setCdTitle] = useState("");
  const [burnStatus, setBurnStatus] = useState<BurnStatus>("idle");
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnStage, setBurnStage] = useState("preparing");
  const [burnCurrentTrack, setBurnCurrentTrack] = useState(0);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnErrorDetails, setBurnErrorDetails] = useState<string | null>(null);
  const [loadDemo, setLoadDemo] = useState(false);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const newTracks = files.map((f) =>
        createTrack({
          path: f.name,
          fileName: f.name,
          title: f.name.replace(/\.[^.]+$/, ""),
          duration: 180 + Math.random() * 120,
          format: f.name.split(".").pop() ?? "unknown",
        })
      );
      addTracks(newTracks);
    },
    [addTracks, createTrack]
  );

  const handleLoadDemo = useCallback(() => {
    const demoTracks = SAMPLE_TRACKS.map((s) =>
      createTrack({
        ...s,
        duration: s.duration,
      })
    );
    addTracks(demoTracks);
    setCdTitle("Road Trip 2026");
    setLoadDemo(true);
  }, [addTracks, createTrack]);

  const canBurn =
    tracks.length > 0 &&
    tracks.some((t) => t.isValid) &&
    totalDuration <= MAX_CD_SECONDS &&
    disc.hasDrive &&
    disc.isBlank &&
    burnStatus === "idle";

  const burnDisabledReason = (() => {
    if (tracks.length === 0) return "Add some tracks first";
    if (!tracks.some((t) => t.isValid)) return "No valid tracks to burn";
    if (totalDuration > MAX_CD_SECONDS)
      return `Compilation is ${formatDuration(totalDuration - MAX_CD_SECONDS)} too long`;
    if (!disc.hasDrive) return "No CD burner found";
    if (!disc.isBlank) return "Insert a blank CD";
    return null;
  })();

  const handleStartBurn = useCallback(() => {
    if (!canBurn) return;
    setBurnStatus("preparing");
    setBurnStage("preparing");
    setBurnProgress(0);
    setBurnError(null);
    setBurnErrorDetails(null);

    let stageIndex = 0;
    const stages = ["preparing", "burning", "finalizing"];
    let currentTrackIdx = 0;
    const validTracks = tracks.filter((t) => t.isValid);

    const interval = setInterval(() => {
      setBurnProgress((prev) => {
        const next = prev + 2 + Math.random() * 3;
        if (next >= 100) {
          stageIndex++;
          if (stageIndex >= stages.length) {
            clearInterval(interval);
            setBurnStatus("success");
            return 100;
          }
          setBurnStage(stages[stageIndex]);
          return 0;
        }
        if (stages[stageIndex] === "burning") {
          const trackIdx = Math.floor(
            (next / 100) * validTracks.length
          );
          if (trackIdx !== currentTrackIdx) {
            currentTrackIdx = trackIdx;
            setBurnCurrentTrack(trackIdx + 1);
          }
        }
        return next;
      });
    }, 200);

    void settings;
  }, [canBurn, tracks, settings]);

  const handleRetry = useCallback(() => {
    setBurnStatus("idle");
    setBurnProgress(0);
    setBurnStage("preparing");
    setBurnCurrentTrack(0);
    setBurnError(null);
    setBurnErrorDetails(null);
  }, []);

  const handleBurnDone = useCallback(() => {
    setBurnStatus("idle");
    setBurnProgress(0);
    setBurnStage("preparing");
    setBurnCurrentTrack(0);
    setBurnError(null);
    setBurnErrorDetails(null);
  }, []);

  const isBurning = burnStatus !== "idle";

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="text-sm font-medium text-text-muted">Burnt</div>
        <button
          onClick={onOpenSettings}
          className="text-text-muted hover:text-text p-1"
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M14.8 11.2a1.2 1.2 0 00.2 1.3l.05.05a1.44 1.44 0 01-1.02 2.46 1.44 1.44 0 01-1.02-.42l-.05-.05a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.72 1.1v.12a1.44 1.44 0 01-2.88 0v-.06a1.2 1.2 0 00-.78-1.1 1.2 1.2 0 00-1.3.2l-.05.05a1.44 1.44 0 01-2.04 0 1.44 1.44 0 01-.42-1.02l.05-.05a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.72h-.12a1.44 1.44 0 010-2.88h.06a1.2 1.2 0 001.1-.78 1.2 1.2 0 00-.2-1.3l-.05-.05A1.44 1.44 0 014.59 5.5a1.44 1.44 0 011.02-.42l.05.05a1.2 1.2 0 001.3.2h.06a1.2 1.2 0 00.72-1.1v-.12a1.44 1.44 0 012.88 0v.06a1.2 1.2 0 00.78 1.1 1.2 1.2 0 001.3-.2l.05-.05a1.44 1.44 0 012.04 0 1.44 1.44 0 01.42 1.02l-.05.05a1.2 1.2 0 00-.2 1.3v.06a1.2 1.2 0 001.1.72h.12a1.44 1.44 0 010 2.88h-.06a1.2 1.2 0 00-1.1.78z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {isBurning ? (
          <BurnProgress
            status={burnStatus}
            progress={burnProgress}
            currentTrack={burnCurrentTrack}
            totalTracks={tracks.filter((t) => t.isValid).length}
            currentTrackName={
              tracks.filter((t) => t.isValid)[burnCurrentTrack - 1]?.title ?? ""
            }
            stage={burnStage}
            errorMessage={burnError}
            errorDetails={burnErrorDetails}
            onRetry={handleRetry}
            onDone={handleBurnDone}
            title={cdTitle || "Untitled"}
          />
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-xl font-semibold">New Audio CD</h1>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-text-faint">
                CD Title
              </label>
              <input
                type="text"
                value={cdTitle}
                onChange={(e) => setCdTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-faint"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
                  Tracks
                </span>
                {tracks.length > 0 && (
                  <span className="text-sm text-text-muted tabular-nums">
                    {formatDuration(totalDuration)}
                  </span>
                )}
              </div>

              <TrackList
                tracks={tracks}
                onRemove={removeTrack}
                onMove={moveTrack}
              />

              <AudioDropZone
                onFilesAdded={handleFilesAdded}
                hasTracks={tracks.length > 0}
              />
            </div>

            {tracks.length === 0 && !loadDemo && (
              <button
                onClick={handleLoadDemo}
                className="text-xs text-text-faint hover:text-text-muted transition-colors"
              >
                Load demo tracks
              </button>
            )}

            <div className="space-y-3">
              <CapacityMeter
                usedSeconds={totalDuration}
                maxSeconds={MAX_CD_SECONDS}
              />

              <DiscStatus disc={disc} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {burnDisabledReason && (
                <span className="text-xs text-text-muted">
                  {burnDisabledReason}
                </span>
              )}
              <button
                onClick={handleStartBurn}
                disabled={!canBurn}
                className={`px-5 py-2.5 text-sm font-medium rounded transition-colors ${
                  canBurn
                    ? "bg-accent text-accent-text hover:bg-accent-hover"
                    : "bg-surface-overlay text-text-faint cursor-not-allowed"
                }`}
              >
                Burn Audio CD
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
