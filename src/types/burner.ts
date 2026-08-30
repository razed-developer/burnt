export type DiscState = "checking" | "missing" | "ready" | "used" | "unsupported" | "busy" | "complete";
export type TrackMetadataState = "pending" | "ready" | "error";

export interface Track { id: string; name: string; path: string; durationSeconds: number; metadataState?: TrackMetadataState; metadataError?: string; }
export interface PreparedTrack { sourcePath: string; pcmPath: string; durationSeconds: number; bytes: number; sectors: number; }
export interface DiscStatus { state: DiscState; label: string; }
