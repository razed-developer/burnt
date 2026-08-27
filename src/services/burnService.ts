import { invoke } from "@tauri-apps/api/core";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "../utils/env";
import type { BurnProgress, BurnProject } from "../types";

/**
 * Burn service.
 *
 * In a Tauri environment `burnStart` launches the Rust burn coordinator which
 * emits normalized progress events that the frontend subscribes to via
 * `onBurnProgress`.
 *
 * During Phase 1 we simulate the full burn so the progress view is real.
 */

export interface BurnHandle {
  cancel(): void;
  promise: Promise<boolean>;
}

export async function burnProject(project: BurnProject): Promise<BurnHandle> {
  if (isTauri()) {
    const promise = invoke<boolean>("burn_start", { project });
    return { cancel: () => {}, promise };
  }
  return simulateBurn(project);
}

export async function onBurnProgress(handler: (progress: BurnProgress) => void): Promise<UnlistenFn> {
  if (!isTauri()) {
    return onSimulatedProgress(handler);
  }
  return listen<BurnProgress>("burn-progress", (event) => handler(event.payload));
}

function simulateBurn(project: BurnProject): BurnHandle {
  let cancelled = false;
  const total = Math.max(1, project.tracks.length);

  const promise = new Promise<boolean>((resolve) => {
    const emit = (progress: BurnProgress) => {
      window.dispatchEvent(
        new CustomEvent<BurnProgress>("simulated-burn-progress", { detail: progress })
      );
    };

    emit({ stage: "preparing", label: "Preparing audio", currentTrackIndex: 0, totalTracks: total, percentage: null });

    let step = 0;
    const interval = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(interval);
        emit({ stage: "failed", label: "Burning cancelled", currentTrackIndex: 0, totalTracks: total, percentage: null });
        resolve(false);
        return;
      }
      step += 1;
      if (step < 4) {
        emit({ stage: "writing", label: "Writing disc", currentTrackIndex: Math.min(total, step), totalTracks: total, percentage: Math.round((step / 10) * 100) });
      } else if (step === 4) {
        emit({ stage: "finalizing", label: "Finalizing…", currentTrackIndex: total, totalTracks: total, percentage: null });
      } else {
        window.clearInterval(interval);
        emit({ stage: "completed", label: "Complete", currentTrackIndex: total, totalTracks: total, percentage: 100 });
        resolve(true);
      }
    }, 700);
  });

  return { cancel: () => { cancelled = true; }, promise };
}

export async function onSimulatedProgress(handler: (progress: BurnProgress) => void): Promise<UnlistenFn> {
  const listener = (event: Event) => handler((event as CustomEvent<BurnProgress>).detail);
  window.addEventListener("simulated-burn-progress", listener);
  return () => window.removeEventListener("simulated-burn-progress", listener);
}
