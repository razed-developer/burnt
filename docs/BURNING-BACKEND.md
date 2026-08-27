# Burning Backend

## Decision

Burnt uses different burning backends per platform:

| Platform | Backend | Mode | CD-TEXT | Licensing |
|----------|---------|------|---------|-----------|
| Windows | IMAPI2 (built-in) | DAO-96 | Yes | No issue (OS-provided) |
| Linux | cdrdao (external) | DAO | Yes | GPL-2.0 (not bundled) |

## Windows: IMAPI2

### What It Is

The Image Mastering API v2 is Microsoft's COM-based disc burning API, built into Windows Vista and later. It is the same engine used by Windows Media Player.

### Why Use It

- Zero licensing complications — it ships with the OS
- Full DAO audio CD support via `IDiscFormat2RawCD`
- CD-TEXT support in DAO mode via `IRawCDImageCreator`
- Progress reporting via COM events
- No external binary to bundle or distribute
- Battle-tested and reliable

### Key Interfaces

| Interface | Purpose |
|-----------|---------|
| `IDiscMaster2` | Enumerate available recorders |
| `IDiscRecorder2` | Control a specific recorder |
| `IRawCDImageCreator` | Build a DAO-96 image (tracks, pregaps, CD-TEXT subcodes) |
| `IDiscFormat2RawCD` | Write a raw DAO-96 image to disc |

### Workflow

```text
1. CoCreateInstance(MsftDiscMaster2)
   → enumerate recorders via IDiscMaster2
   → select recorder (auto-select if one, user picks if many)

2. CoCreateInstance(MsftDiscRecorder2)
   → InitializeEx with device path from IDiscMaster2

3. CoCreateInstance(MsftRawCDImageCreator)
   → SetResultingImageType(rawSubcode)
   → AddTrack(stream) for each track (44.1k/16/stereo PCM)
   → AddSubcodeRWGenerator for CD-TEXT subcodes
   → CreateResultImage() → IStream of raw disc image

4. CoCreateInstance(MsftDiscFormat2RawCD)
   → SetRecorder(IDiscRecorder2)
   → PrepareMedia() → locks the disc
   → WriteMedia(IStream) → burns
   → ReleaseMedia() → unlocks
```

### CD-TEXT via IMAPI2

CD-TEXT is written through R-W subchannel data in DAO-96 mode. The `IRawCDImageCreator` exposes `AddSubcodeRWGenerator` which allows injecting CD-TEXT data per track and for the disc as a whole.

CD-TEXT fields supported:

- Disc/album title
- Track title
- Track artist/performer
- MCN (Media Catalog Number)
- ISRC per track

### Media Detection via IMAPI2

`IDiscRecorder2::GetMediaState()` returns the current media state, including `MEDIA_BLANK`, `MEDIA_NOT_BLANK`, etc. This is the simplest way to check if a disc is writable.

### Rust Bindings

