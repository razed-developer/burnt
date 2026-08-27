# Project: Simple Modern Audio CD Burner

You are acting as the **lead software engineer, application architect, and UI/UX developer** for this project.

Your task is to design and implement a small, polished desktop application for creating and burning standard **Audio CDs**.

The application must run on:

* Windows 10/11
* Modern Linux distributions

It must be available in both:

* **Installable form**
* **Portable form**

The application should be deliberately simple.

This is **not** intended to become a general-purpose CD/DVD/ISO authoring suite.

The fundamental experience should be:

> Open the application → add music → arrange tracks → enter a CD title → see remaining capacity → insert a blank CD → click Burn.

A person who knows nothing about CD-burning terminology should be able to use the program without documentation.

---

# 1. Core Product Philosophy

The application exists for one purpose:

> **Create ordinary Audio CDs as easily as creating a playlist.**

Avoid exposing technical concepts unless absolutely necessary.

The user should NOT normally need to understand:

* Red Book audio
* PCM
* WAV conversion
* sectors
* DAO/TAO
* sessions
* filesystems
* ISO images
* SCSI
* write strategies
* lead-in/lead-out
* finalization
* pregaps
* cue sheets
* command-line burning utilities

The application may use these concepts internally, but they should be hidden behind a friendly interface.

When a technical error occurs, translate it into plain language.

For example, instead of:

> SCSI command failed: Sense Key 0x03 ASC 0x0C

display:

> **The CD couldn't be written.**
>
> The disc may be damaged or incompatible with your drive.
>
> Try another blank CD and burn again.
>
> [Show technical details]

---

# 2. Technology Stack

Preferred application stack:

## Frontend

* React
* TypeScript
* Vite

## Desktop framework

* Tauri v2

## Native/backend layer

* Rust

The React frontend should handle presentation and user interaction.

The Rust backend should handle:

* filesystem interaction
* audio inspection
* audio conversion orchestration
* optical drive detection
* media detection
* burn preparation
* burning
* progress parsing
* process management
* settings persistence
* platform-specific behavior

Do not place complicated system-level logic in React.

The frontend should communicate with the Rust core through clearly defined Tauri commands/events.

---

# 3. External Tools

Do NOT attempt to implement an entire CD-burning engine from scratch unless there is a compelling technical reason.

Investigate and use mature existing tools where appropriate.

Potential components include:

## FFmpeg / FFprobe

Use for:

* reading audio metadata
* determining duration
* decoding supported formats
* converting audio into CD-compatible PCM
* validating source files

## CD burning backend

The burning implementation is isolated behind an abstraction (see below). It
does not depend on the choice of any one open-source tool.

Decision (see `docs/BURNING-BACKEND.md`): On Windows the backend is
**Windows-native** (IMAPI2 / SPTI-MMC) — no external burning executable is
bundled. The Linux backend is not yet decided.

`cdrdao` was evaluated as a potential cross-platform option (Disk-At-Once and
CD-TEXT) but was rejected for Version 1 by the owner.

The application architecture MUST isolate the burning implementation behind an abstraction.

For example:

```text
BurnBackend
    detect_drives()
    inspect_media()
    burn_audio_cd()
    cancel_burn()
    eject_disc()
```

Do not tightly couple the rest of the application to cdrdao.

This should allow another backend to replace it later without redesigning the frontend.

---

# 4. Licensing

Before bundling any third-party executable or library:

1. Determine its license.
2. Determine whether redistribution is permitted.
3. Determine what notices/source availability requirements apply.
4. Document these requirements.
5. Do not silently bundle something whose license is incompatible with the project's intended distribution.

Create:

```text
THIRD_PARTY_LICENSES.md
```

Document every bundled dependency that requires attribution or redistribution consideration.

---

# 5. Application Scope

Version 1 should support:

* entering a CD title
* adding audio files
* adding multiple files simultaneously
* drag-and-drop audio import
* reordering tracks
* removing tracks
* displaying track durations
* reading basic metadata
* calculating total playing time
* displaying remaining CD capacity
* detecting optical writers
* detecting inserted media
* determining disc capacity when possible
* identifying whether writable media is suitable
* burning a standard Audio CD
* displaying burn progress
* friendly error handling
* CD-TEXT where supported
* ejecting the disc
* burning another disc from the same track list

