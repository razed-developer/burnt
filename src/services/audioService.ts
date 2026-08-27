import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../utils/env";
import { createId } from "../utils/id";
import type { AudioTrack } from "../types";

/**
 * Probe audio files and return normalized AudioTrack values.
 *
 * In a Tauri environment this calls the Rust `audio_add_files` command, which
 * uses FFprobe to read metadata and duration.
 *
 * During Phase 1 (no Rust backend yet) we simulate metadata using the
 * filename, so the prototype is fully functional in a plain browser.
 */
export async function addAudioFiles(paths: string[]): Promise<AudioTrack[]> {
  if (isTauri()) {
    return invoke<AudioTrack[]>("audio_add_files", { paths });
  }
  await delay(60);
  return paths.map((path) => simulateProbe(path));
}

function simulateProbe(path: string): AudioTrack {
  const displayTitle = baseName(path);
  return {
    id: createId(),
    sourcePath: path,
    displayTitle,
    durationSeconds: 60 + Math.floor(Math.random() * 240),
    valid: true,
  };
}

function baseName(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || p;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
