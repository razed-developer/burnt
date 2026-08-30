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

## Current phase — Burner integration

- [DONE] Create `native/windows/burnt-burner` from the hardware-tested IMAPI2/file-backed-IStream path.
- [DONE] Add a local MSVC build script that outputs `tools/bin/burnt-burner.exe`.
- [DONE] Connect Tauri to the native helper and pass prepared PCM tracks in UI order.
- [DONE] Keep prepared PCM alive until the helper exits, then clean it on success/failure.
- [DONE] Validate recorder support, blank writable media, PCM sector alignment, and available sectors before writing.
- [DONE] Finalize and eject on a successful burn.
- [REQUIRED] Build the helper locally from a Visual Studio Developer Command Prompt: `native\windows\burnt-burner\build.bat`.
- [REQUIRED] Run `npm run tauri dev` with a blank CD-R/CD-RW inserted and perform the first integrated hardware burn.
- [REQUIRED] Confirm the resulting disc plays and track order/audio are correct.
- [WANTED] After the first integrated burn succeeds, add live helper event/progress streaming instead of waiting for the helper process to exit.
- [WANTED] Replace simulated disc-status bar with live recorder/media status.

## Packaging and polish

- [REQUIRED] Produce a Windows portable build with FFmpeg, ffprobe, and burnt-burner bundled.
- [WANTED] Windows installer after portable operation is proven.
- [WANTED] Application icon and final visual polish.

## Later

- [IDEA] Linux burning backend.
- [IDEA] CD-Text/track-name support. Do not let this complicate v1.

## Established test result

2026-08-30: `reference/imapi-v3` successfully burned two tracks with Windows IMAPI2 on MATSHITA DVD+-RW UJ8A2 1.02. The finalized disc played correctly. Preserve this implementation as the regression reference.