Do NOT expand Version 1 into unrelated disc functionality.

---

# 6. Explicit Non-Goals

Unless later requested, do NOT implement:

* DVD burning
* Blu-ray burning
* data CDs
* ISO creation
* ISO burning
* bootable discs
* CD ripping
* DVD ripping
* Blu-ray ripping
* video conversion
* music library management
* streaming
* cloud accounts
* online accounts
* user registration
* synchronization
* playlist services
* Spotify integration
* YouTube integration
* album artwork management
* audio editing
* waveform editing
* normalization controls
* equalizers
* effects
* complicated burn profiles
* advanced cue-sheet editing

Protect the project's simplicity.

When considering a new feature, ask:

> Does this make creating an Audio CD easier?

If not, it probably does not belong in the application.

---

# 7. Main User Experience

The application should open directly to the Audio CD creation screen.

Do not require:

* creating a project
* choosing a project type
* selecting Audio CD from a wizard
* navigating through multiple setup pages

The empty state should immediately communicate what to do.

Example:

```text
New Audio CD

CD TITLE

[ My Mix                                      ]


TRACKS

┌─────────────────────────────────────────────┐
│                                             │
│           Drop your music here              │
│                                             │
│      MP3 • FLAC • WAV • M4A • OGG           │
│                                             │
│           + Add Audio Files                 │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 8. Main Window Layout

Once tracks are present, the approximate information hierarchy should be:

```text
┌────────────────────────────────────────────────────────────┐
│  Application Name                               ⚙   ─ □ ×  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  New Audio CD                                              │
│                                                            │
│  CD TITLE                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Road Trip 2026                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  TRACKS                                           54:31    │
│                                                            │
│  ≡   1   Dreams.mp3                              4:17      │
│  ≡   2   Everywhere.flac                        3:43   ×   │
│  ≡   3   Africa.m4a                             4:55   ×   │
│  ≡   4   Don't Stop Believin'.mp3               4:11   ×   │
│                                                            │
│             + Add Audio Files                              │
│                                                            │
│  DISC                                                      │
│                                                            │
│  ███████████████████████████████░░░░░░░░░░░░░             │
│  54:31 used                              25:29 remaining   │
│                                                            │
│  ✓ Blank 80-minute CD                                     │
│                                                            │
│                                      [ Burn Audio CD ]     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

This is a conceptual mockup, not a requirement to reproduce it pixel-for-pixel.

Improve it where appropriate while preserving the simplicity.

---

# 9. Visual Design

The application should look like a modern desktop utility rather than traditional burning software.

Design goals:

* clean
* modern
* friendly
* uncluttered
* highly legible
* professional
* efficient
* desktop-oriented

Prefer:

* solid colours
* subtle borders
* good spacing
* clear hierarchy
* strong typography
* restrained shadows
* modest corner rounding
* excellent hover/focus states
* accessible contrast

Avoid:

* excessive rounded cards
* "bubble" UI
* giant pill-shaped controls everywhere
* gradients
* glassmorphism
* excessive animations
* unnecessary dashboards
* sidebars without a purpose
* dense legacy toolbars
* dozens of tiny icons
* web-page-like navigation

The program should feel like a **native utility**, even though React renders the interface.

---

# 10. Light and Dark Themes

Support:

* System
* Light
* Dark

System should be the default.

Themes should use design tokens/CSS variables rather than duplicating styles.

---

# 11. Audio Import

Allow files to be added through:

## File picker

Provide:

> Add Audio Files

Allow multi-select.

## Drag and drop

Allow files to be dragged directly onto the track area/window.

Provide a clear drop state:

```text
Drop your music here
```

## Folder dropping

If technically practical, dropping a folder should discover supported audio files.

Do not unexpectedly crawl enormous directory trees.

A sensible implementation might scan the immediate folder or provide clearly defined behavior.

---

# 12. Supported Audio Formats

Target common consumer formats including:

* MP3
* FLAC
* WAV
* M4A/AAC
* OGG
* Opus
* AIFF

Use FFmpeg/FFprobe support where practical.

Do not assume the source file already matches CD Audio requirements.

---

# 13. Audio CD Requirements

The output must be an actual standard Audio CD intended to work in ordinary:

* home CD players
* portable CD players
* car stereos
* computer optical drives

Do NOT simply copy MP3 files onto a data CD.

