# Next

## Current objective

Phase 1 complete. Proceeding to Phase 2: Audio Pipeline.

## Current test version

- Branch: main
- Build result: Clean build (TypeScript + Vite + Cargo)

## What was completed (Phase 1)

- Tauri v2 + React + TypeScript + Vite scaffolding
- Tailwind CSS with light/dark/system theme system using CSS variables
- Core types: `Track`, `DiscInfo`, `BurnState`, `Settings`
- Custom hooks: `useTrackList`, `useDiscInfo`, `useTheme`
- Main Burner page with CD title, track list, capacity meter, disc status, burn button
- Audio drop zone with file picker and drag-and-drop
- Track list with move up/down buttons and remove
- Capacity meter with over-capacity detection
- Disc status display with simulated states
- Settings page with theme, drive, burn speed, eject toggle
- Burn progress UI with preparing/writing/finalizing stages, success, and failure screens
- Simulated demo tracks for testing
- Placeholder application icons
- TypeScript type checking passes
- Vite production build passes
- Cargo build passes

## Testing checklist for the next build

- [ ] Tauri dev server starts without errors.
- [ ] Main screen renders with empty state.
- [ ] "Load demo tracks" button populates track list.
- [ ] File picker opens and accepts audio files.
- [ ] Drag-and-drop adds files to the track list.
- [ ] Track list shows title, duration, and remove button.
- [ ] Move up/down buttons reorder tracks.
- [ ] Capacity meter updates when tracks are added/removed.
- [ ] Settings page opens and theme toggle works.
- [ ] Light and dark themes apply correctly.
- [ ] Burn button enables/disables based on conditions.
- [ ] Simulated burn progress completes successfully.
- [ ] Application window has minimum size enforced.
- [ ] No TypeScript errors.
- [ ] No Cargo build errors.

## Proposed Phase 2 Implementation Plan

Phase 2 implements the audio pipeline: FFprobe for metadata extraction and FFmpeg for conversion to CD-DA PCM.

### Step 1: Process Module

- Centralized process invocation for external tools
- Safe argument construction (no shell interpolation)
- `CREATE_NO_WINDOW` on Windows
- Structured stdout/stderr capture
- Timeout handling

### Step 2: FFprobe Integration

- `ffprobe -print_format json -show_format -show_streams`
- Parse metadata: duration, title, artist, album, format
- Concurrency-limited batch probing (max 8 parallel)
- Error handling for corrupt/unsupported files
- Fallback to filename when metadata is absent

### Step 3: Audio Conversion

- `ffmpeg -i input -ar 44100 -ac 2 -acodec pcm_s16le output.wav`
- Temporary directory per burn session
- Parallel conversion (max 4 concurrent)
- Progress tracking
- Cleanup on success and failure

### Step 4: FFmpeg/FFprobe Bundling

- Download static builds for Windows and Linux
- Tauri sidecar configuration
- Binary path resolution (portable vs installed)
- Verify binaries work from the bundled location

### Step 5: Rust Commands

- `probe_audio_file(path) -> TrackInfo`
- `probe_audio_files(paths) -> Vec<TrackInfo>`
- `prepare_tracks(tracks, temp_dir) -> Vec<PreparedTrack>`
- `get_audio_info(path) -> AudioInfo`

### Step 6: Frontend Integration

- Replace simulated track creation with real Tauri commands
- Show probe progress when adding many files
- Display real metadata and durations
- Handle probe failures gracefully

## Next Implementation Batch

- [ ] Build process invocation module
- [ ] Implement FFprobe metadata extraction
- [ ] Implement FFmpeg audio conversion
- [ ] Configure FFmpeg/FFprobe as Tauri sidecars
- [ ] Create Rust Tauri commands for audio pipeline
- [ ] Integrate with frontend track list
- [ ] Test with MP3, FLAC, WAV, M4A, OGG files
- [ ] Verify TypeScript and Cargo builds

## Deliberately Postponed

- Optical drive detection (Phase 3)
- Actual burning (Phase 4)
- Distribution packaging (Phase 5)
- Hardware testing (Phase 6)
- License choice — deferred until more of the app exists
