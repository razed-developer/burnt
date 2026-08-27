# Next

## Current objective

Phase 2 complete. Proceeding to Phase 3: Optical Hardware.

## Current test version

- Branch: main
- Build result: Clean build (TypeScript + Vite + Cargo)

## What was completed (Phase 2)

### Rust Audio Pipeline

- **Process module** (`src-tauri/src/process/`):
  - Safe tool invocation with `run_tool()` and `run_tool_with_stdin()`
  - `CREATE_NO_WINDOW` flag on Windows for hidden console windows
  - `find_tool()` for PATH-based tool discovery
  - Structured `ProcessOutput` with exit code, stdout, stderr

- **Audio metadata** (`src-tauri/src/audio/metadata.rs`):
  - `probe_file()` — runs ffprobe with JSON output, parses duration/title/artist/album/format
  - `probe_files()` — batch probing
  - Returns `ProbeResult` with success status, metadata, or error

- **Audio conversion** (`src-tauri/src/audio/conversion.rs`):
  - `convert_to_cdda()` — runs ffmpeg to convert to 44100Hz/16-bit/stereo PCM WAV
  - `prepare_temp_dir()` — creates UUID-named temp directory
  - `cleanup_temp_dir()` — removes temp directory

- **Tauri commands** (`src-tauri/src/commands/audio.rs`):
  - `probe_audio_file(path)` — probes single file, returns `ProbeResponse`
  - `probe_audio_files(paths)` — probes multiple files
  - `prepare_track(path, id)` — converts track to CD-DA PCM

### Frontend Integration

- **Audio service** (`src/services/audio.ts`):
  - `probeAudioFile()`, `probeAudioFiles()`, `prepareTrack()` — Tauri invoke wrappers

- **AudioDropZone** updated:
  - Uses Tauri `open()` dialog for file selection (full paths)
  - Drag-and-drop opens dialog as fallback

- **BurnerPage** updated:
  - Calls real `probeAudioFiles()` on file selection
  - Shows "Scanning files..." during probe
  - Displays real metadata and durations from FFprobe

### Build Verification

- TypeScript: zero errors
- Vite: clean production build
- Cargo: clean build with zero warnings

## Testing checklist for the next build

- [ ] FFprobe is found on PATH (tools > 0 required)
- [ ] "Add Audio Files" opens file dialog
- [ ] Selecting MP3 files populates track list with real titles/durations
- [ ] Selecting FLAC files works
- [ ] Selecting WAV files works
- [ ] Selecting M4A files works
- [ ] Selecting OGG files works
- [ ] Corrupt file shows error message on track row
- [ ] Unsupported format shows error message on track row
- [ ] Mixed files (valid + invalid) are handled correctly
- [ ] Capacity meter reflects real durations
- [ ] Remove track updates totals correctly
- [ ] Move up/down reorders tracks
- [ ] Theme toggle works
- [ ] Settings page works
- [ ] No TypeScript errors
- [ ] No Cargo build errors

## Proposed Phase 3 Implementation Plan

Phase 3 implements optical drive detection and media inspection.

### Step 1: Windows Drive Detection

- WMI queries via `wmi` crate for `Win32_CDROMDrive`
- Properties: DeviceID, Drive, Name, Capabilities, MediaLoaded
- Write capability detection
- Drive enumeration

### Step 2: Linux Drive Detection

- udev enumerator for block devices with `ID_CDROM=1`
- Device node detection (`/dev/sr0`)
- Write capability from udev properties

### Step 3: Media Inspection

- Blank disc detection via SCSI READ DISC INFORMATION
- Disc capacity via ATIP (READ TOC/PMA/ATIP)
- Media type (CD-R, CD-RW)

### Step 4: Hotplug Detection

- Windows: `WM_DEVICECHANGE` via hidden message window
- Linux: udev monitor on `block` subsystem

### Step 5: Tauri Commands

- `detect_drives()` — enumerate optical writers
- `inspect_media(drive)` — get disc info
- `get_disc_state(drive)` — current disc status

### Step 6: Frontend Integration

- Replace simulated `useDiscInfo` with real Tauri commands
- Auto-refresh on disc changes
- Display detected drive name and disc status

## Next Implementation Batch

- [ ] Add `wmi` crate to Cargo.toml for Windows drive detection
- [ ] Implement Windows drive enumeration via WMI
- [ ] Implement Linux drive enumeration via udev
- [ ] Implement disc state detection (blank, not-blank, capacity)
- [ ] Create Tauri commands for drive and media detection
- [ ] Integrate with frontend DiscStatus component
- [ ] Test on Windows with optical drive

## Deliberately Postponed

- Actual burning (Phase 4)
- Distribution packaging (Phase 5)
- Hardware testing (Phase 6)
- License choice — deferred until more of the app exists
- FFmpeg bundling as sidecar — system PATH works for development
