import { useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";

interface AudioDropZoneProps {
  onFilesAdded: (paths: string[]) => void;
  hasTracks: boolean;
}

export function AudioDropZone({ onFilesAdded, hasTracks }: AudioDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleOpenDialog = useCallback(async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Audio Files",
          extensions: [
            "mp3", "flac", "wav", "m4a", "aac", "ogg", "opus", "aiff", "aif",
          ],
        },
      ],
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      if (paths.length > 0) {
        onFilesAdded(paths);
      }
    }
  }, [onFilesAdded]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleOpenDialog();
    },
    [handleOpenDialog]
  );

  if (hasTracks && !isDragOver) {
    return (
      <button
        onClick={handleOpenDialog}
        className="w-full py-2 text-sm text-text-muted hover:text-accent border border-dashed border-border hover:border-accent rounded transition-colors"
      >
        + Add Audio Files
      </button>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleOpenDialog}
      className={`
        flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed
        transition-colors cursor-pointer select-none
        ${isDragOver
          ? "border-accent bg-accent/5"
          : "border-border hover:border-accent/50"
        }
        ${hasTracks ? "p-4" : "p-12"}
      `}
    >
      {!hasTracks && (
        <>
          <div className="text-4xl text-text-faint">+</div>
          <div className="text-lg font-medium text-text">
            Drop your music here
          </div>
          <div className="text-sm text-text-muted">
            MP3 &middot; FLAC &middot; WAV &middot; M4A &middot; OGG &middot; Opus &middot; AIFF
          </div>
        </>
      )}

      {hasTracks && (
        <div className="text-sm text-text-muted">
          Drop audio files here
        </div>
      )}

      {!hasTracks && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDialog();
          }}
          className="mt-2 px-4 py-2 text-sm font-medium text-accent-text bg-accent hover:bg-accent-hover rounded transition-colors"
        >
          + Add Audio Files
        </button>
      )}
    </div>
  );
}
