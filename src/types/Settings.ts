import type { DriveSelection } from "./Disc";

export type Theme = "system" | "light" | "dark";

export type BurnSpeed = "automatic" | number;

export interface ApplicationSettings {
  theme: Theme;
  preferredDrive: DriveSelection;
  ejectAfterBurn: boolean;
  burnSpeed: BurnSpeed;
}

export const DEFAULT_SETTINGS: ApplicationSettings = {
  theme: "system",
  preferredDrive: "automatic",
  ejectAfterBurn: true,
  burnSpeed: "automatic",
};
