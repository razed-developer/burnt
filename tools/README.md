# Bundled tools

Portable runtime executables live under `tools/bin/` and are intentionally ignored so large third-party binaries are not committed to Git.

## Audio-preparation phase

For Windows development, place these files here before running the Tauri app:

- `tools/bin/ffmpeg.exe`
- `tools/bin/ffprobe.exe`

Burnt now uses `ffprobe` to read real track duration and `ffmpeg` to prepare each selected source as raw 44.1 kHz / 16-bit / stereo PCM. Prepared PCM is padded to a complete 2352-byte CD-DA sector and stored in a per-run folder under the Windows temporary directory.

The current UI deliberately cleans those prepared files immediately after the preparation test. The next burner-integration phase will keep them only long enough to hand them to the native IMAPI2 helper, then clean them after success or failure.

## Burner helper

The later Windows layout will also include:

- `tools/bin/burnt-burner.exe`

Application code resolves tools from Tauri resources / executable-relative paths and does not assume the process current working directory. `src-tauri/tauri.conf.json` includes `tools/bin/*` as bundled resources for packaged builds.
