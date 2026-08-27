import { useEffect, useMemo, useState } from "react";
import "./BurnerPage.css";
import { useApp } from "../../app/AppContext";
import AudioDropZone from "../../components/AudioDropZone/AudioDropZone";
import TrackList from "../../components/TrackList/TrackList";
import CapacityMeter from "../../components/CapacityMeter/CapacityMeter";
import DiscStatus from "../../components/DiscStatus/DiscStatus";
import BurnProgressView from "../../components/BurnProgress/BurnProgress";
import type { BurnProgress, BurnProject, BurnSummary } from "../../types";
import { burnService, discService } from "../../services";

/**
 * The Burner page owns the primary workflow:
 * Title → Tracks → Capacity → Disc Status → Burn.
 * It coordinates components but does not contain their implementations.
 */
export default function BurnerPage() {
  const { tracks, discTitle, setDiscTitle, discState, settings, refreshDiscState } = useApp();
  const [burnProgress, setBurnProgress] = useState<BurnProgress | null>(null);
  const [burnResult, setBurnResult] = useState<boolean | null>(null);

  const capacity = discState?.capacitySeconds ?? 80 * 60;
  const used = useMemo(() => tracks.reduce((s, t) => s + (t.valid ? t.durationSeconds : 0), 0), [tracks]);
  const invalidCount = useMemo(() => tracks.filter((t) => !t.valid).length, [tracks]);

  const summary: BurnSummary = useMemo(
    () => ({ discTitle: discTitle.trim(), trackCount: tracks.length, totalSeconds: used }),
    [discTitle, tracks, used]
  );

  // Subscribe to burn progress events.
  useEffect(() => {
    let unlisten: () => void = () => {};
    burnService.onBurnProgress(setBurnProgress).then((fn) => (unlisten = fn)).catch(() => {});
    return () => unlisten();
  }, []);

  const readyToBurn = useMemo(() => {
    if (burnProgress) return false;
    if (tracks.length === 0 || invalidCount > 0) return false;
    if (used > capacity) return false;
    return discState?.kind === "blank";
  }, [burnProgress, tracks, invalidCount, used, capacity, discState]);

  const disabledReason = useMemo(() => {
    if (burnProgress) return "A burn is already in progress.";
    if (tracks.length === 0) return "Add at least one track to burn.";
    if (invalidCount > 0) return "Remove the unreadable track(s) before burning.";
    if (used > capacity) return "The compilation is longer than the disc capacity.";
    if (!discState) return "Checking the disc…";
    switch (discState.kind) {
      case "noWriter":
        return "No CD burner was found.";
      case "noMedia":
        return "Insert a blank CD to burn.";
      case "nonBlank":
        return "Insert a blank CD.";
      case "notWritable":
        return "This disc cannot be used for an Audio CD.";
      case "checking":
        return "Checking the disc…";
      default:
        return null;
    }
  }, [burnProgress, tracks, invalidCount, used, capacity, discState]);

  function startBurn() {
    if (!readyToBurn) return;
    const project: BurnProject = {
      discTitle: discTitle.trim(),
      tracks,
      drive: settings?.preferredDrive ?? "automatic",
      burnSpeed: settings?.burnSpeed ?? "automatic",
      ejectAfterBurn: settings?.ejectAfterBurn ?? true,
    };
    setBurnProgress({ stage: "preparing", label: "Starting…", currentTrackIndex: 0, totalTracks: tracks.length, percentage: null });
    void burnService.burnProject(project).then((handle) => {
      void handle.promise.then((ok) => {
        setBurnResult(ok);
        if (ok) {
          void refreshDiscState();
        }
      });
    });
  }

  function resetBurn() {
    setBurnProgress(null);
    setBurnResult(null);
  }

  return (
    <div className="burner">
      <h1 className="burner-heading">New Audio CD</h1>

      <section className="section-block">
        <label className="title-label" htmlFor="cd-title">
          CD Title
        </label>
        <input
          id="cd-title"
          className="title-input"
          value={discTitle}
          maxLength={60}
          onChange={(e) => setDiscTitle(e.target.value)}
          placeholder="My Mix"
        />
      </section>

      <CapacityMeter usedSeconds={used} capacitySeconds={discState?.capacitySeconds ?? null} />

      {tracks.length === 0 ? <AudioDropZone /> : <TrackList />}

      <DiscStatus />

      {burnProgress && (
        <BurnProgressView
          progress={burnProgress}
          summary={summary}
          onEject={() => discService.ejectDisc().catch(() => {})}
          onBurnAnother={() => resetBurn()}
          onTryAgain={() => resetBurn()}
          onShowDetails={() => {}}
          onClose={() => resetBurn()}
        />
      )}

      <div className="burn-footer">
        <div className="burn-reason" aria-live="polite">
          {!readyToBurn && disabledReason}
          {burnResult === true && readyToBurn && "Your CD was written successfully."}
        </div>
        <button className="burn-button" disabled={!readyToBurn} onClick={startBurn}>
          Burn Audio CD
        </button>
      </div>
    </div>
  );
}
