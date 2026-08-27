# Next

## Current objective

Phase 0 complete. Proceeding to Phase 1: UI Prototype.

## Current test version

- Branch: main
- Build result: Not yet scaffolded

## Decisions Made (Phase 0)

### Burning Backend

| Platform | Backend | Reason |
|----------|---------|--------|
| Windows | IMAPI2 (COM, built-in) | Zero licensing issues. Full DAO + CD-TEXT. No external tool. |
| Linux | cdrdao (user-installed) | Gold standard for DAO audio CD. GPL-2.0 — must not bundle. |

Rejected: wodim (dead), cdrecord (licensing conflict), libisoburn (data-only), custom Rust SCSI (too much effort).

### Optical Drive Detection

| Platform | Enumeration | Hotplug | Media Info |
|----------|------------|---------|------------|
| Windows | WMI (`Win32_CDROMDrive`) | `WM_DEVICECHANGE` | IMAPI2 `GetMediaState()` |
| Linux | udev enumerator | udev monitor on `block` | SCSI `READ DISC INFORMATION` via SG_IO |

### Audio Pipeline

- **FFprobe** for metadata (JSON output, concurrency-limited)
- **FFmpeg** for conversion to CD-DA PCM WAV (44100/16/stereo)
- Both bundled as sidecar binaries
- Rust-native probing via `symphonia`/`lofty` is a future optimization

### Linux Permissions

- Require `cdrom` group membership
- Detect permission issues and show helpful guidance
- Provide udev rule documentation
- Open `/dev/sr0` directly via SG_IO (no setuid binaries)

### Portable Mode

- Portable if `data/` directory exists next to executable
- Installed uses OS-appropriate paths (`%APPDATA%` on Windows, `~/.config` on Linux)
- Settings stored as JSON
- All paths relative to executable directory, never CWD

## Technical Risks

1. **IMAPI2 Rust bindings** — The `windows` crate has raw COM interfaces. Requires careful `unsafe` usage. Mitigation: wrap behind safe abstractions early.
2. **cdrdao stderr format** — Progress parsing depends on cdrdao's output format. Mitigation: parse flexibly, test with versions from Ubuntu, Fedora, Arch.
3. **USB optical drives** — Some USB drives have quirks with both IMAPI2 and cdrdao. Mitigation: test with representative USB hardware in Phase 6.
4. **FFmpeg binary size** — Full FFmpeg is ~80-100MB. Mitigation: use "essentials" build (~25-30MB) or custom minimal build (~15MB) with only needed codecs.
5. **Linux distro permissions** — cdrom group setup varies. Mitigation: clear documentation, detect and explain failures.

## Unresolved Questions

1. Should the app license be MIT, Apache-2.0, or GPL-2.0? (Affects whether we could ever bundle cdrdao.)
2. Should we use Tauri sidecars or resource bundling for FFmpeg?
3. How minimal should the FFmpeg build be? (Size vs format coverage tradeoff.)
4. Should Phase 1 include simulated disc states and burn progress, or focus purely on the track management UI?

## Files Created

- `docs/ARCHITECTURE.md` — system architecture, module boundaries, data flow
- `docs/BURNING-BACKEND.md` — backend comparison, IMAPI2/cdrdao details, BurnBackend trait
- `docs/AUDIO-PIPELINE.md` — FFprobe/FFmpeg usage, metadata, conversion, concurrency
- `docs/PORTABLE-MODE.md` — portable vs installed detection, paths, Tauri config
- `PREFERENCE.md` — persistent development and design preferences

## Proposed Phase 1 Implementation Plan

Phase 1 builds the complete frontend experience without physical burning. The UI should already feel close to the final product.

### Step 1: Project Scaffolding

- Create Tauri v2 project with React + TypeScript + Vite
- Set up Tailwind CSS
- Configure Tauri window (title, size, min size, decorations)
- Set up project structure per `docs/ARCHITECTURE.md`

### Step 2: Core Types and State

- Define TypeScript types for `Track`, `DiscInfo`, `BurnState`, `Settings`
- Create React context/hooks for application state
- Set up Tauri command stubs returning mock data

### Step 3: Main Screen Layout

- Build the main Burner page with:
  - CD title input
  - Track list area
  - Capacity meter
  - Disc status area
  - Burn button
- Empty state with drop zone prompt
- Settings page skeleton

### Step 4: Audio Import

- File picker with multi-select (via Tauri dialog)
- Drag-and-drop onto track area
- Folder drop handling (scan immediate children)
- Tauri commands for file dialog invocation

### Step 5: Track List

- Track row component (number, title, duration, remove button)
- Drag-and-drop reordering
- Track numbering auto-update
- Duration display per track and total
- Keyboard-accessible reordering (move up/down buttons)

### Step 6: Capacity Meter

- Visual progress bar (used / remaining)
- Time display (e.g., "54:31 / 80:00")
- Over-capacity state with warning
- Remaining time display

### Step 7: Theme System

- Light / Dark / System toggle
- CSS variables / design tokens
- System preference detection

### Step 8: Settings Page

- Theme selector
- Burn speed (Advanced)
- Eject after burn toggle
- About section

### Step 9: Simulated States

- Mock disc status (no disc, blank CD, wrong disc, etc.)
- Simulated burn progress (preparing, writing, finalizing)
- Success and failure screens
- Burn Another flow

### Step 10: Build Verification

- `npm run build` passes
- TypeScript type checking passes
- Linting passes
- Application starts and displays correctly
- All mock flows work

## Next Implementation Batch

- [ ] Scaffold Tauri v2 + React + TypeScript + Vite project
- [ ] Set up Tailwind CSS and theme system
- [ ] Create core types and state management
- [ ] Build main screen layout with empty state
- [ ] Implement file picker and drag-and-drop import
- [ ] Build track list with reorder and remove
- [ ] Build capacity meter
- [ ] Implement settings page
- [ ] Add simulated disc states and burn progress
- [ ] Verify build, types, and lint

## Deliberately Postponed

- FFmpeg/FFprobe integration (Phase 2)
- Optical drive detection (Phase 3)
- Actual burning (Phase 4)
- Distribution packaging (Phase 5)
- Hardware testing (Phase 6)
- License choice — deferred until more of the app exists

## Testing checklist for the next build

- [ ] Tauri dev server starts without errors.
- [ ] Main screen renders with empty state.
- [ ] File picker opens and accepts audio files.
- [ ] Drag-and-drop adds files to the track list.
- [ ] Track list shows title, duration, and remove button.
- [ ] Drag-and-drop reordering works.
- [ ] Capacity meter updates when tracks are added/removed.
- [ ] Settings page opens and theme toggle works.
- [ ] Light and dark themes apply correctly.
- [ ] Application window has minimum size enforced.
- [ ] No TypeScript errors.
- [ ] No lint errors.
