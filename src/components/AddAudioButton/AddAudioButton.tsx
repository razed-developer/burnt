import { useRef } from "react";
import { useApp } from "../../app/AppContext";

const ACCEPT = "audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg,.opus,.aiff,.aif";

interface AddAudioButtonProps {
  label?: string;
  variant?: "primary" | "ghost";
}

/**
 * A file-picker button used both in the empty drop zone and below a populated
 * track list. Dispatches chosen files to the app as audio paths.
 */
export default function AddAudioButton({ label = "Add Audio Files", variant = "ghost" }: AddAudioButtonProps) {
  const { addPaths } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) {
            void addPaths(Array.from(e.target.files).map((f) => f.name));
          }
          e.target.value = "";
        }}
      />
      <button className={variant === "primary" ? "add-audio primary" : "add-audio"} onClick={() => inputRef.current?.click()}>
        + {label}
      </button>
    </>
  );
}
