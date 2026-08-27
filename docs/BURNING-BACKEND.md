# Burning Backend

This document records the decisions and research behind the physical
Audio-CD burning backend.

Status: **Phase 0 decision (revised)**, pending hardware validation.

Backend chosen as of the latest update: **Windows-native** (no cdrdao). Linux
backend remains undecided.

---

## 1. Decision (revised)

For Version 1 the physical burning implementation uses a **native Windows
backend** (IMAPI2 / SPTI-MMC), not cdrdao.

- On **Windows**, no external burning executable is bundled or required. We
  use the operating system's own optical interfaces (see section 5).
- On **Linux**, the backend choice is **not yet decided**. It is recorded as a
  deferred question in `NEXT.md` and the owner (Kevin) has not selected an
  approach. A cdrdao-based Linux backend remains a candidate.

Regardless of platform, the rest of the application talks only to the
`BurnBackend` abstraction defined in `src-tauri/src/disc/`. The backend
boundary is unchanged: a future backend can be swapped in without redesigning
the frontend.

### Why not cdrdao

Owners reported issues with cdrdao and prefer a native backend. In addition:

- Avoiding cdrdao removes the need to bundle a GPL-2.0 helper and its DLLs,
  and removes the associated source-offer/redistribution obligations (see
  `THIRD_PARTY_LICENSES.md`).
- A Windows-native backend uses interfaces Microsoft ships on Windows 10/11,
  so there is nothing to distribute for that platform.

### Risks

- The Windows-native DAO/raw path (SPTI/MMC) is more work to implement
  correctly than invoking cdrdao, and older IMAPI2 raw support is unreliable
  on some drives. It must be validated against real hardware in Phase 3.
- The Linux backend has not been selected, so Linux burning is not yet
  committed to an implementation.

---

## 2. Backend Abstraction

The application defines a backend boundary so the physical implementation can
be swapped (for example Windows-native vs a future Linux backend).

```text
src-tauri/src/disc/
├── backend.rs        # BurnBackend trait / interface
├── backends/
│   ├── mod.rs
│   └── windows_native.rs   # Windows IMAPI2/SPTI implementation
├── drive.rs          # normalized drive model + detection
├── media.rs          # normalized media model + detection
├── burn.rs           # burn orchestration invoked via backend
├── progress.rs       # progress parsing / normalization
└── cdtext.rs         # CD-TEXT generation
```

A future Linux implementation would add a second module under `backends/`
(e.g. `linux_native.rs` or `cdrdao.rs`) without changing the frontend.

### Conceptual interface

```text
BurnBackend
    detect_drives() -> Vec<DiscDrive>
    inspect_media(drive) -> DiscMedia
    burn(project, progress_sink) -> BurnResult
    cancel()
    eject(drive)
```

The `disc/` subsystem maps whatever the selected backend returns into
normalized application models (`DiscDrive`, `DiscMedia`, `BurnProgress`) so
the frontend never sees backend, SCSI, COM, or device-node details.

---

## 3. Backend Input (conceptual)

The burn backend consumes a prepared, normalized burn project: a CD title,
ordered tracks, selected drive, and the audio prepared as CD-compatible PCM
(44.1 kHz / 16-bit / stereo) in the temporary burn workspace.

The backend is responsible for translating that into whatever the physical
layer needs (for Windows, a SCSI-MMC cue sheet / write sequence; for Linux,
whichever mechanism is later chosen). The exact protocol is embedded in the
backend implementation and not exposed to the rest of the application.

---

## 4. Drive and Media Detection

Detection is centralized in the `disc/` subsystem, which uses the selected
backend's native detection:

- Enumerate optical writers and their write capability.
- Query the inserted media for blank/nonblank, writable status, and capacity.

The `disc/` subsystem normalizes this into `DiscDrive` and `DiscMedia`.

Media changes are noticed by the native layer (modest polling fallback if
event-driven detection is impractical) and forwarded to React as normalized
events. Optical hardware is never polled aggressively.

---

## 5. Windows Considerations

The Windows backend uses native operating-system interfaces. No external
burning executable is bundled.

Two native layers exist:

### 5.1 IMAPI2 (Track-At-Once)

Windows ships `IDiscFormat2TrackAtOnce` for writing audio tracks
track-at-once. Track-at-once typically inserts unwanted 2-second gaps between
tracks, which is not ideal for a Red Book audio CD.

### 5.2 SPTI/MMC (Direct SCSI)

Raw/DAO output is achieved by speaking SCSI MMC directly to the drive via
`IOCTL_SCSI_PASS_THROUGH_DIRECT` (the same approach used by tools such as
`futureburn` and `AudioCopy`). This gives gapless DAO output and the ability
to write CD-TEXT sub-channel data where the drive supports it.

The recommended V1 Windows path is the direct SCSI/MMC backend. IMAPI2 may be
used where it is sufficient, or as a fallback.

The exact SCSI MMC command sequence (MODE SELECT, SEND CUE SHEET, WRITE, then
finalization) must be proven against real drives in Phase 3 before production
code is frozen. Do not fabricate SCSI details.

### 5.3 Drive and media detection

Drive enumeration and media inspection are also native:

- Enumerate optical drives (for example via IMAPI `MsftDiscMaster2`, or
  direct enumeration of SCSI/storage devices).
- Query the inserted media for blank/nonblank, writable status, and capacity.

This lives in `src-tauri/src/platform/windows.rs` and the normalized
`disc/` models.

---

## 6. Linux Considerations

The Linux backend is **not yet decided** (recorded in `NEXT.md`). Candidates
include:

- cdrdao via Linux SG_IO (works well on Linux, but owner has reservations).
- `wodim`/`cdrtools` (track-at-once; gaps and less CD-TEXT control).
- libburnia (`xorriso`/`cdrskin`).
- A small Rust crate that speaks SCSI MMC to `/dev/sr*` directly (native, no
  external helper — mirrors the Windows SPTI approach and keeps the two
  platforms conceptually aligned).

Until chosen, Linux burning and Linux optical permissions remain open. Linux
permission handling (udev `uaccess`/ACL, `cdrom`/`optical` group membership,
never root, no SUID helper) is documented in `PORTABLE-MODE.md`, but which
distributions to target and which backend to use is deferred to the owner.

---

## 7. Cancellation

- Preparation/conversion is cancellable.
- Physical writing should not expose a Cancel path that could leave the drive
  in an unpredictable state unless the consequence is clearly handled.

---

## 8. Open Questions for Hardware Validation

- Confirm the Windows-native drive enumeration and media/capacity detection
  with real drives.
- Confirm gapless DAO output and CD-TEXT write success with a real consumer
  drive/player.
- Determine the exact SCSI-MMC sequence and any fallbacks needed for the
  Windows backend.
- Select the Linux backend (deferred, owner decision) and confirm the Linux
  permission model for the target distributions.

See `NEXT.md` for the outstanding Phase 3 hardware work.
