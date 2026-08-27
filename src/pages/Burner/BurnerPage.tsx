import { useState, useCallback, useEffect } from "react";
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
import { probeAudioFiles } from "../../services/audio";
import type { ProbeResult } from "../../services/audio";
import { startBurn } from "../../services/burn";
import { useRequirements } from "../../hooks/useRequirements";
import { RequirementsBanner } from "../../components/RequirementsBanner/RequirementsBanner";

interface BurnerPageProps {
  settings: Settings;
  onOpenSettings: () => void;
  cdTitle: string;
  onCdTitleChange: (title: string) => void;
  onTrackCountChange: (count: number) => void;
  onBurnStatusChange: (status: string) => void;
}

export function BurnerPage({
  settings,
  onOpenSettings,
  cdTitle,
  onCdTitleChange,
  onTrackCountChange,
  onBurnStatusChange,
}: BurnerPageProps) {
  const {
    tracks,
    totalDuration,
    addTracks,
    removeTrack,
    moveTrack,
    createTrack,
    clearTracks,
  } = useTrackList();

  const { disc } = useDiscInfo();
  const reqs = useRequirements();
  const [burnStatus, setBurnStatus] = useState<BurnStatus>("idle");
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnStage, setBurnStage] = useState("preparing");
  const [burnCurrentTrack, setBurnCurrentTrack] = useState(0);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnErrorDetails, setBurnErrorDetails] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    onTrackCountChange(tracks.length);
  }, [tracks.length, onTrackCountChange]);

  useEffect(() => {
    onBurnStatusChange(burnStatus);
  }, [burnStatus, onBurnStatusChange]);

  const handleFilesAdded = useCallback(
    async (paths: string[]) => {
      setIsProbing(true);
      try {
        const results: ProbeResult[] = await probeAudioFiles(paths);
        const newTracks = results.map((r) =>
          createTrack({
            path: r.path,
            fileName: r.file_name,
            title: r.title,
            artist: r.artist,
            album: r.album,
            duration: r.duration,
            format: r.format,
            isValid: r.is_valid,
            errorMessage: r.error_message ?? undefined,
          })
        );
        addTracks(newTracks);
      } catch (err) {
        console.error("Probe failed:", err);
      } finally {
        setIsProbing(false);
      }
    },
    [addTracks, createTrack]
  );

  const canBurn =
    tracks.length > 0 &&
    tracks.some((t) => t.isValid) &&
    totalDuration <= MAX_CD_SECONDS &&
    disc.hasDrive &&
    disc.isBlank &&
    burnStatus === "idle" &&
    !isProbing;

  const burnDisabledReason = (() => {
    if (isProbing) return "Scanning files\u2026";
    if (tracks.length === 0) return "Add some tracks first";
    if (!tracks.some((t) => t.isValid)) return "No valid tracks to burn";
    if (totalDuration > MAX_CD_SECONDS)
      return `Compilation is ${formatDuration(totalDuration - MAX_CD_SECONDS)} too long`;
    if (!disc.hasDrive) return "No CD burner found";
    if (!disc.isBlank) return "Insert a blank CD";
    return null;
  })();

  const handleStartBurn = useCallback(async () => {
    if (!canBurn) return;
    setBurnStatus("preparing");
    setBurnStage("preparing");
    setBurnProgress(0);
    setBurnError(null);
    setBurnErrorDetails(null);

    const validTracks = tracks.filter((t) => t.isValid);
    const speed = settings.burnSpeed === "automatic" ? 0 : parseInt(settings.burnSpeed, 10);

    try {
      const result = await startBurn(
        {
          drive_path: disc.drivePath ?? "",
          cd_title: cdTitle || "Untitled",
          catalog: "",
          tracks: validTracks.map((t, i) => ({
            index: i + 1,
            title: t.title,
            artist: t.artist,
            path: t.path,
            duration_secs: t.duration,
          })),
          speed: isNaN(speed) ? 0 : speed,
          simulate: false,
          eject: settings.ejectAfterBurn,
        },
        (event) => {
          switch (event.type) {
            case "stage":
              setBurnStage(event.data.stage);
              if (event.data.stage === "burning") setBurnProgress(0);
              break;
            case "track":
              setBurnCurrentTrack(event.data.track);
              setBurnProgress(
                ((event.data.track - 1) / event.data.total) * 100
              );
              break;
            case "percent":
              if (event.data.value > burnProgress) {
                setBurnProgress(event.data.value);
              }
              break;
            case "done":
              setBurnStatus("success");
              setBurnProgress(100);
              break;
            case "error":
              setBurnStatus("failed");
              setBurnError(event.data.message);
              setBurnErrorDetails(event.data.details);
              break;
          }
        }
      );

      if (!result.success) {
        setBurnStatus("failed");
        setBurnError(result.message);
      }
    } catch (err) {
      setBurnStatus("failed");
      setBurnError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  }, [canBurn, tracks, settings, disc.drivePath, cdTitle]);

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

  const handleNewCd = useCallback(() => {
    onCdTitleChange("");
    clearTracks();
    setBurnStatus("idle");
    setBurnProgress(0);
    setBurnStage("preparing");
    setBurnCurrentTrack(0);
    setBurnError(null);
    setBurnErrorDetails(null);
  }, [onCdTitleChange, clearTracks]);

  const isBurning = burnStatus !== "idle";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isBurning) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBurning]);

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="text-sm font-medium text-text-muted">Burnt</div>
        <div className="flex items-center gap-2">
          {!isBurning && (
            <button
              onClick={handleNewCd}
              className="text-text-muted hover:text-text text-xs px-2 py-1 rounded border border-border hover:border-text-muted transition-colors"
            >
              New CD
            </button>
          )}
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
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4">
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
          <div className="max-w-2xl mx-auto space-y-4">
            {reqs && !reqs.all_met && (
              <RequirementsBanner requirements={reqs} />
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-text-faint">
                CD Title
              </label>
              <input
                type="text"
                value={cdTitle}
                onChange={(e) => onCdTitleChange(e.target.value)}
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

              {isProbing ? (
                <div className="w-full py-3 text-center text-sm text-text-muted">
                  Scanning files&hellip;
                </div>
              ) : (
                <AudioDropZone
                  onFilesAdded={handleFilesAdded}
                  hasTracks={tracks.length > 0}
                />
              )}
            </div>

            <div className="space-y-2">
              <CapacityMeter
                usedSeconds={totalDuration}
                maxSeconds={MAX_CD_SECONDS}
              />

              <DiscStatus disc={disc} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
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
