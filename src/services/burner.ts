import { invoke } from "@tauri-apps/api/core";

export interface BurnResult {
  drive?: string;
  message: string;
  log: string[];
}

export async function burnAudioCd(pcmPaths: string[]): Promise<BurnResult> {
  return invoke<BurnResult>("burn_audio_cd", { paths: pcmPaths });
}