Internally convert/decode audio as required to standard CD-compatible PCM.

Handle conversion automatically.

The user should not need to select sample rates, codecs or bit depths.

---

# 14. Track Metadata

When adding a track:

1. inspect it
2. determine duration
3. read available metadata
4. determine a useful display title

If metadata contains:

* artist
* title

prefer:

```text
Fleetwood Mac — Dreams
```

If metadata is unavailable, fall back to:

```text
dreams.mp3
```

Never reject otherwise valid audio merely because metadata is absent.

---

# 15. Track Ordering

Tracks must have explicit Audio CD track numbers.

Example:

```text
01  Artist — Track
02  Artist — Track
03  Artist — Track
```

Support drag-and-drop reordering.

After reordering, track numbers should update automatically.

Provide accessible alternatives to drag-and-drop where reasonable.

---

# 16. Removing Tracks

Each track should have a subtle remove action.

Removing a track should immediately update:

* numbering
* total duration
* capacity meter
* remaining time
* burn eligibility

Avoid unnecessary confirmation dialogs for removing an individual track because no source file is being deleted.

---

# 17. Disc Capacity

Audio CD capacity must be represented primarily in **playing time**, not source-file byte size.

Before a disc is inserted, assume a common 80-minute Audio CD and clearly identify that assumption.

Example:

```text
54:31 / 80:00
```

Once media is inserted, attempt to determine its actual usable capacity.

Support common capacities such as approximately:

* 74 minutes
* 80 minutes

Do not hardcode every disc to exactly 80 minutes if the backend can provide real capacity information.

---

# 18. Capacity Meter

The capacity meter is one of the application's most important visual components.

Example:

```text
DISC CAPACITY

████████████████████████████░░░░░░░░░░░░
54:31 used                         25:29 remaining
```

As the disc approaches capacity, communicate this clearly.

If over capacity:

```text
82:17
2:17 too long
```

The Burn button must be disabled if the project cannot fit.

Explain why it is disabled.

Do not rely on colour alone to communicate an error.

---

# 19. Disc Drive Detection

Detect available optical writers.

The program must handle:

* no optical drive
* one optical drive
* multiple optical drives
* drive present but incapable of writing CDs
* drive temporarily unavailable
* media changing while application is open

If exactly one appropriate writer exists, select it automatically.

If multiple exist, provide a simple drive selector.

---

# 20. Disc Status

Present disc state in plain language.

Possible states:

```text
No CD burner found
```

```text
CD burner ready
```

```text
Please insert a blank CD
```

```text
Checking disc…
```

```text
Blank 80-minute CD
```

```text
This disc is not blank
```

```text
This disc cannot be used for an Audio CD
```

Do not expose raw operating-system device names unless needed.

---

# 21. CD-R and CD-RW

Investigate reliable handling of:

* CD-R
* CD-RW

Do not automatically erase CD-RW media without explicit permission.

If erasing/reusing CD-RW is eventually supported, it must be an intentional user action.

---

# 22. CD Title

Provide a prominent:

```text
CD Title
```

field.

The title should be used for CD-TEXT where supported.

Do not imply that every CD player will display CD-TEXT.

---

# 23. CD-TEXT

Where supported by:

* burner
* backend
* media
* playback device

write useful CD-TEXT.

Potential fields:

* album/disc title
* track title
* track artist

Automatically derive track information from metadata where possible.

Do not make users manually configure technical CD-TEXT structures.

If CD-TEXT is unsupported, burning should still succeed.

CD-TEXT failure should not necessarily make the entire disc burn fail unless required by the backend.

---

# 24. Burn Button

There should be one obvious primary action:

> **Burn Audio CD**

Enable it only when prerequisites are satisfied.

Potential prerequisites:

* at least one valid track
* total duration fits
* suitable writer exists
* writable media is inserted
* no current burn operation is running

When disabled, provide an understandable reason.

---

# 25. Burn Workflow

When Burn is pressed:

1. validate the track list
2. validate media
3. create temporary working space
4. prepare/decode tracks
5. create whatever burn description/cue/TOC structure the backend requires
6. initiate burn
7. monitor progress
8. report meaningful status
9. finalize the disc
10. verify successful backend completion
11. clean temporary files
12. optionally eject the disc

Do not freeze the UI.

---

# 26. Burn Progress

The main interface should transition into a clean progress view rather than spawning many dialogs.

