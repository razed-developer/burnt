# NEXT

## Foundation and UI shell

- [DONE] Scaffold Tauri v2 + React + Vite + TypeScript on `fresh-start`.
- [DONE] Keep the project compartmentalized from the beginning; avoid oversized `App.tsx`/`main.rs` files.
- [DONE] Build the one-screen track-list UI: optional title, add music, reorder, remove, total duration, capacity meter, disc status, Burn CD button.
- [DONE] Make browser/dev-mode simulation possible so most UI work does not consume blank discs.
- [DONE] Establish portable-safe resource/tool layout and document executable-relative/resource path requirement.

## Current phase — Audio preparation

- [DONE] Integrate ffprobe for real metadata/duration when files are selected.
- [DONE] Add FFmpeg orchestration to convert supported source audio to raw 44.1 kHz / 16-bit / stereo PCM.
- [DONE] Pad prepared PCM to complete 2352-byte CD-DA sectors.
- [DONE] Create per-run temporary conversion folders and cleanup commands.
- [DONE] Configure packaged Tauri builds to include locally supplied `tools/bin/*` resources.
- [REQUIRED] Put `ffmpeg.exe` and `ffprobe.exe` in `tools/bin/` on the Windows development PC.
- [REQUIRED] Pull and locally verify `npm run build` and `npm run tauri dev`.
- [REQUIRED] Add several real MP3/M4A/FLAC/WAV/OGG files and confirm real durations appear.
- [REQUIRED] Click **Burn CD** with no blank disc required; confirm the UI reports that all tracks were prepared successfully.

## Next phase — Burner integration

- [REQUIRED] Turn `reference/imapi-v3` into a small native Windows burner helper while preserving the known-good IMAPI2/file-backed-IStream path.
- [REQUIRED] Define a small manifest/protocol between Tauri and the burner helper.
- [REQUIRED] Keep prepared PCM alive until the helper finishes, then clean it on success/failure.
- [REQUIRED] Add recorder/media detection and useful error reporting.
- [REQUIRED] Add burn progress reporting.
- [REQUIRED] Hardware-test the integrated app with a new blank CD before considering burning complete.

## Packaging and polish

- [REQUIRED] Produce a Windows portable build with all required runtime tools bundled.
- [WANTED] Windows installer after portable operation is proven.
- [WANTED] Application icon and final visual polish.

## Later

- [IDEA] Linux burning backend.
- [IDEA] CD-Text/track-name support. Do not let this complicate v1.

## Established test result

2026-08-30: `reference/imapi-v3` successfully burned two tracks with Windows IMAPI2 on MATSHITA DVD+-RW UJ8A2 1.02. The finalized disc played correctly. Preserve this implementation as the regression reference.
