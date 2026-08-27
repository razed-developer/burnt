import { useState, useCallback, useRef } from "react";

interface AudioDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  hasTracks: boolean;
}

const ACCEPTED_EXTENSIONS = new Set([
  "mp3", "flac", "wav", "m4a", "aac", "ogg", "opus", "aiff", "aif",
]);

function isAcceptedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? ACCEPTED_EXTENSIONS.has(ext) : false;
}

export function AudioDropZone({ onFilesAdded, hasTracks }: AudioDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isAcceptedFile);
      if (files.length > 0) {
        onFilesAdded(files);
      }
    },
    [onFilesAdded]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragOver(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  if (hasTracks && !isDragOver) {
    return (
      <>
        <button
          onClick={handleClick}
          className="w-full py-2 text-sm text-text-muted hover:text-accent border border-dashed border-border hover:border-accent rounded transition-colors"
        >
          + Add Audio Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp3,.flac,.wav,.m4a,.aac,.ogg,.opus,.aiff,.aif"
          className="hidden"
          onChange={handleInputChange}
        />
      </>
    );
  }

  return (
    <>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
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
              handleClick();
            }}
            className="mt-2 px-4 py-2 text-sm font-medium text-accent-text bg-accent hover:bg-accent-hover rounded transition-colors"
          >
            + Add Audio Files
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.flac,.wav,.m4a,.aac,.ogg,.opus,.aiff,.aif"
        className="hidden"
        onChange={handleInputChange}
      />
    </>
  );
}
