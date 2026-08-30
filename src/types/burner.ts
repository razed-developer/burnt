export type DiscState = "missing" | "ready" | "busy" | "complete";

export interface Track {
  id: string;
  name: string;
  path: string;
  durationSeconds: number;
}

export interface DiscStatus {
  state: DiscState;
  label: string;
}
