import { invoke } from "@tauri-apps/api/core";

export interface DriveResponse {
  name: string;
  path: string;
  can_write_cd: boolean;
}

export interface MediaResponse {
  has_media: boolean;
  is_blank: boolean;
  is_writable: boolean;
  capacity_minutes: number;
  media_type: string | null;
  disc_state: string;
  drive_name: string | null;
  drive_path: string | null;
}

export async function detectDrives(): Promise<DriveResponse[]> {
  return invoke<DriveResponse[]>("detect_drives");
}

export async function inspectMedia(
  drivePath: string
): Promise<MediaResponse> {
  return invoke<MediaResponse>("inspect_media", { drivePath });
}

export async function getDiscInfo(): Promise<MediaResponse> {
  return invoke<MediaResponse>("get_disc_info");
}
