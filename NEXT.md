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
- [DONE] Native IMAPI2/file-backed-IStream burn helper.
- [DONE] Local MSVC build script to `tools/bin/burnt-burner.exe`.
- [DONE] Tauri integration, ordered PCM handoff, cleanup, media validation, finalization and eject.
- [DONE] COM lifetime ordering fix.
- [DONE] Full integrated burn and playback on computer plus separate standalone CD player.

**Regression rule:** The current native Windows burn path is known-good. Do not rewrite, refactor, or replace it casually. Changes to native burn behavior must be narrow and hardware verified.

## Application integration and feedback
- [DONE] Replace simulated disc status with live recorder/media detection.
- [DONE] Locally verify empty tray, previously burned disc, and blank writable disc states.
- [DONE] Gate Burn CD on a real blank writable disc.
- [DONE] Stream helper status/track events live to React.
- [DONE] Locally verify live track-number feedback during a successful physical burn.
- [DONE] Move blocking ffprobe/FFmpeg/helper work off Tauri's command/UI execution path.
- [DONE] Add preparation, writing, finalizing, success, and visible failure states.
- [DONE] Add completion screen and `Burn Another` reset.
- [READY TO VERIFY] Add isolated IMAPI2 Track-at-Once progress subscription for within-track percentage. Microsoft documents DDiscFormat2TrackAtOnceEvents as the supported progress mechanism for AddAudioTrack; the proven AddAudioTrack/file-stream path itself is unchanged.
- [READY TO VERIFY] Show active phase, track number, source track name, and within-track progress bar.

## Next physical burn — final development workflow check
Use one blank CD-R to verify together:
1. Blank disc is detected and enables Burn CD.
2. UI remains responsive during preparation and writing (no Windows `Not Responding`).
3. Active burn panel shows preparation/start/track/finalization phases.
4. Current track name and `Track N of N` are correct.
5. IMAPI progress percentage advances while a track is being written.
6. Disc finalizes and ejects.
7. Completion screen appears.
8. Finished disc plays in a standalone CD player.
9. `Burn Another` clears title/tracks/result and returns to blank-disc detection.

If this passes, freeze the Windows burn workflow and proceed to packaging. Do not spend another disc on feature work unless a later change affects physical burning.

## Packaging and polish
- [REQUIRED] Produce a Windows portable build with FFmpeg, ffprobe, and burnt-burner bundled.
- [REQUIRED] Verify portable build can burn without development tools or PATH dependencies.
- [REQUIRED] Verify application/taskbar icon in packaged build; dev-mode blank icon may not represent packaged behavior.
- [WANTED] Windows installer after portable operation is proven.
- [WANTED] Application icon and final visual polish.
- [WANTED] Diagnostics view for troubleshooting without cluttering normal workflow.

## Later
- [IDEA] Save Project / Burn Another Copy.
- [IDEA] Linux burning backend.
- [IDEA] CD-Text/track-name support. Current `.cda` tracks and lack of embedded source metadata are expected for v1. Do not let CD-Text destabilize v1.

## Established test results
2026-08-30: `reference/imapi-v3` successfully burned two tracks with Windows IMAPI2 on MATSHITA DVD+-RW UJ8A2 1.02. The finalized disc played correctly.

2026-08-30: Full Burnt pipeline prepared source audio, invoked the native helper, burned/finalized/ejected a standard Audio CD, and played successfully both on the computer and on a separate standalone CD player.

2026-08-30: Live disc detection locally verified for no disc, previously burned/nonblank disc, and blank writable disc.

2026-08-30: Live helper event streaming locally verified during a successful physical burn; Burnt displayed which track it was writing while the burn proceeded.
