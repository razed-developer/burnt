import { BurnSettings } from '../types';

const SETTINGS_KEY = 'burnt_user_settings';

export const DEFAULT_SETTINGS: BurnSettings = {
  theme: 'system',
  preferredDriveId: 'drive-pioneer',
  ejectAfterBurn: true,
  burnSpeed: 'auto',
  enableCdText: true,
  pregapSeconds: 2,
};

export function loadSettings(): BurnSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: BurnSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}
