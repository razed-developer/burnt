export interface DiscDrive {
  id: string;
  displayName: string;
  canWriteCd: boolean;
}

export type DiscStateKind =
  | "checking"
  | "noWriter"
  | "writerReady"
  | "noMedia"
  | "blank"
  | "nonBlank"
  | "notWritable";

export interface DiscState {
  kind: DiscStateKind;
  /** Human-friendly plain-language text for the current state. */
  label: string;
  /** Writable capacity in seconds when known, otherwise null. */
  capacitySeconds: number | null;
  /** A short, non-scary detail line shown under the status if useful. */
  detail?: string;
}

export interface DiscMedia {
  present: boolean;
  blank: boolean;
  writable: boolean;
  capacitySeconds: number | null;
}

export type DriveSelection = "automatic" | { id: string };
