# Bundled tools

Portable runtime executables will live under `tools/bin/` and are intentionally ignored until the FFmpeg/audio-preparation phase.

Expected Windows layout later:

- `tools/bin/ffmpeg.exe`
- `tools/bin/ffprobe.exe`
- `tools/bin/burnt-burner.exe`

Application code must resolve these from Tauri resources / executable-relative paths rather than assuming the process current working directory.