Example:

```text
Burning "Road Trip 2026"

Preparing audio
████████████████████████████████████  ✓

Writing disc
██████████████████████░░░░░░░░░░░░  63%

Track 9 of 14
Fleetwood Mac — Dreams

Please don't eject the disc.
```

Show meaningful stages such as:

```text
Preparing tracks…
Writing disc…
Finalizing…
```

Do not fabricate exact percentages if the backend cannot reliably provide them.

An accurate indeterminate state is preferable to fake progress.

---

# 27. Successful Completion

On success, display something like:

```text
✓

Your CD is ready.

Road Trip 2026
14 tracks • 62:14

[ Eject CD ]

Burn Another
```

"Burn Another" should make it easy to burn another copy of the same compilation.

Do not clear the current track list automatically after a successful burn.

---

# 28. Burn Failure

Failure must leave the application in a recoverable state.

Do not lose:

* title
* track list
* track order

Display:

1. friendly explanation
2. suggested action
3. optional technical details

Example:

```text
The CD couldn't be written.

The disc may be damaged or incompatible with your drive.

Try another blank CD and burn again.

[ Show technical details ]

[ Try Again ]
```

Technical information should be available for troubleshooting and bug reports.

---

# 29. Cancellation

Investigate whether burning can safely be cancelled.

Do NOT offer a Cancel button if cancellation could leave the drive/backend in an unpredictable state without properly handling that consequence.

Preparation/conversion should normally be cancellable.

During physical writing, clearly communicate what cancellation means.

---

# 30. Temporary Files

Audio preparation may require significant temporary disk space.

Use an appropriate temporary directory.

Requirements:

* unique directory per burn session
* no filename collisions
* clean up after success
* clean up after handled failure
* attempt cleanup after cancellation
* detect abandoned temporary directories from previous crashes when appropriate

Never modify source audio files.

---

# 31. Settings

Keep Settings intentionally small.

Suggested layout:

```text
Settings

BURNING

Drive
[ Automatic                         ▼ ]

Eject disc when finished
[✓]


APPEARANCE

Theme
System  Light  Dark


ADVANCED

Burn speed
[ Automatic                         ▼ ]


ABOUT

Application Name
Version x.x.x
```

Do not fill Settings with options merely because the backend exposes them.

---

# 32. Burn Speed

Default:

> Automatic

Most users should never need to change it.

If manual speeds are exposed, place them under Advanced settings.

Only offer speeds actually supported by the drive/media/backend where possible.

---

# 33. Application State

This is a simple utility.

Avoid introducing a database unless a genuine requirement emerges.

Prefer a lightweight settings file such as JSON.

Possible settings:

```json
{
  "theme": "system",
  "preferredDrive": "automatic",
  "ejectAfterBurn": true,
  "burnSpeed": "automatic"
}
```

Do not store unnecessary user data.

---

# 34. Portable Mode

Portable operation is a first-class requirement.

Do NOT retrofit portable support after the application is complete.

Design for it from the beginning.

The application should be able to determine whether it is running as:

* installed
* portable

Portable mode should keep application-owned mutable state within the portable directory whenever practical.

---

# 35. Windows Portable Distribution

Target distribution:

```text
Application-Portable.zip
```

Extracting it should produce something similar to:

```text
Application/
├── Application.exe
├── bin/
│   ├── ffmpeg.exe
│   ├── ffprobe.exe
│   └── burning-backend.exe
├── data/
│   └── settings.json
└── licenses/
```

The exact structure may evolve.

Important requirements:

* no installation required
* launch by double-clicking the application executable
* no PowerShell window
* no Command Prompt window
* no terminal window flashing during startup
* bundled CLI processes must execute hidden
* portable settings remain portable
* use relative/resource-safe paths
* do not depend on the current working directory being the executable directory

A portable application should work after the folder is moved.

---

# 36. Windows Installed Distribution

Provide an ordinary Windows installer.

Preferred user-facing output:

```text
Application-Setup.exe
```

An MSI may also be produced where useful.

The installed version should use appropriate operating-system application-data locations.

Do not make the installed version depend on writable files beside the executable in Program Files.

---

# 37. Linux Portable Distribution

Primary portable target:

```text
Application.AppImage
```

The AppImage should contain or reliably locate required runtime components.

Test execution on representative Linux distributions.

