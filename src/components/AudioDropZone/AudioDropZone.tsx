import { useState } from "react";
import "./AudioDropZone.css";
import AddAudioButton from "../AddAudioButton/AddAudioButton";
import { useApp } from "../../app/AppContext";
import type { DragEvent } from "react";

/**
 * The empty-state drop zone: accepts dropped audio (or a file-picker
 * selection) and hands the chosen names to the app. It does not perform any
 * audio processing itself.
 */
export default function AudioDropZone() {
  const { addPaths } = useApp();
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    void addPaths(Array.from(files).map((f) => f.name));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <section
      className={"dropzone" + (dragging ? " dragging" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <div className="dropzone-inner">
        <p className="dropzone-title">Drop your music here</p>
        <p className="dropzone-formats">MP3 • FLAC • WAV • M4A • OGG</p>
        <AddAudioButton variant="primary" />
      </div>
    </section>
  );
}
