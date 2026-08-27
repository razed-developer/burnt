# Next

## Current objective

Phase 5 complete. Proceeding to Phase 6: Real-device testing and final polish.

## Current test version

- Branch: main
- Build result: Clean build (TypeScript + Vite + Cargo, zero warnings)
- Tests: 3/3 passing (TOC generation)

## What was completed (Phase 5)

### Window Title Updates

- Title now reflects current state: "Burnt", "Burnt -- 3 tracks", "Burnt -- Burning..."
- CD title appended when set: "Burnt -- 3 tracks -- My Mix"
- Title updates in real-time as tracks are added/removed and burn status changes

### Settings Improvements

- Burn speed selector expanded with common values: Automatic, 1x through 48x
- Escape key closes settings page

### Error Handling

- `interpret_burn_failure()` function analyzes cdrdao stderr for common failure modes:
  - No disc detected -- suggests inserting blank CD-R
  - Power calibration failure -- suggests different disc or lower speed
  - Speed not supported -- suggests Automatic or lower speed
  - Permission denied -- suggests sudo or cdrom group (Linux)
  - Drive busy -- suggests closing other disc software
  - Read/write error -- suggests new blank CD-R
- Technical details preserved in expandable section for troubleshooting

### Bug Fixes

- Fixed progress events being sent twice in burn command handler
- Each BurnProgress variant now sends exactly once

### Keyboard Shortcuts

- Escape closes settings page
- Escape prevented during burn (safety)

## Testing checklist for the next build

- [ ] Window title updates when tracks are added
- [ ] Window title shows "Burning..." during burn
- [ ] Window title includes CD title when set
- [ ] Burn speed selector shows all options in settings
- [ ] Escape key closes settings
- [ ] Error messages are user-friendly for common failures
- [ ] Error details expandable for technical troubleshooting
- [ ] No duplicate progress events during burn

## Proposed Phase 6 Implementation Plan

Phase 6 is real-device testing and final polish.

### Step 1: Hardware Testing

- Test with actual CD-R and CD-RW media
- Verify cdrdao progress parsing with real hardware
- Test error cases (bad disc, drive busy, etc.)
- Verify disc detection with various drive types

### Step 2: Final Polish

- Smooth animations for state transitions
- Loading states for long operations
- About page with version info
- Keyboard shortcuts for common actions

### Step 3: Distribution

- Windows installer (NSIS)
- Linux AppImage/deb
- Application icon
- Metadata and descriptions

## Deliberately Postponed

- IMAPI2 COM integration (Windows-native burning) -- defer to after cdrdao works on both platforms
- License choice
