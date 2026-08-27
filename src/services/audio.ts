import { invoke } from "@tauri-apps/api/core";

export interface ProbeResult {
  path: string;
  file_name: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  format: string;
  is_valid: boolean;
  error_message: string | null;
}

export interface PrepareResult {
  id: string;
  input_path: string;
  output_path: string | null;
  success: boolean;
  error: string | null;
}

export async function probeAudioFile(path: string): Promise<ProbeResult> {
  return invoke<ProbeResult>("probe_audio_file", { path });
}

export async function probeAudioFiles(paths: string[]): Promise<ProbeResult[]> {
  return invoke<ProbeResult[]>("probe_audio_files", { paths });
}

export async function prepareTrack(
  path: string,
  id: string
): Promise<PrepareResult> {
  return invoke<PrepareResult>("prepare_track", { path, id });
}
