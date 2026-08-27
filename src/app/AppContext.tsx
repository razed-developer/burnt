import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ApplicationSettings, AudioTrack, DiscState, DiscDrive } from "../types";
import * as audioService from "../services/audioService";
import * as discService from "../services/discService";
import * as settingsService from "../services/settingsService";

interface AppState {
  settings: ApplicationSettings;
  updateSettings: (patch: Partial<ApplicationSettings>) => void;
  tracks: AudioTrack[];
  addPaths: (paths: string[]) => Promise<void>;
  removeTrack: (id: string) => void;
  moveTrack: (from: number, to: number) => void;
  discTitle: string;
  setDiscTitle: (title: string) => void;
  discState: DiscState | null;
  drives: DiscDrive[];
  setDiscStateOverride: (kind: string) => Promise<void>;
  refreshDiscState: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [discTitle, setDiscTitle] = useState("My Music");
  const [discState, setDiscState] = useState<DiscState | null>(null);
  const [drives, setDrives] = useState<DiscDrive[]>([]);
  const addingRef = useRef(false);
  const settingsRef = useRef<ApplicationSettings | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    settingsService.loadSettings().then(setSettings);
    discService.detectDrives().then(setDrives).catch(() => setDrives([]));
  }, []);

  useEffect(() => {
    if (settings) {
      discService.detectMedia(settings.preferredDrive).then(setDiscState).catch(() => setDiscState(null));
    }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<ApplicationSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      settingsService.saveSettings(next).catch(() => {});
      return next;
    });
  }, []);

  const addPaths = useCallback(async (paths: string[]) => {
    if (addingRef.current) return;
    addingRef.current = true;
    try {
      const added = await audioService.addAudioFiles(paths);
      setTracks((prev) => [...prev, ...added]);
    } finally {
      addingRef.current = false;
    }
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const moveTrack = useCallback((from: number, to: number) => {
    setTracks((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length || from === to) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setDiscStateOverride = useCallback(async (_kind: string) => {
    const state = await discService.cycleSimulatedState();
    setDiscState(state);
  }, []);

  const refreshDiscState = useCallback(async () => {
    const sel = settingsRef.current?.preferredDrive ?? "automatic";
    try {
      const state = await discService.detectMedia(sel);
      setDiscState(state);
    } catch {
      setDiscState(null);
    }
  }, []);

  const value = useMemo<AppState>(
    () => ({
      settings: settings ?? { theme: "system", preferredDrive: "automatic", ejectAfterBurn: true, burnSpeed: "automatic" },
      updateSettings,
      tracks,
      addPaths,
      removeTrack,
      moveTrack,
      discTitle,
      setDiscTitle,
      discState,
      drives,
      setDiscStateOverride,
      refreshDiscState,
    }),
    [settings, updateSettings, tracks, addPaths, removeTrack, moveTrack, discTitle, discState, drives, setDiscStateOverride, refreshDiscState]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
