import "./BurnProgress.css";
import type { BurnProgress as BurnProgressData, BurnSummary } from "../../types";
import { formatDuration } from "../../utils/format";

interface BurnProgressProps {
  progress: BurnProgressData;
  summary: BurnSummary;
  onEject: () => void;
  onBurnAnother: () => void;
  onTryAgain: () => void;
  onShowDetails: () => void;
  onClose: () => void;
}

/**
 * Full-screen burn progress/result/failure view. Renders normalized burn
 * stages; it never invents percentages beyond what the backend reports.
 */
export default function BurnProgressView({
  progress,
  summary,
  onEject,
  onBurnAnother,
  onTryAgain,
  onShowDetails,
  onClose,
}: BurnProgressProps) {
  return (
    <div className="burn-progress-overlay">
      <div className="burn-progress-panel" role="status" aria-live="polite">
        {progress.stage === "completed" ? (
          <CompletedView summary={summary} onEject={onEject} onBurnAnother={onBurnAnother} onClose={onClose} />
        ) : progress.stage === "failed" ? (
          <FailedView onTryAgain={onTryAgain} onShowDetails={onShowDetails} onClose={onClose} />
        ) : (
          <RunningView progress={progress} />
        )}
      </div>
    </div>
  );
}

function RunningView({ progress }: { progress: BurnProgressData }) {
  return (
    <>
      <h2 className="burn-title">Burning…</h2>
      <p className="burn-label">{progress.label}</p>

      {progress.stage === "writing" && progress.percentage != null ? (
        <div className="meter burn-meter">
          <div className="meter-bar" style={{ width: `${progress.percentage}%` }} />
        </div>
      ) : (
        <div className="meter burn-meter indeterminate">
          <div className="meter-bar" />
        </div>
      )}

      {progress.currentTrackIndex > 0 && (
        <p className="burn-track">
          Track {Math.min(progress.currentTrackIndex, progress.totalTracks)} of {progress.totalTracks}
        </p>
      )}

      <p className="burn-hint">Please don't eject the disc.</p>
    </>
  );
}

function CompletedView({
  summary,
  onEject,
  onBurnAnother,
  onClose,
}: {
  summary: BurnSummary;
  onEject: () => void;
  onBurnAnother: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="burn-check">✓</div>
      <h2 className="burn-title">Your CD is ready.</h2>
      <p className="burn-summary">
        {summary.discTitle || "Untitled"}
        <br />
        {summary.trackCount} track{summary.trackCount === 1 ? "" : "s"} • {formatDuration(summary.totalSeconds, { showHours: true })}
      </p>
      <div className="burn-actions">
        <button className="btn primary" onClick={onEject}>
          Eject CD
        </button>
        <button className="btn" onClick={onBurnAnother}>
          Burn Another
        </button>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}

function FailedView({
  onTryAgain,
  onShowDetails,
  onClose,
}: {
  onTryAgain: () => void;
  onShowDetails: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <h2 className="burn-title failure">The CD couldn't be written.</h2>
      <p className="burn-label">
        The disc may be damaged or incompatible with your drive. Try another blank CD and burn again.
      </p>
      <div className="burn-actions">
        <button className="btn primary" onClick={onTryAgain}>
          Try Again
        </button>
        <button className="btn ghost" onClick={onShowDetails}>
          Show technical details
        </button>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}
