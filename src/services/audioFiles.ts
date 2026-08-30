import { open } from "@tauri-apps/plugin-dialog";
import type { Track } from "../types/burner";

const AUDIO_EXTENSIONS = ["mp3", "m4a", "aac", "flac", "wav", "ogg"];

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export async function chooseAudioFiles(): Promise<Track[]> {
  const selected = await open({
    multiple: true,
    directory: false,
    filters: [{ name: "Music", extensions: AUDIO_EXTENSIONS }],
  });

  if (!selected) return [];
  const paths = Array.isArray(selected) ? selected : [selected];

  return paths.map((path) => ({
    id: crypto.randomUUID(),
    name: fileName(path),
    path,
    // Real duration arrives with ffprobe in the next phase.
    durationSeconds: 0,
  }));
}
