# Next

## Current objective

Phase 3 complete. Proceeding to Phase 4: Burning.

## Current test version

- Branch: main
- Build result: Clean build (TypeScript + Vite + Cargo)

## What was completed (Phase 3)

### Rust Disc Detection Module

- **Windows** (`src-tauri/src/disc/platform/windows.rs`):
  - Drive enumeration via `GetLogicalDrives` + `GetDriveTypeW` (DRIVE_CDROM = 5)
  - Media inspection via `CreateFileW` to check media presence
  - cdrdao fallback for detailed disc info (blank, capacity, type)

- **Linux** (`src-tauri/src/disc/platform/linux.rs`):
  - Drive enumeration via udev (`ID_CDROM=1` property)
  - Legacy path fallback (`/dev/sr0`, `/dev/cdrom`, `/dev/dvd`)
  - Media inspection via sysfs and udev properties
  - Blank media type detection (CD-R, CD-RW)

- **Shared types** (`src-tauri/src/disc/mod.rs`):
  - `DriveInfo` — name, path, can_write_cd, is_writable
  - `MediaInfo` — has_media, is_blank, is_writable, capacity_minutes, media_type, disc_state
  - `DiscState` enum — NoDrive, NoMedia, Blank, NotBlank, NotWritable, Unknown

### Tauri Commands

- `detect_drives()` — enumerate optical writers
- `inspect_media(drivePath)` — get disc info for specific drive
- `get_disc_info()` — auto-detect first drive and inspect

### Frontend Integration

- **Disc service** (`src/services/disc.ts`):
  - `detectDrives()`, `inspectMedia()`, `getDiscInfo()` — Tauri invoke wrappers

- **useDiscInfo hook** updated:
  - Calls real `getDiscInfo()` on mount
  - Polls every 3 seconds for disc changes
  - Maps Rust `DiscState` to TypeScript `DiscState`
  - Graceful fallback if detection fails

- **DiscStatus** shows:
  - Drive name when detected
  - Plain-language disc state messages
  - Color-coded states (green for blank, yellow for not-blank, red for not-writable)

### Build Verification

- TypeScript: zero errors
- Vite: clean production build
- Cargo: clean build with zero warnings

## Testing checklist for the next build

- [ ] Drive detection runs on startup
- [ ] Drive name is displayed in disc status
- [ ] No-drive state shows "No CD burner found"
- [ ] No-media state shows "Please insert a blank CD"
- [ ] Blank CD shows "Blank CD-R" in green
- [ ] Non-blank disc shows warning
- [ ] Disc status updates when disc is inserted/removed
- [ ] Polling stops when component unmounts
- [ ] No TypeScript errors
- [ ] No Cargo build errors

## Proposed Phase 4 Implementation Plan

Phase 4 implements the actual burn workflow.

### Step 1: Burn Backend Abstraction

- `BurnBackend` trait with platform implementations
- Windows: IMAPI2 via COM
- Linux: cdrdao subprocess

### Step 2: Burn Preparation

- Generate TOC file (Linux) or IMAPI2 stream (Windows)
- CD-TEXT generation from track metadata
- Temporary file management

### Step 3: Burn Execution

- Initiate burn with progress reporting
- Parse cdrdao stderr for progress (Linux)
- IMAPI2 COM events for progress (Windows)

### Step 4: Burn Completion

- Finalization handling
- Success/failure reporting
- Disc eject option
- Burn Another flow

### Step 5: Error Handling

- Friendly error messages for common failures
- Technical details for troubleshooting
- Recovery without losing track list

## Next Implementation Batch

- [ ] Create BurnBackend trait and platform stubs
- [ ] Implement TOC file generation for cdrdao
- [ ] Implement CD-TEXT generation from track metadata
- [ ] Create Tauri commands for burn workflow
- [ ] Wire burn progress to frontend BurnProgress component
- [ ] Test simulated burn flow with real TOC generation

## Deliberately Postponed

- IMAPI2 COM integration (requires careful unsafe Rust) — defer to after cdrdao works
- Distribution packaging (Phase 5)
- Hardware testing (Phase 6)
- License choice
