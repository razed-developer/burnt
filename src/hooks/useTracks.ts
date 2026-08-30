import { useMemo, useState } from "react";
import type { Track } from "../types/burner";

export function useTracks(initialTracks: Track[] = []) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);

  const totalSeconds = useMemo(
    () => tracks.reduce((total, track) => total + track.durationSeconds, 0),
    [tracks],
  );

  function addTracks(next: Track[]) {
    setTracks((current) => [...current, ...next]);
  }

  function removeTrack(id: string) {
    setTracks((current) => current.filter((track) => track.id !== id));
  }

  function moveTrack(id: string, direction: -1 | 1) {
    setTracks((current) => {
      const from = current.findIndex((track) => track.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const copy = [...current];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });
  }

  function reorderTrack(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    setTracks((current) => {
      const from = current.findIndex((track) => track.id === draggedId);
      const to = current.findIndex((track) => track.id === targetId);
      if (from < 0 || to < 0) return current;
      const copy = [...current];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  return { tracks, totalSeconds, addTracks, removeTrack, moveTrack, reorderTrack, setTracks };
}
