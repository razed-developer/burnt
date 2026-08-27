# Next

## Current objective

Phase 4 complete. Proceeding to Phase 5: Polish & real-device testing.

## Current test version

- Branch: main
- Build result: Clean build (TypeScript + Vite + Cargo, zero warnings)
- Tests: 3/3 passing (TOC generation)

## What was completed (Phase 4)

### Burn Module (Rust)

- **`src-tauri/src/burn/mod.rs`** — shared types:
  - `BurnTrack` — index, title, artist, path, duration_secs
  - `BurnOptions` — drive_path, cd_title, catalog, tracks, speed, simulate, eject
  - `BurnProgress` — tagged enum (Stage, TrackWriting, Percent, Done, Error)

- **`src-tauri/src/burn/toc.rs`** — cdrdao TOC file generation:
  - CD_DA header, CATALOG line
  - CD_TEXT with LANGUAGE_MAP and per-track TITLE/PERFORMER
  - AUDIOFILE entries with escaped paths
  - 3 unit tests (all passing)

- **`src-tauri/src/burn/cdrdao.rs`** — cdrdao backend:
  - `find_cdrdao()` — locates cdrdao on PATH
  - `burn()` — spawns cdrdao write process
  - Parses stderr for progress (track writing, percentage, stage changes)
  - Progress streamed via `mpsc::Sender<BurnProgress>`
  - Temp directory cleanup after burn

### Tauri Commands

- `start_burn(request, channel)` — runs burn in background thread, streams progress via Channel
- `check_cdrdao()` — verifies cdrdao is available

### Frontend Integration

- **`src/services/burn.ts`** — Tauri invoke wrappers:
  - `startBurn(request, onProgress)` — starts burn with real-time progress callback
  - `checkCdrdao()` — checks if cdrdao is installed

- **BurnerPage updated:**
  - Replaced simulated interval burn with real `startBurn()` call
  - Maps BurnProgress events to component state (stage, track, percent, done, error)
  - Uses settings for drive path, speed, eject preference

### Burn Workflow

1. Frontend calls `start_burn` with tracks, drive, title, speed
2. Rust generates TOC file with CD-TEXT from track metadata
3. Rust spawns `cdrdao write` process
4. Progress parsed from cdrdao stderr and streamed to frontend
5. Frontend updates BurnProgress UI in real-time
6. On completion: success screen; on error: friendly error with details

## Testing checklist for the next build

- [ ] cdrdao is detected on PATH
- [ ] Burn starts and shows preparing stage
- [ ] Burning stage shows track progress
- [ ] Finalizing stage shows after all tracks written
- [ ] Success screen appears on completion
- [ ] Error screen appears with message if burn fails
- [ ] "Try Again" button retries the burn
- [ ] "Cancel" button returns to track list
- [ ] Drive path is correctly passed to cdrdao
- [ ] Burn speed setting is respected
- [ ] CD title appears in TOC file
- [ ] Track titles and artists appear in TOC CD-TEXT

## Proposed Phase 5 Implementation Plan

Phase 5 focuses on polish and real-device testing.

### Step 1: Real Device Testing

- Test with actual CD-R and CD-RW media
- Verify cdrdao progress parsing with real hardware
- Test error cases (bad disc, drive busy, etc.)

### Step 2: UI Polish

- Smooth transitions between burn stages
- Better empty states
- Keyboard shortcuts
- Window title updates

### Step 3: Settings Improvements

- Burn speed selector with detected speeds
- Default CD title setting
- Recent compilations history

### Step 4: Error Handling Polish

- User-friendly error messages for all failure modes
- Recovery suggestions
- Technical details accessible but not prominent

## Deliberately Postponed

- IMAPI2 COM integration (Windows-native burning) — defer to after cdrdao works on both platforms
- Distribution packaging (Phase 6)
- License choice
