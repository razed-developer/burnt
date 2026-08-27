export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  filename: string;
  duration: number; // in seconds
  sizeBytes: number;
  format: string; // 'mp3' | 'wav' | 'flac' | 'm4a' | 'ogg' | 'aac'
  status: 'ready' | 'decoding' | 'error';
  errorMessage?: string;
  file?: File;
  audioBlobUrl?: string;
  audioBuffer?: AudioBuffer;
  isSample?: boolean;
}

export type DiscCapacityType = '80min' | '74min' | '90min';

export interface DiscCapacity {
  type: DiscCapacityType;
  label: string;
  totalSeconds: number; // 80 min = 4800s, 74 min = 4440s
  maxTracks: number; // 99 tracks Red Book limit
}

export interface OpticalDrive {
  id: string;
  name: string;
  vendor: string;
  isWriter: boolean;
  speeds: number[]; // e.g. [1, 2, 4, 8, 16, 24, 32, 48]
  mediaInserted: boolean;
  mediaType: 'CD-R' | 'CD-RW' | 'None' | 'Incompatible';
  isBlank: boolean;
  mediaCapacitySec: number;
}

export interface BurnSettings {
  theme: 'system' | 'light' | 'dark';
  preferredDriveId: string;
  ejectAfterBurn: boolean;
  burnSpeed: string; // 'auto' | '1x' | '4x' | '8x' | '16x' | '24x' | '32x' | '48x'
  enableCdText: boolean;
  pregapSeconds: number; // standard 2s
}

export type BurnStage =
  | 'idle'
  | 'validating'
  | 'decoding'
  | 'generating_toc'
  | 'writing_leadin'
  | 'burning_tracks'
  | 'writing_leadout'
  | 'finalizing'
  | 'success'
  | 'failed';

export interface BurnProgressState {
  stage: BurnStage;
  percent: number;
  currentTrackIndex: number;
  totalTracks: number;
  currentTrackTitle: string;
  actionDescription: string;
  speed: string;
  logs: string[];
  errorMessage?: string;
  errorDetails?: string;
  startTime?: number;
}