Do not assume the user's shell working directory.

---

# 38. Linux Installed Distribution

Target at minimum:

```text
application.deb
```

Also consider:

```text
application.rpm
```

where practical.

Packaging should correctly handle:

* desktop entry
* application icon
* executable
* bundled resources
* dependencies
* optical-drive access requirements

---

# 39. Linux Optical Drive Permissions

Research Linux optical-drive permissions carefully.

Do not solve permission problems by telling users to run the entire GUI application as root.

Determine the correct approach for accessing the burner.

If group membership, udev rules, polkit, backend privileges or other configuration is necessary:

* minimize privileges
* document it
* automate safe configuration through packaging where appropriate

Never silently weaken system permissions.

---

# 40. Platform Abstraction

Keep platform-specific code isolated.

For example:

```text
src-tauri/src/platform/
├── mod.rs
├── windows.rs
└── linux.rs
```

Do not scatter:

```rust
#[cfg(target_os = "...")]
```

throughout unrelated business logic unless necessary.

---

# 41. Proposed Project Structure

Use a compartmentalized structure approximately like:

```text
project-root/
│
├── README.md
├── PROJECT.md
├── PREFERENCE.md
├── NEXT.md
├── THIRD_PARTY_LICENSES.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BURNING-BACKEND.md
│   ├── AUDIO-PIPELINE.md
│   ├── PORTABLE-MODE.md
│   ├── BUILDING.md
│   └── TROUBLESHOOTING.md
│
├── src/
│   ├── app/
│   ├── components/
│   │   ├── CapacityMeter/
│   │   ├── TrackList/
│   │   ├── TrackRow/
│   │   ├── AudioDropZone/
│   │   ├── DiscStatus/
│   │   ├── DriveSelector/
│   │   └── BurnProgress/
│   │
│   ├── pages/
│   │   ├── Burner/
│   │   └── Settings/
│   │
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── styles/
│
├── src-tauri/
│   ├── capabilities/
│   ├── icons/
│   └── src/
│       ├── audio/
│       │   ├── mod.rs
│       │   ├── metadata.rs
│       │   ├── probe.rs
│       │   └── conversion.rs
│       │
│       ├── disc/
│       │   ├── mod.rs
│       │   ├── backend.rs
│       │   ├── drive.rs
│       │   ├── media.rs
│       │   ├── burn.rs
│       │   ├── progress.rs
│       │   └── cdtext.rs
│       │
│       ├── platform/
│       │   ├── mod.rs
│       │   ├── windows.rs
│       │   └── linux.rs
│       │
│       ├── project/
│       ├── settings/
│       ├── commands/
│       ├── error/
│       └── main.rs
│
├── resources/
│   ├── windows/
│   └── linux/
│
├── scripts/
│   ├── build-windows.ps1
│   ├── package-windows-portable.ps1
│   ├── build-linux.sh
│   └── package-linux.sh
│
└── tests/
```

Adjust where technically justified, but maintain strong separation of responsibilities.

---

# 42. File Size and Code Organization

Avoid giant source files.

A file should have a clear responsibility.

Do not put the entire application in:

```text
App.tsx
```

or:

```text
commands.rs
```

As functionality grows, extract it into focused modules.

This is important because future AI-assisted development should be able to inspect the relevant subsystem without reading the entire repository.

For example, a future task involving disc detection should primarily require inspecting:

```text
src-tauri/src/disc/
```

A visual change to the capacity meter should primarily require:

```text
src/components/CapacityMeter/
```

Design the repository to make targeted modification easy.

---

# 43. Documentation for AI-Assisted Iteration

This project will likely be developed iteratively with AI coding assistants.

Maintain these files.

## PROJECT.md

Contains stable information:

* product purpose
* architecture
* requirements
* supported platforms
* design philosophy
* major technical decisions

Update it when the product itself changes.

## PREFERENCE.md

Contains development and design preferences that should persist across tasks.

Examples:

* avoid gradients
* avoid excessive rounding
* maintain portable builds
* keep files compartmentalized
* prefer straightforward implementations
* don't add features without justification

## NEXT.md

This is the working queue.

Use it for:

* requested changes
* bugs
* next implementation tasks
* ideas awaiting consideration

Keep completed work out of the active queue or clearly mark/archive it.

## README.md

Write this primarily for the human developer/user.

