# Burnt

A deliberately simple desktop application for making standard playable Audio CDs.

## Current state

The `fresh-start` branch now includes the first real audio-preparation path behind the Tauri UI:

- selected files are inspected with `ffprobe` for real duration;
- common source formats are converted with `ffmpeg` to raw 44.1 kHz / 16-bit / stereo PCM;
- PCM is padded to complete 2352-byte CD-DA sectors;
- preparation uses per-run temporary folders and exposes cleanup through Tauri;
- browser preview still uses sample tracks and simulated disc status.

Physical burning is not connected to the app yet. The hardware-tested Windows IMAPI2 proof-of-concept remains preserved under `reference/imapi-v3/` and is the reference for the next phase.

## Local development

Requirements:

- Node.js / npm
- Rust toolchain
- Tauri v2 Windows prerequisites (including WebView2 and MSVC build tools)
- portable `ffmpeg.exe` and `ffprobe.exe` placed in `tools/bin/`

Then:

```powershell
npm install
npm run build
npm run tauri dev
```

For a quick UI-only browser preview:

```powershell
npm run dev
```

Open `http://localhost:1420` if it does not open automatically.

## Audio-preparation verification

In the Tauri app, add a few MP3/M4A/FLAC/WAV/OGG files. Their real durations should appear. Clicking **Burn CD** currently performs only the preparation stage and should report that the tracks were prepared; it does not write to the disc yet, so this test consumes no blank CD.

## Current limitations

- Disc detection is still simulated.
- The native IMAPI2 burner helper is not connected yet.
- Burn progress/finalization/eject are therefore not yet driven by the app.
- FFmpeg/ffprobe binaries are intentionally not committed to Git; packaged builds are configured to include `tools/bin/*` resources once those binaries are present locally.

See `NEXT.md` for the active work queue.
