import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../utils/env";
import type { ApplicationSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

/**
 * Settings service.
 *
 * In a Tauri environment settings live in a JSON file on disk (managed by the
 * Rust settings subsystem, respecting installed vs. portable mode).
 *
 * During Phase 1 we keep settings in memory and localStorage so the prototype
 * persists across page reloads in a browser.
 */

const STORAGE_KEY = "burnt.settings.v1";

export async function loadSettings(): Promise<ApplicationSettings> {
  if (isTauri()) {
    return invoke<ApplicationSettings>("settings_load");
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: ApplicationSettings): Promise<void> {
  if (isTauri()) {
    return invoke<void>("settings_save", { settings });
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
