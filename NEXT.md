# NEXT

## Current phase — Foundation and UI shell

- [REQUIRED] Scaffold Tauri v2 + React + Vite + TypeScript on `fresh-start`.
- [REQUIRED] Keep the project compartmentalized from the beginning; avoid oversized `App.tsx`/`main.rs` files.
- [REQUIRED] Build the one-screen track-list UI: optional title, add music, reorder, remove, per-track duration, total duration, capacity meter, disc status, Burn CD button.
- [REQUIRED] Make browser/dev-mode simulation possible so most UI work does not consume blank discs.
- [REQUIRED] Establish portable-safe resource/tool paths.

## Next phase — Audio preparation

- [REQUIRED] Integrate ffprobe for metadata/duration.
- [REQUIRED] Bundle/use FFmpeg to convert supported source audio to 44.1 kHz / 16-bit / stereo PCM.
- [REQUIRED] Pad output to complete 2352-byte CD-DA sectors.
- [REQUIRED] Manage and clean temporary conversion files safely.

## Burner integration

- [REQUIRED] Turn `reference/imapi-v3` into a small native Windows burner helper while preserving the known-good IMAPI2/file-backed-IStream path.
- [REQUIRED] Define a small manifest/protocol between Tauri and the burner helper.
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