The `windows` crate (Microsoft's official) provides bindings for all IMAPI2 interfaces under `windows::Win32::Storage::Imapi`. These are raw COM interfaces requiring `unsafe` vtable calls, but all types and GUIDs are defined.

### Risks

- Some older or unusual drives may not support DAO via IMAPI2. Fallback: detect and report clearly.
- COM initialization must be handled correctly (`CoInitializeEx` with `COINIT_MULTITHREADED`).
- The `windows` crate IMAPI2 bindings are extensive but require careful unsafe usage.

---

## Linux: cdrdao

### What It Is

cdrdao (CD Recorder Disc-At-Once) is a GPL-2.0 command-line tool for burning CDs in DAO mode with CD-TEXT support. It reads a `.toc` file describing the disc layout.

### Why Use It

- The gold standard for DAO audio CD on Linux
- Full CD-TEXT support via R-W subchannels
- Active maintenance (v1.2.6, December 2025)
- Available in every major Linux distribution's package manager
- Proven progress parsing (used by whipper, K3b, and others)

### Why Not Bundle It

cdrdao is GPL-2.0-or-later. Bundling a GPL binary inside a non-GPL application would create a licensing conflict. Instead, Burnt requires cdrdao to be installed on the system and invokes it as an external tool.

This is the same approach used by K3b and other Linux burning applications.

### Installation Requirement

Burnt checks for cdrdao on startup and at burn time. If not found, it displays:

> cdrdao is required for burning Audio CDs on Linux.
>
> Install it with your package manager:
>
> `sudo apt install cdrdao` (Debian/Ubuntu)
> `sudo dnf install cdrdao` (Fedora)
> `sudo pacman -S cdrdao` (Arch)

### TOC File Format

The `.toc` file is a plain-text description of the disc layout. Example:

```toc
CD_DA

CD_TEXT {
  LANGUAGE 0 {
    TITLE "Road Trip 2026"
    PERFORMER "Various Artists"
  }
}

TRACK AUDIO
  TITLE "Dreams"
  PERFORMER "Fleetwood Mac"
  FILE "track01.wav" 0

TRACK AUDIO
  TITLE "Africa"
  PERFORMER "Toto"
  FILE "track02.wav" 0
```

Burnt generates this file from the track list, metadata, and CD-TEXT settings.

### Command

```bash
cdrdao write --device /dev/sr0 --speed 4 --buffers 32 my_cd.toc
```

Key flags:

- `--device` — target drive path
- `--speed` — write speed
- `--buffers` — buffer size in megabytes
- `--eject` — eject disc after burn
- `--simulate` — test write without激光

### Progress Parsing

cdrdao writes progress to stderr. Example output:

```text
Progress 37:00.00 (30%) 00:12 remaining, 32 buffers (85%)
```

Burnt parses this output to provide real-time progress to the frontend.

### Media Inspection via cdrdao

```bash
cdrdao disk-info --device /dev/sr0
```

Returns disc state (blank, complete, incomplete), type, and capacity.

```bash
cdrdao msinfo --device /dev/sr0
```

Returns multi-session info useful for determining usable capacity.

### Risks

- cdrdao must be installed by the user. The application cannot control this.
- Version differences may produce slightly different stderr output. Test with the versions shipped in major distros.
- Some USB optical drives have quirks with cdrdao. Test with representative hardware.

---

## BurnBackend Trait

Both platform backends implement a common trait to keep the rest of the application decoupled:

```rust
pub trait BurnBackend: Send + Sync {
    /// Detect available optical writers.
    fn detect_drives(&self) -> Result<Vec<DriveInfo>, BurnError>;

    /// Insert and inspect media in a drive.
    fn inspect_media(&self, drive: &DrivePath) -> Result<MediaInfo, BurnError>;

    /// Burn an Audio CD from prepared tracks.
    fn burn_audio_cd(
        &self,
        request: BurnRequest,
        progress: Channel<BurnProgress>,
    ) -> Result<BurnResult, BurnError>;

    /// Cancel an in-progress burn (if safe).
    fn cancel_burn(&self) -> Result<(), BurnError>;

    /// Eject the disc in a drive.
    fn eject_disc(&self, drive: &DrivePath) -> Result<(), BurnError>;
}
```

### BurnRequest

```rust
pub struct BurnRequest {
    pub tracks: Vec<PreparedTrack>,  // path to CD-DA WAV + metadata
    pub disc_title: String,
    pub drive: DrivePath,
    pub speed: Option<u32>,          // None = automatic
    pub eject_after: bool,
}
```

### BurnProgress

```rust
pub enum BurnProgress {
    Preparing { stage: String },
    Writing { percent: f32, current_track: usize, total_tracks: usize },
    Finalizing,
    Complete { ejected: bool },
    Failed { error: BurnError },
}
```

---

## Comparison with Rejected Alternatives

| Tool | Why Rejected |
|------|-------------|
| wodim | Dead project (2010). Poor DVD support. |
| cdrecord (Schilling) | CDDL + GPL licensing conflict. Cannot redistribute. |
| libisoburn / xorriso | ISO 9660 data focus. Not designed for audio CD-DA. |
| libburn / cdrskin | GPL-2.0. Could work but cdrdao is simpler and more established. |
| Custom Rust SCSI | Enormous effort. Reimplements what cdrdao and IMAPI2 already do. |
