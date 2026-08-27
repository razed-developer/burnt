import { invoke } from "@tauri-apps/api/core";

export interface ToolStatus {
  name: string;
  available: boolean;
  path: string | null;
}

export interface RequirementsStatus {
  ffprobe: ToolStatus;
  ffmpeg: ToolStatus;
  cdrdao: ToolStatus;
  all_met: boolean;
}

export async function checkRequirements(): Promise<RequirementsStatus> {
  return invoke<RequirementsStatus>("check_requirements");
}