Explain:

* what the project is
* how to run development mode
* how to build it
* how to create portable releases
* how to create installers
* where important code lives
* how the repository documentation workflow works

Assume the developer may return months later and need to understand how to resume work.

---

# 44. Errors

Create a centralized error model.

Do not make every subsystem invent its own user-facing wording.

Separate:

```text
technical error
```

from:

```text
user-facing error
```

For example:

```text
BurnError::MediaNotWritable
```

may internally contain backend output while exposing:

> This disc cannot be written. Insert a blank CD-R and try again.

Keep technical details available for logs/troubleshooting.

---

# 45. Logging

Implement useful local logging.

Record:

* application version
* OS
* detected drive
* media status
* audio preparation stages
* backend command results
* burn stages
* errors

Do NOT unnecessarily record:

* personal information
* unrelated filenames
* unrelated filesystem contents

Provide an easy method to obtain diagnostic information when troubleshooting.

---

# 46. Security

Treat file paths and metadata as untrusted input.

When invoking external processes:

* never construct unsafe shell strings
* use structured process arguments
* correctly handle spaces
* correctly handle Unicode
* correctly handle quotes
* avoid shell execution where direct process execution is possible
* prevent command injection through filenames or metadata

A song named something unusual must never become executable shell syntax.

---

# 47. Process Management

External tools must:

* run without visible console windows on Windows
* not block the UI thread
* support progress reporting where possible
* capture stdout/stderr
* return structured results
* terminate correctly
* avoid orphan processes
* clean up after failure

Centralize process invocation rather than duplicating it throughout the application.

---

# 48. Unicode and Filesystem Robustness

Test filenames containing:

* spaces
* apostrophes
* quotes
* parentheses
* ampersands
* accented characters
* non-Latin characters
* long filenames

Do not assume ASCII.

---

# 49. Accessibility

The application should remain usable without a mouse where practical.

Provide:

* sensible tab order
* visible keyboard focus
* semantic controls
* accessible labels
* sufficient contrast
* keyboard alternatives for important operations

Do not rely solely on icons.

For example, a remove icon should have an accessible label such as:

```text
Remove track
```

---

# 50. Responsive Window Behavior

This is a desktop application, not a mobile website.

Define a sensible minimum window size.

The track list should adapt reasonably as the window grows.

Avoid layouts that become absurdly wide on large displays.

The primary controls should remain visible at common laptop resolutions.

---

# 51. Performance

The application should start quickly.

Adding audio should not freeze the interface.

Probe files asynchronously.

For large batches:

* show files progressively
* process metadata concurrently with sensible limits
* avoid launching an excessive number of FFprobe processes simultaneously

Do not decode entire audio files merely to determine their durations.

---

# 52. Track Validation

If an imported file cannot be decoded:

mark that specific track clearly.

Example:

```text
⚠ broken-song.mp3
This audio file couldn't be read.
```

Do not make the entire application fail because one source file is bad.

Prevent burning while invalid tracks remain, or allow the user to remove them.

---

# 53. Disc Changes

The application must handle:

* inserting a disc
* ejecting a disc
* replacing a disc
* changing from blank to nonblank media
* drive disappearing
* external ejection

The UI should update without requiring an application restart.

Polling at a reasonable interval is acceptable if event-driven detection is impractical.

Do not poll aggressively.

---

# 54. Preserve Compilation During Errors

The track list is valuable temporary state.

Do not clear it because:

* a disc failed
* the drive disappeared
* conversion failed
* the user ejected a disc
* the burn failed

Allow the problem to be corrected and retried.

---

# 55. Project Saving

Version 1 does NOT require formal saved projects.

However, architecture should not make future session restoration impossible.

Do not add project-management UI unless requested.

A future enhancement could optionally restore the most recent unsaved compilation after a crash, but this is not a V1 requirement.

---

# 56. Icons and Branding

The application must ship with a proper icon.

Provide appropriate icon resources for:

* Windows executable
* Windows installer
* Linux desktop launcher
* AppImage
* application window

Do not leave default Tauri icons in release builds.

Branding should remain simple and appropriate for a small utility.

Do not spend development effort building elaborate splash screens.

---

# 57. Build Scripts

The developer should not need to remember complicated build commands.

Provide scripts for common operations.

Windows examples:

