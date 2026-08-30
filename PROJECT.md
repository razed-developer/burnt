# Burnt

Burnt is a deliberately simple desktop application for creating standard playable Audio CDs.

## Product goal

The primary workflow is intentionally small:

1. Optionally enter a CD title.
2. Add music files.
3. Reorder tracks into the desired play order.
4. See how much Audio-CD time is used/remains.
5. Insert a blank writable CD.
6. Click **Burn CD**.
7. Burnt prepares the audio, writes/finalizes the disc, and ejects it.

The user should not need to understand codecs, PCM, CD sectors, IMAPI2, FFmpeg, or burning modes.

## Primary platform

Version 1 targets Windows as a portable-friendly Tauri v2 application using React, Vite, and TypeScript.

Linux is a later target with a separate platform-specific burning backend. Do not compromise the proven Windows implementation merely to create an early cross-platform abstraction.

## Proven Windows burning path

On 2026-08-30 the standalone proof-of-concept successfully created a playable two-track Audio CD using a MATSHITA DVD+-RW UJ8A2 1.02 drive.

Later the same day, the full Burnt application pipeline was hardware-verified end-to-end: source music files were probed and converted by the app, passed to the native helper, burned through IMAPI2, finalized, ejected, and the resulting standard Audio CD played successfully on the computer and on a second standalone CD player.

This makes the current Windows burn mechanism known-good application code. Preserve it as a regression baseline and avoid changing the native burn path unless a specific bug or requirement makes a change necessary.

Known-good path:

- Windows IMAPI2
- `IDiscFormat2TrackAtOnce`
- 44.1 kHz, 16-bit, stereo PCM
- PCM padded to complete 2352-byte CD-DA sectors
- PCM written to temporary files
- Windows file-backed `IStream` created with `SHCreateStreamOnFileEx`
- one `AddAudioTrack()` call per track
- `PrepareMedia()` before tracks
- `ReleaseMedia()` to finalize
- all COM interface objects released before `CoUninitialize()`
- eject on success

The exact original hardware-tested proof-of-concept is preserved under `reference/imapi-v3/`. Treat it as known-good reference code and do not casually modify it.

An earlier custom/in-memory `IStream` implementation failed at `AddAudioTrack()` with `0x80004005`. The file-backed Windows `IStream` succeeded. Preserve this distinction.

During application integration, the helper initially exited with Windows access violation `0xC0000005`. This was fixed by ensuring all IMAPI/COM interface objects are destroyed before `CoUninitialize()`. The rebuilt helper then completed the verified application burn successfully. Preserve this COM lifetime ordering.

## Application architecture

Keep responsibilities separated:

- React/TypeScript: user interface and track ordering.
- Tauri/Rust: application orchestration, file handling, process management, state/events.
- FFmpeg/ffprobe: inspect and convert common audio formats to CD-quality PCM.
- Native Windows burner helper: small C++ component based closely on the proven IMAPI2 implementation.

For v1, prefer calling the small native burner helper from Tauri rather than rewriting proven COM/IMAPI behavior in Rust. Reliability is more important than language purity.

## Audio input

The UI should accept common music formats where FFmpeg supports them, including at minimum MP3, M4A/AAC, FLAC, WAV, and OGG.

Before burning, each track is converted invisibly to the exact PCM format required by the proven burner path. Temporary conversion output must be cleaned up safely.

## Capacity

Audio-CD capacity is presented primarily as elapsed playing time, not source file size. Do not assume every disc has exactly the same capacity; where possible use the inserted media's reported capacity while keeping the interface understandable.

## CD title and metadata

The title field is optional. For the initial release it is a project/session label only. The verified Audio CD appears normally as `.cda` tracks in Windows; this is expected for CD-DA and does not mean source files were copied to the disc.

Source metadata and filenames are not currently embedded in the disc. Do not promise CD-Text support. CD-Text can be investigated later as a separate feature and should not destabilize the proven v1 burn path.

## UX principles

- One primary screen.
- Add multiple files easily.
- Drag/reorder tracks.
- Remove tracks easily.
- Clear duration/capacity indicator.
- Clear disc status such as `Insert a blank CD` or `Blank CD-R ready`.
- One obvious primary action: `Burn CD`.
- During preparation/burning, show useful progress without exposing unnecessary technical detail.
- On success, eject and show a simple completion state with `Burn Another`.
- Technical diagnostics should remain available for troubleshooting but should not dominate the normal interface.

## Distribution

Windows must support a portable distribution. Avoid requiring cdrdao or a separate burning application/driver. IMAPI2 is the Windows burning backend. FFmpeg/ffprobe and the native helper should be bundled in a predictable portable-safe location.

No GitHub Actions are required for normal development or releases. Builds and hardware verification are performed locally.
