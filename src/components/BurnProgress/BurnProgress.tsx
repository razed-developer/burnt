import type { BurnStatus } from "../../types";

interface BurnProgressProps {
  status: BurnStatus;
  progress: number;
  currentTrack: number;
  totalTracks: number;
  currentTrackName: string;
  stage: string;
  errorMessage: string | null;
  errorDetails: string | null;
  onRetry: () => void;
  onDone: () => void;
  onCancel: () => void;
  canCancel: boolean;
  cancelRequested: boolean;
  title: string;
}

export function BurnProgress({
  status,
  progress,
  currentTrack,
  totalTracks,
  currentTrackName,
  stage,
  errorMessage,
  errorDetails,
  onRetry,
  onDone,
  onCancel,
  canCancel,
  cancelRequested,
  title,
}: BurnProgressProps) {
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-5xl text-success">&#10003;</div>
        <div className="text-lg font-medium">Your CD is ready.</div>
        <div className="text-sm text-text-muted">
          {title} &middot; {totalTracks} tracks
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onDone}
            className="px-4 py-2 text-sm font-medium border border-border rounded hover:bg-surface-overlay transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="text-5xl text-danger">&#10007;</div>
        <div className="text-lg font-medium">
          The CD couldn&apos;t be written.
        </div>
        <div className="text-sm text-text-muted max-w-md">
          {errorMessage ?? "An unexpected error occurred."}
        </div>
        {errorDetails && (
          <details className="text-xs text-text-faint max-w-md w-full">
            <summary className="cursor-pointer hover:text-text-muted">
              Show technical details
            </summary>
            <pre className="mt-2 p-3 bg-surface-overlay rounded text-left overflow-auto max-h-40">
              {errorDetails}
            </pre>
          </details>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-accent-text bg-accent hover:bg-accent-hover rounded transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onDone}
            className="px-4 py-2 text-sm font-medium border border-border rounded hover:bg-surface-overlay transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const stages: { key: string; label: string }[] = [
    { key: "preparing", label: "Preparing tracks" },
    { key: "burning", label: "Writing disc" },
    { key: "finalizing", label: "Finalizing" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="text-center">
        <div className="text-lg font-medium">Burning &ldquo;{title}&rdquo;</div>
      </div>

      <div className="space-y-4 max-w-md mx-auto w-full">
        {stages.map((s, i) => {
          const isActive = i === currentStageIndex;
          const isDone = i < currentStageIndex;

          return (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span
                  className={
                    isActive
                      ? "font-medium text-text"
                      : isDone
                        ? "text-success"
                        : "text-text-faint"
                  }
                >
                  {s.label}
                </span>
                {isDone && <span className="text-success">&#10003;</span>}
              </div>
              <div className="h-2 w-full rounded bg-surface-overlay overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 ${
                    isDone
                      ? "bg-success"
                      : isActive
                        ? "bg-accent"
                        : "bg-surface-overlay"
                  }`}
                  style={{
                    width: isDone
                      ? "100%"
                      : isActive
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {stage === "burning" && currentTrack > 0 && (
        <div className="text-center text-sm text-text-muted">
          Track {currentTrack} of {totalTracks}
          {currentTrackName && (
            <>
              <br />
              <span className="text-text">{currentTrackName}</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <div className="text-center text-sm text-text-muted">
          Please don&apos;t eject the disc.
        </div>
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={cancelRequested}
            className={`px-4 py-2 text-sm font-medium border border-border rounded transition-colors ${
              cancelRequested
                ? "text-text-faint cursor-not-allowed"
                : "hover:bg-surface-overlay"
            }`}
          >
            {cancelRequested ? "Cancelling\u2026" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
