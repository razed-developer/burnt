import { useState, useCallback } from "react";
import type { Track } from "../types";

let nextId = 1;
function generateId(): string {
  return `track-${nextId++}-${Date.now()}`;
}

export interface TrackListState {
  tracks: Track[];
  totalDuration: number;
}

export function useTrackList() {
  const [tracks, setTracks] = useState<Track[]>([]);

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

  const addTracks = useCallback((newTracks: Track[]) => {
    setTracks((prev) => [...prev, ...newTracks]);
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const moveTrack = useCallback((fromIndex: number, toIndex: number) => {
    setTracks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const clearTracks = useCallback(() => {
    setTracks([]);
  }, []);

  const createTrack = useCallback(
    (input: {
      path: string;
      fileName: string;
      title?: string;
      artist?: string | null;
      album?: string | null;
      duration: number;
      format: string;
      isValid?: boolean;
      errorMessage?: string;
    }): Track => {
      return {
        id: generateId(),
        path: input.path,
        fileName: input.fileName,
        title: input.title ?? input.fileName,
        artist: input.artist ?? null,
        album: input.album ?? null,
        duration: input.duration,
        format: input.format,
        isValid: input.isValid ?? true,
        errorMessage: input.errorMessage,
      };
    },
    []
  );

  return {
    tracks,
    totalDuration,
    addTracks,
    removeTrack,
    moveTrack,
    clearTracks,
    createTrack,
  };
}
