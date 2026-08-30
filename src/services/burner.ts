import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { DiscStatus } from "../types/burner";

export interface BurnResult { drive?: string; message: string; log: string[]; }
export interface DiscInfo extends DiscStatus { drive?: string; freeSectors?: number; }
export interface BurnEvent { kind: "drive" | "status" | "track" | "error" | "warn" | "complete" | string; message: string; }

export async function getDiscStatus(): Promise<DiscInfo> { return invoke<DiscInfo>("get_disc_status"); }
export async function onBurnEvent(handler: (event: BurnEvent) => void): Promise<UnlistenFn> { return listen<BurnEvent>("burn-event", (event) => handler(event.payload)); }
export async function burnAudioCd(pcmPaths: string[]): Promise<BurnResult> { return invoke<BurnResult>("burn_audio_cd", { paths: pcmPaths }); }