```powershell
.\scripts\build-windows.ps1
.\scripts\package-windows-portable.ps1
```

Linux:

```bash
./scripts/build-linux.sh
./scripts/package-linux.sh
```

Scripts should:

* verify prerequisites
* build the frontend
* build Tauri
* copy required resources
* create the correct portable structure
* clearly report output paths
* fail clearly if something is missing

---

# 58. Release Outputs

Aim for predictable release artifacts.

Windows:

```text
dist/
├── Application-Setup-x.y.z.exe
└── Application-Portable-x.y.z.zip
```

Linux:

```text
dist/
├── Application-x.y.z.AppImage
├── application_x.y.z_amd64.deb
└── application-x.y.z.x86_64.rpm
```

RPM may follow after the core Linux build is proven.

---

# 59. No GitHub Actions Requirement

Do not assume cloud CI/CD is necessary.

The project must be fully buildable locally.

Build scripts and documentation are more important than an elaborate GitHub Actions pipeline.

Do not introduce CI infrastructure unless requested.

---

# 60. Development Phases

Implement the project incrementally.

## Phase 0 — Technical Validation

Before building extensively, prove the difficult assumptions.

Investigate and document:

* Windows burner detection
* Linux burner detection
* blank-media detection
* disc capacity detection
* burning backend
* CD-TEXT support
* backend licensing
* Windows process hiding
* Linux permissions
* portable dependency bundling

Create small technical experiments if necessary.

Do not build the entire application around an unverified assumption.

---

## Phase 1 — UI Prototype

Build the complete frontend experience without physical burning.

Implement:

* main screen
* CD title
* file picker
* drag/drop
* track list
* metadata
* duration
* reordering
* removing
* capacity meter
* empty state
* settings
* light/dark themes
* simulated disc states
* simulated burn progress

The UI should already feel close to the final product.

---

## Phase 2 — Audio Pipeline

Implement:

* FFprobe integration
* metadata extraction
* format validation
* duration calculation
* conversion
* temporary working directories
* CD-compatible audio preparation
* progress/error handling

Test multiple source formats.

---

## Phase 3 — Optical Hardware

Implement:

* burner detection
* multiple-drive handling
* media insertion detection
* blank-disc detection
* media type
* writable status
* capacity
* eject

Test physical hardware before proceeding.

---

## Phase 4 — Burning

Implement:

* backend abstraction
* burn preparation
* track ordering
* TOC/CUE generation as required
* CD-TEXT
* burn invocation
* progress parsing
* finalization
* error handling
* retries
* successful completion
* Burn Another

---

## Phase 5 — Distribution

Implement:

### Windows

* installer
* portable ZIP
* hidden child-process consoles
* correct icons
* installed settings location
* portable settings location

### Linux

* AppImage
* DEB
* permissions
* desktop integration
* icons
* dependency handling

---

## Phase 6 — Hardware and Reliability Testing

Test:

* different CD writers
* USB writers
* internal writers
* CD-R
* CD-RW where supported
* 74-minute media
* 80-minute media
* MP3
* FLAC
* WAV
* AAC/M4A
* OGG
* Opus
* AIFF
* unusual filenames
* corrupted audio
* damaged media
* nonblank media
* no media
* no writer
* multiple writers
* failed conversions
* failed burns
* eject during preparation
* application restart
* portable application moved to another folder

---

# 61. Testing Philosophy

Do not consider:

> The command returned exit code 0.

sufficient proof that Audio CD burning works.

A successful test should include playing the resulting disc in:

* the original computer
* at least one ordinary standalone CD player where available

Verify:

* all tracks exist
* track ordering is correct
* tracks start correctly
* no unexpected gaps/corruption
* total duration is sensible
* CD-TEXT where applicable
* final track works
* disc is finalized/readable

---

# 62. UI Testing

Test:

* empty track list
* one track
* many tracks
* long track names
* missing metadata
* duplicate names
* near-capacity compilation
* exact-capacity compilation
* over-capacity compilation
* light mode
* dark mode
* keyboard navigation
* small window
* high-DPI display

---

# 63. Code Quality

Prefer:

* explicit types
* small focused functions
* predictable data flow
* clear error propagation
* reusable abstractions
* documented non-obvious behavior

Avoid:

* unnecessary frameworks
* premature abstraction
* huge files
* magic constants
* duplicate process invocation code
* silent error swallowing
* giant global state
* unnecessary databases
* complicated state-management libraries unless justified

