# Next

## Current objective

Phase 6 complete. App is ready for real-device testing.

## Current test version

- Branch: main
- Build result: Clean build (TypeScript + Vite + Cargo)
- Release: `Burnt_0.1.0_x64-setup.exe` (NSIS installer)
- Tests: 3/3 passing (TOC generation)

## What was completed (Phase 6)

### Application Icon

- Custom SVG icon: CD disc with blue flame accent
- Generated all platform sizes via `tauri icon`:
  - Windows: ICO, Appx logos (StoreLogo, Square30-310)
  - macOS: ICNS
  - Linux: PNG (32, 64, 128, 256)
  - iOS: All required sizes
  - Android: All mipmap densities

### Distribution Config

- **Windows**: NSIS installer + MSI, both x64
  - Install mode: both (per-user and machine)
  - Custom installer icon
- **Linux**: AppImage + deb
  - deb depends on `cdrdao`
- **macOS**: ICNS icon, minimum system version 10.15
- Fixed bundle identifier to avoid macOS `.app` conflict

### About Section

- Updated Settings > About with version, description, and cdrdao attribution

### Full Build Pipeline

- `tauri build` produces:
  - `burnt.exe` — release binary
  - `Burnt_0.1.0_x64-setup.exe` — NSIS installer
  - `Burnt_0.1.0_x64_en-US.msi` — MSI installer

## Testing checklist

- [ ] Install via NSIS installer
- [ ] Install via MSI
- [ ] App launches with correct window size
- [ ] Application icon appears in taskbar
- [ ] Theme works (light/dark/system)
- [ ] Drive detection with optical drive present
- [ ] Disc detection with blank CD-R
- [ ] Add audio files via dialog
- [ ] Add audio files via drag-and-drop
- [ ] Track list shows correct order
- [ ] Track reordering works
- [ ] Track removal works
- [ ] CD title persists across settings navigation
- [ ] New CD button clears everything
- [ ] Capacity meter shows correct values
- [ ] Burn starts with cdrdao (requires cdrdao installed)
- [ ] Burn progress updates in real-time
- [ ] Burn success screen appears
- [ ] Burn error shows friendly message
- [ ] Settings: theme switching works
- [ ] Settings: burn speed selection works
- [ ] Settings: eject toggle works
- [ ] Escape closes settings
- [ ] Window title updates with track count

## Known requirements

- cdrdao must be installed on the system for burning
  - Windows: install from GitHub releases
  - Linux: `sudo apt install cdrdao`
- FFprobe and FFmpeg must be on PATH for audio probing/conversion

## Deliberately postponed

- IMAPI2 COM integration (Windows-native burning without cdrdao)
- License choice
- Auto-update mechanism
- Portable mode detection
