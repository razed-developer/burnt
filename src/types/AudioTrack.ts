export interface AudioTrack {
  id: string;
  sourcePath: string;
  displayTitle: string;
  artist?: string;
  title?: string;
  durationSeconds: number;
  valid: boolean;
  errorMessage?: string;
}

export type TrackStatus = "invalid" | "valid";