Keep dependencies modest.

---

# 64. Important Engineering Principle

The UI should not know how a CD is physically burned.

The disc layer should not know how React displays progress.

The audio layer should not know how settings are rendered.

The burning backend should be replaceable.

Think approximately:

```text
React UI
   │
   ▼
Tauri Commands
   │
   ▼
Application Services
   │
   ├── Audio Service
   ├── Disc Service
   ├── Settings Service
   └── Burn Coordinator
            │
            ▼
       BurnBackend
            │
      ┌─────┴─────┐
      │           │
   cdrdao       Future
                Backend
```

Maintain these boundaries.

---

# 65. Decision Making

If you encounter uncertainty:

1. identify the uncertainty
2. research or inspect the relevant APIs/tools
3. prefer a small proof-of-concept
4. document the result
5. then implement the production architecture

Do not fabricate command-line options, Tauri APIs, FFmpeg behavior or burning-backend capabilities.

If you do not know, verify before building around it.

---

# 66. Avoid Feature Creep

Throughout development, protect the central interaction:

```text
Open
  ↓
Add Music
  ↓
Arrange
  ↓
Enter Title
  ↓
Insert CD
  ↓
Burn
```

A feature that complicates this path needs strong justification.

This project's value comes partly from what it **doesn't** do.

---

# 67. Expected Development Behavior

Do not attempt to generate the entire finished application in one enormous response or one monolithic implementation.

Work incrementally.

At each phase:

1. inspect existing repository state
2. read `PROJECT.md`
3. read `PREFERENCE.md`
4. read `NEXT.md`
5. determine which subsystem is affected
6. inspect only relevant code first
7. make focused changes
8. run appropriate tests
9. build the application when appropriate
10. fix introduced compile/type errors
11. update documentation
12. update `NEXT.md`
13. summarize what changed

Do not claim something works unless it has actually been tested to the extent currently possible.

Distinguish clearly between:

* implemented
* compiled
* automatically tested
* manually tested
* hardware tested
* unverified

---

# 68. When Something Goes Wrong

Do not respond to a bug by blindly rewriting large portions of the application.

Instead:

1. reproduce or understand the error
2. identify the subsystem
3. inspect relevant files
4. determine root cause
5. make the smallest robust fix
6. test it
7. check for related regressions
8. document important architectural discoveries

Preserve working functionality.

---

# 69. Current Product Definition

For Version 1, the finished application should ultimately let someone:

1. download the portable version or install the application
2. launch it
3. immediately see the Audio CD creation interface
4. type a CD title
5. drag music into the window
6. see tracks and durations
7. rearrange them
8. see exactly how much disc time is being used
9. insert a blank CD
10. see that the application recognizes the disc
11. click **Burn Audio CD**
12. watch understandable progress
13. receive a clear success message
14. eject the CD
15. put it into an ordinary CD player and listen to it

If the application accomplishes those steps reliably while remaining visually polished and uncomplicated, the project has succeeded.

---

# 70. First Task

Do **not** immediately attempt to implement every feature above.

Begin with **Phase 0: Technical Validation and Architecture**.

First:

1. Review this specification in full.
2. Identify the technically riskiest assumptions.
3. Determine the most appropriate Audio CD burning backend for Windows and Linux.
4. Investigate its redistribution/license implications.
5. Determine how optical-drive and media detection should work on each platform.
6. Determine how FFmpeg/FFprobe should be packaged.
7. Determine how true portable mode should work on Windows.
8. Determine how AppImage portability should work on Linux.
9. Determine Linux optical-drive permission requirements.
10. Propose the final architecture and module boundaries.
11. Identify anything in this specification that is technically incorrect, risky, contradictory, or unnecessarily complicated.
12. Recommend changes where appropriate.

Then create the initial project documentation:

```text
PROJECT.md
PREFERENCE.md
NEXT.md
docs/ARCHITECTURE.md
docs/BURNING-BACKEND.md
docs/AUDIO-PIPELINE.md
docs/PORTABLE-MODE.md
```

After that, provide a concise report containing:

* decisions made
* unresolved questions
* technical risks
* recommended backend
* proposed repository structure
* proposed Phase 1 implementation plan

**Do not begin the full application implementation until the technical foundation has been established.**
