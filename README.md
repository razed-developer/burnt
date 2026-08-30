# Burnt

**A deliberately simple Audio CD burner.**

Burnt is a small Windows desktop application for turning ordinary audio files into standard Audio CDs that can play in computers, stereos, car CD players, and other compatible CD players.

The goal is intentionally narrow: add music, see how much of the disc is used, insert a blank writable CD, and burn it.

## Burnt 1.0

The Windows 1.0 release includes:

- MP3, M4A, FLAC, WAV, AAC, OGG and other formats supported by the bundled FFmpeg tools;
- real track durations and Audio-CD capacity calculation;
- track reordering and removal;
- automatic optical-drive and disc-state detection;
- blank-disc validation before burning;
- track-by-track burn status;
- finalization and automatic eject after a successful burn;
- a portable Windows build;
- a current-user Windows installer.

Burnt creates standard CD-DA Audio CDs using Windows IMAPI2 Track-at-Once burning. Source audio is converted to 44.1 kHz, 16-bit stereo PCM before writing.

## Important v1 notes

- Windows is the supported platform for Burnt 1.0.
- A compatible CD/DVD writer and blank writable CD are required.
- The optional **CD Title** field is currently a Burnt project/display label. Burnt 1.0 does not write CD-Text, so the title and original source filenames should not be expected to appear on standalone CD players.
- Track-at-Once Audio CDs normally include the standard inter-track gaps associated with this burning method.

## Building on Windows

Requirements:

- Node.js / npm
- Rust toolchain
- Tauri v2 Windows prerequisites
- Visual Studio C++ Build Tools / MSVC
- `ffmpeg.exe` and `ffprobe.exe` in `tools/bin/`

Build the release locally with:

```powershell
npm install
.\scripts\build-windows.ps1
```

The script builds the native Windows burner helper, the Tauri application, the NSIS installer, and the self-contained portable folder.

Expected outputs include:

```text
release/Burnt-portable/
src-tauri/target/release/bundle/nsis/
```

The portable folder contains Burnt and its required bundled tools. Keep the folder contents together when moving it to another computer.

## Development

Run the desktop application with:

```powershell
npm run tauri dev
```

For the browser-only UI preview:

```powershell
npm run dev
```

The browser preview uses simulated disc state and does not perform physical burning.

## Verified Windows workflow

Burnt's Windows burn path has been tested with a MATSHITA DVD+-RW UJ8A2 drive. The complete application workflow has successfully prepared audio, detected writable media, burned and finalized an Audio CD, ejected it, and produced a disc that played both on a computer and a separate standalone CD player.

The Windows v1 burn mechanism is intentionally frozen: release-polish changes should not refactor the hardware-tested IMAPI2 path without another physical burn verification.

## Project direction

Possible post-1.0 work includes a Linux burning backend, saved projects / Burn Another Copy, and optional CD-Text support. These are intentionally outside the Windows 1.0 release.
