import type { AudioTrack } from "./AudioTrack";
import type { DriveSelection } from "./Disc";
import type { BurnSpeed } from "./Settings";

export interface BurnProject {
  discTitle: string;
  tracks: AudioTrack[];
  drive: DriveSelection;
  burnSpeed: BurnSpeed;
  ejectAfterBurn: boolean;
}

export interface BurnProjectInput {
  discTitle: string;
  tracks: AudioTrack[];
  drive: DriveSelection;
  burnSpeed: BurnSpeed;
  ejectAfterBurn: boolean;
}

export interface BurnProgress {
  stage: BurnStage;
  label: string;
  currentTrackIndex: number;
  totalTracks: number;
  percentage: number | null;
}

export type BurnStage =
  | "idle"
  | "preparing"
  | "writing"
  | "finalizing"
  | "completed"
  | "failed";

export interface BurnSummary {
  discTitle: string;
  trackCount: number;
  totalSeconds: number;
}
