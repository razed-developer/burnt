import { open } from "@tauri-apps/plugin-dialog";
import type { Track } from "../types/burner";
import { probeAudioFile } from "./audioPreparation";

const AUDIO_EXTENSIONS = ["mp3", "m4a", "aac", "flac", "wav", "ogg"];

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

async function trackFromPath(path: string): Promise<Track> {
  try {
    const durationSeconds = await probeAudioFile(path);
    return {
      id: crypto.randomUUID(),
      name: fileName(path),
      path,
      durationSeconds,
      metadataState: "ready",
    };
  } catch (error) {
    return {
      id: crypto.randomUUID(),
      name: fileName(path),
      path,
      durationSeconds: 0,
      metadataState: "error",
      metadataError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function chooseAudioFiles(): Promise<Track[]> {
  const selected = await open({
    multiple: true,
    directory: false,
    filters: [{ name: "Music", extensions: AUDIO_EXTENSIONS }],
  });

  if (!selected) return [];
  const paths = Array.isArray(selected) ? selected : [selected];
  return Promise.all(paths.map(trackFromPath));
}
