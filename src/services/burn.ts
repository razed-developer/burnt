import { invoke, Channel } from "@tauri-apps/api/core";

export interface BurnTrackRequest {
  index: number;
  title: string;
  artist: string | null;
  path: string;
  duration_secs: number;
}

export interface BurnRequest {
  drive_path: string;
  cd_title: string;
  catalog: string;
  tracks: BurnTrackRequest[];
  speed: number;
  simulate: boolean;
  eject: boolean;
}

export interface BurnResponse {
  success: boolean;
  message: string;
}

export type BurnProgressEvent =
  | { type: "stage"; data: { stage: string } }
  | { type: "track"; data: { track: number; total: number } }
  | { type: "percent"; data: { value: number } }
  | { type: "done" }
  | { type: "error"; data: { message: string; details: string } };

export async function startBurn(
  request: BurnRequest,
  onProgress: (event: BurnProgressEvent) => void
): Promise<BurnResponse> {
  const channel = new Channel<BurnProgressEvent>();
  channel.onmessage = onProgress;
  return invoke<BurnResponse>("start_burn", { request, channel });
}

/** Request cancellation of the running burn (Windows IMAPI2 backend). */
export async function cancelBurn(): Promise<boolean> {
  return invoke<boolean>("cancel_burn");
}

/** True when running on Windows, where the IMAPI2 backend supports cancelling. */
export function cancellationSupported(): boolean {
  if (typeof navigator !== "undefined" && navigator.platform) {
    return navigator.platform.toLowerCase().includes("win");
  }
  return false;
}

export async function checkCdrdao(): Promise<string> {
  return invoke<string>("check_cdrdao");
}
