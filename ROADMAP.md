# Burnt Roadmap

Burnt 1.0 deliberately does one job: turn ordinary audio files into a standard playable Audio CD with as little friction as possible.

Future versions should preserve that simplicity. New capabilities should be optional or appear only when useful rather than turning the main screen into a traditional full-featured disc-authoring application.

## 1.1 — Metadata and CD-Text

### Read source metadata
- Read embedded title, artist, album, track number and other useful tags from supported source files.
- Display friendly song titles instead of relying only on filenames.
- Keep filename fallback for files without metadata.
- Allow metadata to be reviewed and edited before burning.

### CD-Text
- Write disc title and artist where supported.
- Write track title and artist where supported.
- Clearly distinguish Burnt project metadata from metadata that will actually be written to the disc.
- Detect whether the selected recorder/media path supports the required CD-Text workflow.
- Preserve a simple no-CD-Text burn path for maximum compatibility.

**Important:** CD-Text will require careful burner-backend research and physical verification. Do not modify the hardware-tested Windows 1.0 IMAPI2 path until a separate CD-Text approach is proven.

## 1.2 — Projects and repeat burns

### Save projects
- Save the current track list, order, disc title and editable metadata as a small Burnt project file.
- Reopen recent projects.
- Warn gracefully when source audio has moved or is missing.

### Burn Another Copy
- Keep a completed project available after a successful burn.
- Allow another blank disc to be inserted and burn the same prepared project again without rebuilding the track list.
- Reuse converted audio safely when appropriate, with reliable temporary-file cleanup.

## 1.x — Small quality-of-life improvements

Potential improvements that fit Burnt's deliberately simple design:

- Drag audio files directly onto the Burnt window.
- Multi-select removal and clearer keyboard controls.
- Optional per-track preview/play button.
- More explicit estimated gap/overhead information.
- Better diagnostics when a drive or disc cannot be used.
- Show recorder model in an unobtrusive details area.
- Remember the last folder used when adding music.
- Optional confirmation before beginning a physical burn.
- Accessible labels, keyboard navigation and high-DPI checks.

## 2.0 — Linux

- Add a Linux-specific burning backend without changing the Windows backend.
- Keep the same React UI and common audio-preparation pipeline where practical.
- Bundle or clearly manage required Linux burning tools so normal users do not have to assemble the backend themselves.
- Produce Linux portable/installable packages after hardware verification.

## Longer-term ideas

These are possibilities rather than commitments:

- Disc-at-Once mode for gapless albums/live recordings if a reliable cross-drive implementation can be proven.
- Configurable pauses between tracks.
- ReplayGain-aware or optional volume normalization during preparation.
- Album-art display inside Burnt projects (not written to standard Audio CD media).
- Import a playlist file as a Burnt track list.
- Export/print a simple track listing or jewel-case insert.
- Multiple optical-drive selection when more than one compatible recorder is connected.
- CD-RW erase support, with strong confirmation and clear media-state handling.

## Things Burnt should resist

Burnt should not become a general-purpose media suite. Features should be questioned if they make the core workflow harder to understand:

**Add music → arrange it → insert a blank CD → Burn CD.**

The default screen should remain useful to someone who does not know or care about CD sectors, codecs, write modes, filesystem formats, or optical-disc terminology.

## Development rule

The Windows 1.0 burn mechanism is hardware verified and frozen. New features should be layered around it where possible. Any change that alters the physical Windows burn path must be followed by a real-disc burn and standalone-player verification before release.
