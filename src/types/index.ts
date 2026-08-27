export interface Track {
  id: string;
  path: string;
  fileName: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  format: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface DiscInfo {
  hasDrive: boolean;
  driveName: string | null;
  drivePath: string | null;
  hasMedia: boolean;
  isBlank: boolean;
  isWritable: boolean;
  capacityMinutes: number;
  mediaType: string | null;
  discState: DiscState;
}

export type DiscState =
  | "no-drive"
  | "no-media"
  | "checking"
  | "blank"
  | "not-blank"
  | "not-writable"
  | "unknown";

export interface BurnState {
  status: BurnStatus;
  progress: number;
  currentTrack: number;
  totalTracks: number;
  currentTrackName: string;
  stage: string;
  errorMessage: string | null;
  errorDetails: string | null;
}

export type BurnStatus =
  | "idle"
  | "preparing"
  | "burning"
  | "finalizing"
  | "success"
  | "failed";

export interface Settings {
  theme: "system" | "light" | "dark";
  preferredDrive: "automatic" | string;
  ejectAfterBurn: boolean;
  burnSpeed: "automatic" | string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  preferredDrive: "automatic",
  ejectAfterBurn: true,
  burnSpeed: "automatic",
};

export const MAX_CD_MINUTES = 80;
export const MAX_CD_SECONDS = MAX_CD_MINUTES * 60;
