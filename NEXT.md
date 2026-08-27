# Next

## Current objective

Phase 0 (Technical Validation and Architecture) is complete for the initial
decisions. Before building the application we must resolve the open questions
below, then implement Phase 1 (UI prototype).

Decisions made so far (see `docs/` and `PROJECT.md`):

- Burning backend: **Windows-native** (IMAPI2 / SPTI-MMC). **No cdrdao** — the
  owner has had issues with cdrdao and prefers a native backend, and it avoids
  bundling a GPL-2.0 helper. See `docs/BURNING-BACKEND.md`.
- Linux backend and Linux optical permissions: **undecided / deferred** to the
  owner. See questions below.
- Audio pipeline: FFmpeg/FFprobe invoked as separate CLI processes (LGPL
  build intended). See `docs/AUDIO-PIPELINE.md`.
- Portable + installed builds from a single codebase. See
  `docs/PORTABLE-MODE.md`.

## Current test version

Phase 1 working prototype (browser simulation). Runs via `npm run dev`
(port 1420) with a simulated burner, simulated disc states, and simulated
burn progress. No physical burning yet.

## What I tested

- Frontend typecheck (`npm run typecheck`) and production build
  (`npm run build`) both pass.
- Manual browser walkthrough of the Burner and Settings screens via
  `localhost:1420` using the simulated disc/burn services (owner verified
  it works end-to-end in simulation).

## Bugs

None reported.

## Required changes

- [REQUIRED] Pin exact versions and window for:
  - FFmpeg/FFprobe (LGPL build) per platform.
  - Windows-native burning and detection (IMAPI2 / SPTI-MMC) — no bundled
    burning helper required.
- [REQUIRED] Validate the Windows-native SCSI-MMC sequence (MODE SELECT,
  SEND CUE SHEET, WRITE, finalization) and CD-TEXT support against real
  hardware (Phase 3).
- [REQUIRED] Owner to decide the **Linux burning backend** and the **Linux
  optical permission model** before Linux burning is finalized.

## Wanted improvements

- [WANTED] Validate Windows-native drive/media/blank/capacity detection with
  real hardware.
- [WANTED] On Linux, decide whether to bundle audio/burn helpers or rely on
  distribution packages.

## Ideas for later

- [IDEA] A cdrdao-based Linux backend, or another Linux burning mechanism, if
  the owner later chooses one. Not V1.

## Questions to discuss

- [QUESTION] **Linux burning backend** — owner has not chosen one. Options:
  cdrdao via Linux SG_IO (works well), `wodim`/`cdrtools`,
  libburnia (`xorriso`/`cdrskin`), or a native Rust SCSI-MMC path to `/dev/sr*`
  mirroring the Windows backend. Recommendation: native SCSI-MMC to keep both
  platforms conceptually aligned and avoid an external helper.
- [QUESTION] **Linux optical permissions** — owner has said they do not know
  enough to choose. So this is deferred. Modern systemd distros grant the
  active console user access via udev `uaccess`/ACL plus `cdrom`/`optical`
  group membership (never root, no SUID helper). Recommended target: the
  `uaccess`/ACL model + documenting group membership for the distributions we
  support. Owner to confirm which distributions to target.

## Next implementation batch

1. Phase 1 (UI prototype) is implemented in `src/` (Burner + Settings pages,
   track list, capacity meter, simulated disc/burn states, light/dark/system
   themes) and verified in the browser. Remaining Phase 1 hardening:
   - Rust backend stubs (`burn_start`, `burn-progress`, `disc_detect_drives`,
     `disc_detect_media`, `disc_eject`, `settings_load`, `settings_save`) so
     the app compiles and runs as a Tauri desktop window.
   - Tauri scaffolding: `Cargo.toml`, `tauri.conf.json`,
     `capabilities/default.json`, `main.rs`/`lib.rs`, app icon.
2. Configure git remote and initialize repository when requested (directory is
   not yet a repo).

## Deliberately postponed

- Full audio conversion pipeline (Phase 2) until UI prototype is in place.
- Optical hardware integration (Phase 3) until backend details are validated.
- Physical burning (Phase 4) and distribution (Phase 5).
- Project saving (not a V1 requirement; architecture keeps it possible).
- CD-RW erasing without explicit user action (never automatic).

## Testing checklist for the next build

- Empty track list, one track, many tracks.
- Long track names, missing metadata, duplicate names.
- Near / exact / over-capacity compilations.
- Light and dark themes.
- Keyboard navigation and accessible labels.
- Small window and high-DPI display.
- Portable folder moved to another directory still runs.
- No console window flashes on Windows.
