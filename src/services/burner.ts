import { invoke } from "@tauri-apps/api/core";
import type { DiscStatus } from "../types/burner";

export interface BurnResult { drive?: string; message: string; log: string[]; }
export interface DiscInfo extends DiscStatus { drive?: string; freeSectors?: number; }

export async function getDiscStatus(): Promise<DiscInfo> { return invoke<DiscInfo>("get_disc_status"); }
export async function burnAudioCd(pcmPaths: string[]): Promise<BurnResult> { return invoke<BurnResult>("burn_audio_cd", { paths: pcmPaths }); }
