# NEXT

## Foundation and UI shell
- [DONE] Scaffold Tauri v2 + React + Vite + TypeScript on `fresh-start`.
- [DONE] Build and locally verify the first one-screen track-list UI.
- [DONE] Keep browser simulation available for UI work without consuming discs.

## Audio preparation
- [DONE] Integrate ffprobe for real duration.
- [DONE] Convert supported sources with FFmpeg to raw 44.1 kHz / 16-bit / stereo PCM.
- [DONE] Pad PCM to complete 2352-byte CD-DA sectors.
- [DONE] Manage per-run temporary files and cleanup.
- [DONE] Locally verify real files reach `tracks prepared to burn`.

## Windows burner — v1 workflow frozen
- [DONE] Native IMAPI2/file-backed-IStream burn helper.
- [DONE] Local MSVC build script to `tools/bin/burnt-burner.exe`.
- [DONE] Tauri integration, ordered PCM handoff, cleanup, media validation, finalization and eject.
- [DONE] COM lifetime ordering fix.
- [DONE] Full integrated burn and playback on computer plus separate standalone CD player.
- [DONE] Live recorder/media detection and blank-disc gating.
- [DONE] Live helper status and track-number events.
- [DONE] Blocking ffprobe/FFmpeg/helper work moved off the Tauri command/UI execution path.
- [DONE] Preparation, writing, finalizing, success, visible failure and completion states.
- [DONE] `Burn Another` reset.
- [DONE] Isolated IMAPI2 Track-at-Once progress subscription for within-track percentage.
- [DONE] Active phase, track number, source track name and within-track progress bar.
- [DONE] Final development physical burn verified the complete workflow.

**Regression rule:** The Windows v1 burn workflow is frozen and hardware verified. Do not rewrite, refactor, or replace the native burn mechanism for polish. Changes affecting physical burning require a new hardware burn verification.

## Current phase — Windows packaging
- [DONE] Configure Tauri to produce an NSIS Windows installer and use the application icon set.
- [DONE] Add `scripts/build-windows.ps1` to build the native helper, Tauri release, installer, and a self-contained portable folder.
- [REQUIRED] Run the release script locally and fix any packaging/build issues.
- [REQUIRED] Launch `release/Burnt-portable/Burnt.exe` directly and verify the updated application/taskbar icon.
- [REQUIRED] Verify portable build finds bundled FFmpeg/ffprobe by adding real audio files.
- [REQUIRED] Verify portable build finds bundled `burnt-burner.exe` and detects optical-disc states.
- [REQUIRED] Perform one final physical burn from the portable build to prove no development tools or PATH dependencies are required.
- [REQUIRED] Verify the resulting disc plays normally.
- [REQUIRED] Install the generated NSIS package and smoke-test launch, icon, audio probing and disc detection.

## Release polish after packaged-build verification
- [WANTED] Add a small diagnostics view if troubleshooting information is still useful.
- [WANTED] Final copy/layout polish only; do not change the burn engine.
- [WANTED] Set the v1 release version once packaging is proven.

## Later
- [IDEA] Save Project / Burn Another Copy.
- [IDEA] Linux burning backend.
- [IDEA] CD-Text/track-name support. Current `.cda` tracks and lack of embedded source metadata are expected for v1. Do not let CD-Text destabilize v1.

## Established test results
2026-08-30: `reference/imapi-v3` successfully burned two tracks with Windows IMAPI2 on MATSHITA DVD+-RW UJ8A2 1.02. The finalized disc played correctly.

2026-08-30: Full Burnt pipeline prepared source audio, invoked the native helper, burned/finalized/ejected a standard Audio CD, and played successfully both on the computer and on a separate standalone CD player.

2026-08-30: Live disc detection locally verified for no disc, previously burned/nonblank disc, and blank writable disc.

2026-08-30: Live helper event streaming locally verified during a successful physical burn; Burnt displayed which track it was writing while the burn proceeded.

2026-08-30: Final development burn verified within-track progress, current-track presentation, responsive operation, finalization/eject, completion state and the complete Windows v1 workflow. Windows burn behavior is now frozen for v1.
