import { invoke } from "@tauri-apps/api/core";
import type { PreparedTrack } from "../types/burner";

interface AudioMetadata {
  durationSeconds: number;
}

export async function probeAudioFile(path: string): Promise<number> {
  const metadata = await invoke<AudioMetadata>("probe_audio_file", { path });
  return metadata.durationSeconds;
}

export async function prepareAudioTracks(paths: string[]): Promise<PreparedTrack[]> {
  return invoke<PreparedTrack[]>("prepare_audio_tracks", { paths });
}

export async function cleanupPreparedTracks(pcmPaths: string[]): Promise<void> {
  await invoke("cleanup_audio_tracks", { paths: pcmPaths });
}
