# NEXT

## Burnt 1.0 — Windows release candidate

The Windows v1 application is feature-complete and locally verified.

### Core workflow
- [DONE] Tauri v2 + React + Vite + TypeScript desktop application.
- [DONE] Add, inspect, reorder and remove source audio.
- [DONE] Real duration probing with bundled ffprobe.
- [DONE] FFmpeg conversion to raw 44.1 kHz / 16-bit / stereo PCM.
- [DONE] CD-DA sector padding and temporary-file cleanup.
- [DONE] Native Windows IMAPI2 Track-at-Once burner helper.
- [DONE] Automatic recorder/media detection and blank-disc gating.
- [DONE] Disc swaps detected while the application remains open.
- [DONE] Track-by-track burn feedback.
- [DONE] Finalization, eject, visible success/failure states and Burn Another reset.
- [DONE] Blocking media work kept off the UI execution path.

### Verification
- [DONE] Full development burn and playback on computer.
- [DONE] Resulting disc played on a separate standalone CD player.
- [DONE] No-disc, used-disc and blank-writable-disc detection.
- [DONE] Live helper event streaming during a physical burn.
- [DONE] Portable Windows build launches without unwanted console windows.
- [DONE] Portable resource discovery for FFmpeg/ffprobe/native helper.
- [DONE] NSIS installed build launches without unwanted console windows.
- [DONE] NSIS resource discovery for FFmpeg/ffprobe/native helper.
- [DONE] Installed build audio probing and disc detection.
- [DONE] Disc swapping refreshes automatically without leaving the drive locked.

### Release polish
- [DONE] Windows application icon set.
- [DONE] Dark toasted visual theme.
- [DONE] Burnt-toast in-app logo asset support.
- [DONE] Compact default window and empty-state layout.
- [DONE] Remove unreliable within-track percentage bar while retaining truthful track-level status.
- [DONE] Set release version to 1.0.0.
- [DONE] Replace development README with release documentation.

**Regression rule:** The Windows 1.0 burn workflow is frozen and hardware verified. Do not rewrite, refactor, or replace the native burn mechanism for polish. Changes affecting physical burning require a new hardware burn verification.

## Final local release build

Run:

```powershell
npm install
.\scripts\build-windows.ps1
```

Then retain the generated Windows installer and portable build as the 1.0.0 release artifacts.

## Post-1.0 ideas
- [IDEA] Save Project / Burn Another Copy.
- [IDEA] Linux burning backend.
- [IDEA] CD-Text/track-name support. Current `.cda` tracks and lack of embedded source metadata are expected for v1.

## Established test results

2026-08-30: `reference/imapi-v3` successfully burned two tracks with Windows IMAPI2 on MATSHITA DVD+-RW UJ8A2 1.02. The finalized disc played correctly.

2026-08-30: Full Burnt pipeline prepared source audio, invoked the native helper, burned/finalized/ejected a standard Audio CD, and played successfully both on the computer and on a separate standalone CD player.

2026-08-30: Live disc detection locally verified for no disc, previously burned/nonblank disc, and blank writable disc.

2026-08-30: Live helper event streaming locally verified during a successful physical burn; Burnt displayed which track it was writing while the burn proceeded.

2026-08-30: Windows portable and NSIS installed builds verified for clean launch and bundled-tool/helper discovery. Disc swapping and drive release behavior work as expected.
