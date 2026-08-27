import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../utils/env";
import type { DiscDrive, DiscState, DriveSelection } from "../types";

/**
 * Disc / optical-drive service.
 *
 * In a Tauri environment this calls the Rust disc commands, which detect
 * optical writers and inspect the inserted media.
 *
 * During Phase 1 we simulate a set of stable disc states so the UI prototype
 * can be exercised without hardware. `cycleSimulatedState()` advances the
 * simulated media so Kevin can see each state render.
 */

let simulatedIndex = 4;

const simulatedDrives: DiscDrive[] = [{ id: "sim-drive-1", displayName: "HL-DT-ST DVDRAM GH24NSD5", canWriteCd: true }];

const simulatedStates: DiscState[] = [
  { kind: "noWriter", label: "No CD burner found", capacitySeconds: null },
  { kind: "checking", label: "Checking disc…", capacitySeconds: null },
  { kind: "noMedia", label: "Please insert a blank CD", capacitySeconds: null },
  { kind: "nonBlank", label: "This disc is not blank", capacitySeconds: null },
  { kind: "blank", label: "Blank 80-minute CD", capacitySeconds: 80 * 60 },
  { kind: "notWritable", label: "This disc cannot be used for an Audio CD", capacitySeconds: null },
];

export async function detectDrives(): Promise<DiscDrive[]> {
  if (isTauri()) {
    return invoke<DiscDrive[]>("disc_detect_drives");
  }
  return simulatedDrives;
}

export async function detectMedia(selection: DriveSelection): Promise<DiscState> {
  if (isTauri()) {
    return invoke<DiscState>("disc_detect_media", { selection });
  }
  return simulatedStates[simulatedIndex];
}

/** Advance the simulated media for testing. Returns new state. */
export async function cycleSimulatedState(): Promise<DiscState> {
  simulatedIndex = (simulatedIndex + 1) % simulatedStates.length;
  return simulatedStates[simulatedIndex];
}

export async function ejectDisc(selection: DriveSelection = "automatic"): Promise<void> {
  if (isTauri()) {
    await invoke("disc_eject", { selection });
  }
}
