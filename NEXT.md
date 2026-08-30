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

## Windows burner — hardware verified

- [DONE] Create `native/windows/burnt-burner` from the hardware-tested IMAPI2/file-backed-IStream path.
- [DONE] Add a local MSVC build script that outputs `tools/bin/burnt-burner.exe`.
- [DONE] Connect Tauri to the native helper and pass prepared PCM tracks in UI order.
- [DONE] Keep prepared PCM alive until the helper exits, then clean it on success/failure.
- [DONE] Validate recorder support, blank writable media, PCM sector alignment, and available sectors before writing.
- [DONE] Finalize and eject on a successful burn.
- [DONE] Fix COM lifetime ordering so all IMAPI/COM objects are released before `CoUninitialize()`.
- [DONE] Perform a full integrated burn from the Burnt application.
- [DONE] Confirm the resulting disc plays correctly on the computer.
- [DONE] Confirm the resulting disc plays correctly on a second standalone CD player.

**Regression rule:** The current native Windows burn path is known-good. Do not rewrite, refactor, or replace it casually. Changes to the native helper should be narrowly scoped and followed by hardware verification when they affect burning behavior.

## Current phase — Application integration and feedback

- [REQUIRED] Replace the simulated disc-status bar with live recorder/media status.
- [REQUIRED] Keep the application responsive while preparation and burning are running.
- [REQUIRED] Stream helper status/track events to the UI instead of waiting silently for process exit.
- [REQUIRED] Add clear preparation, burning, finalizing, success, and failure states.
- [REQUIRED] Add the simple completion state with `Burn Another`.
- [WANTED] Show useful per-track/overall progress if IMAPI2 event reporting can be added without destabilizing the proven burn mechanism.
- [WANTED] Make diagnostics available for troubleshooting without exposing them in the normal workflow.

## Packaging and polish

- [REQUIRED] Produce a Windows portable build with FFmpeg, ffprobe, and burnt-burner bundled.
- [REQUIRED] Verify the portable build can burn and play a disc without development tools or PATH dependencies.
- [WANTED] Windows installer after portable operation is proven.
- [WANTED] Application icon and final visual polish.

## Later

- [IDEA] Linux burning backend.
- [IDEA] CD-Text/track-name support. Current `.cda` tracks and lack of embedded source metadata are expected for the v1 CD-DA implementation. Do not let CD-Text complicate or destabilize v1.

## Established test results

2026-08-30: `reference/imapi-v3` successfully burned two tracks with Windows IMAPI2 on MATSHITA DVD+-RW UJ8A2 1.02. The finalized disc played correctly.

2026-08-30: The full Burnt application pipeline successfully prepared source audio, invoked the native helper, burned/finalized/ejected a standard Audio CD, and the resulting disc played successfully both on the computer and on a separate standalone CD player. The Windows application burn path is therefore hardware verified end-to-end.
