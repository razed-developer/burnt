# Architecture

> **Backend note (revised decision):** The examples below mention `cdrdao` as
> a potential burning backend. The owner has decided **not** to use cdrdao for
> Version 1; the Windows backend is Windows-native (IMAPI2 / SPTI-MMC) and the
> Linux backend is undecided. The `BurnBackend` abstraction described here
> remains the design boundary — production code must not spread cdrdao calls
> throughout the application. See `docs/BURNING-BACKEND.md` for the current
> decision.

## 1. Purpose

This document defines the technical architecture of the Audio CD Burner application.

Its primary purpose is to keep the project:

* understandable
* compartmentalized
* portable
* cross-platform
* easy to modify
* efficient for AI-assisted development
* resistant to large interconnected files

This document describes **how the application is organized**.

For other project information:

* `PROJECT.md` — what the application is and its requirements
* `PREFERENCE.md` — development and design preferences
* `NEXT.md` — current work, bugs, and requested changes
* `README.md` — setup, building, packaging, and usage

When implementing a feature, inspect the relevant subsystem first rather than reading the entire repository.

---

# 2. Technology Stack

## Frontend

* React
* TypeScript
* Vite

Responsibilities:

* interface rendering
* track-list presentation
* drag and drop
* user interaction
* capacity visualization
* settings interface
* burn-progress presentation
* friendly error presentation

The frontend must not directly implement operating-system or optical-disc functionality.

---

## Desktop Runtime

* Tauri v2

Tauri provides the bridge between the React frontend and Rust backend.

The frontend communicates with native functionality through defined Tauri commands and events.

---

## Native Core

* Rust

Responsibilities:

* filesystem access
* audio inspection
* external process management
* temporary-file management
* optical-drive detection
* media detection
* disc-capacity detection
* audio preparation
* burn coordination
* CD-TEXT preparation
* eject operations
* settings persistence
* platform-specific behavior
* technical error handling

---

## Audio Tools

Primary candidates:

* FFprobe — audio inspection and metadata
* FFmpeg — decoding/conversion

Source audio should be converted automatically when necessary.

The user should never need to configure:

* sample rate
* bit depth
* codecs
* PCM format

for normal Audio CD creation.

---

## Disc Burning Backend

The physical burning implementation must be isolated behind a backend abstraction.

Potential initial backend:

* `cdrdao`

The final backend should be selected based on actual Windows and Linux testing.

The rest of the application must not assume that `cdrdao` will always be used.

---

# 3. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                 React UI                     │
│                                              │
│ Track List • Capacity • Disc Status          │
│ Settings • Burn Progress • Errors            │
└─────────────────────┬────────────────────────┘
                      │
                      │ Tauri Commands / Events
                      ▼
┌──────────────────────────────────────────────┐
│              Application Layer               │
│                                              │
│      Commands / Burn Coordinator             │
└───────┬─────────────┬─────────────┬──────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌───────────┐ ┌───────────────┐
│    Audio    │ │   Disc    │ │   Settings    │
│   Service   │ │  Service  │ │    Service    │
└──────┬──────┘ └─────┬─────┘ └───────────────┘
       │              │
       ▼              ▼
┌─────────────┐ ┌──────────────────────────────┐
│ FFmpeg /    │ │         BurnBackend          │
│ FFprobe     │ └──────────────┬───────────────┘
└─────────────┘                │
                               ▼
                     ┌────────────────────┐
                     │ cdrdao / platform │
                     │ burning backend   │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ Optical CD Writer  │
                     └────────────────────┘
```

Each layer should know as little as practical about the implementation details of the layer beneath it.

---

# 4. Core Architectural Principle

The application should be built around this rule:

> **The UI describes what the user wants. The Rust core determines how to make it happen.**

React should be able to request:

```text
Burn this compilation.
```

It should not need to know:

```text
Generate this TOC file.
Convert these files.
Execute this cdrdao command.
Parse this stderr output.
Finalize this session.
```

Those are backend responsibilities.

---

# 5. Frontend Architecture

Suggested structure:

```text
src/
├── app/
│   ├── App.tsx
│   └── routes.ts
│
├── pages/
│   ├── Burner/
│   └── Settings/
│
├── components/
│   ├── AudioDropZone/
│   ├── TrackList/
│   ├── TrackRow/
│   ├── CapacityMeter/
│   ├── DiscStatus/
│   ├── DriveSelector/
│   ├── BurnButton/
│   └── BurnProgress/
│
├── hooks/
│
├── services/
│
├── types/
│
├── utils/
│
└── styles/
```

This structure may evolve as the project develops.

Do not create empty abstractions merely to match this diagram.

---

# 6. App Component

`App.tsx` should remain small.

Its responsibility should primarily be:

* application shell
* top-level state initialization
* page selection/routing
* global error boundary where appropriate

Do not place:

* audio processing
* track parsing
* optical-drive logic
* burn commands
* large UI sections

directly in `App.tsx`.

---

# 7. Burner Page

The Burner page owns the primary workflow:

```text
Title
  ↓
Tracks
  ↓
Capacity
  ↓
Disc Status
  ↓
Burn
```

It coordinates frontend components but should not contain the implementation of each component.

---

# 8. Track List

The Track List subsystem handles:

* track display
* track numbering
* ordering
* reordering
* selection where needed
* removal

Suggested structure:

```text
components/TrackList/
├── TrackList.tsx
├── TrackList.css
└── index.ts
```

Individual rows may live separately:

```text
components/TrackRow/
```

or within the Track List subsystem if they are tightly coupled.

---

# 9. Audio Drop Zone

Responsible for:

* file drag state
* drop target
* file selection interaction
* communicating selected paths/files to the application

It should not perform FFmpeg operations itself.

---

# 10. Capacity Meter

Responsible for presenting:

* current duration
* maximum capacity
* remaining duration
* over-capacity duration
* visual fill state

The underlying calculation should use duration values rather than source-file sizes.

The component should receive values such as:

```text
usedSeconds
capacitySeconds
```

rather than calculating audio properties itself.

---

# 11. Disc Status

Responsible for presenting states such as:

* no writer
* writer available
* no disc
* checking disc
* blank disc
* unsuitable disc
* nonblank disc
* ready to burn

The component should display a normalized application state.

It should not interpret raw `cdrdao`, SCSI, or operating-system output.

---

# 12. Frontend Services

Frontend service modules should wrap Tauri communication.

For example:

```text
services/
├── audioService.ts
├── discService.ts
├── burnService.ts
└── settingsService.ts
```

Instead of components repeatedly calling raw Tauri commands, they should generally use these service boundaries.

Example conceptually:

```text
TrackList
   │
   ▼
audioService
   │
   ▼
Tauri Command
```

This reduces coupling between UI components and backend command names.

---

# 13. Shared Frontend Types

Use explicit TypeScript types.

Examples:

```text
AudioTrack
DiscDrive
DiscMedia
BurnProject
BurnProgress
BurnResult
ApplicationSettings
```

Avoid passing arbitrary objects between components.

Types should describe application concepts rather than backend-specific implementation details.

---

# 14. Rust Architecture

Suggested structure:

```text
src-tauri/src/
├── main.rs
│
├── commands/
│   ├── mod.rs
│   ├── audio.rs
│   ├── disc.rs
│   ├── burn.rs
│   └── settings.rs
│
├── audio/
│   ├── mod.rs
│   ├── probe.rs
│   ├── metadata.rs
│   └── conversion.rs
│
├── disc/
│   ├── mod.rs
│   ├── backend.rs
│   ├── drive.rs
│   ├── media.rs
│   ├── burn.rs
│   ├── progress.rs
│   └── cdtext.rs
│
├── platform/
│   ├── mod.rs
│   ├── windows.rs
│   └── linux.rs
│
├── process/
│   ├── mod.rs
│   └── runner.rs
│
├── settings/
│   ├── mod.rs
│   └── storage.rs
│
├── temp/
│   ├── mod.rs
│   └── workspace.rs
│
├── error/
│   ├── mod.rs
│   └── user_error.rs
│
└── models/
    ├── mod.rs
    ├── track.rs
    ├── disc.rs
    └── burn.rs
```

Again, create modules when functionality exists rather than generating empty files merely to satisfy this structure.

---

# 15. Tauri Commands

Tauri commands are the frontend/native boundary.

Commands should be thin.

They should:

1. receive validated/serializable input
2. call the appropriate service/subsystem
3. convert results into frontend-safe structures
4. return

Avoid implementing large workflows directly inside command functions.

Bad:

```text
commands/burn.rs
    └── contains 900 lines implementing the entire burn process
```

Preferred:

```text
commands/burn.rs
       │
       ▼
BurnCoordinator
       │
       ├── AudioService
       ├── DiscService
       └── BurnBackend
```

---

# 16. Application Models

Rust should define application-level models independent of the physical backend.

Conceptual examples:

```text
AudioTrack
```

Contains information such as:

* source path
* display title
* artist
* duration
* validity

---

```text
DiscDrive
```

Contains normalized information such as:

* identifier
* display name
* write capability
* selected status

---

```text
DiscMedia
```

Contains:

* presence
* media type
* writable status
* blank status
* capacity

---

```text
BurnProject
```

Contains:

* CD title
* ordered tracks
* selected drive
* relevant burn options

---

# 17. Burn Backend Abstraction

The burning engine must be replaceable.

Conceptually:

```text
BurnBackend
```

should provide operations similar to:

```text
detect_drives()
inspect_media()
burn()
eject()
```

Exact Rust traits/interfaces should be designed based on actual requirements.

Do not force an abstraction before the backend has been technically investigated.

However, production code should not spread direct `cdrdao` calls throughout the application.

---

# 18. Backend-Specific Implementation

If `cdrdao` is selected, its implementation should live behind the backend boundary.

For example:

```text
disc/
├── backend.rs
└── backends/
    └── cdrdao.rs
```

Then:

```text
Application
    │
    ▼
BurnBackend
    │
    ▼
CdrdaoBackend
```

A future backend could then be introduced:

```text
backends/
├── cdrdao.rs
├── windows_native.rs
└── linux_native.rs
```

without redesigning the frontend.

---

# 19. Audio Pipeline

Audio preparation should be treated as its own subsystem.

Conceptually:

```text
Source File
     │
     ▼
  FFprobe
     │
     ├── duration
     ├── title
     ├── artist
     └── validation
     │
     ▼
AudioTrack
```

During burning:

```text
AudioTrack
     │
     ▼
  FFmpeg
     │
     ▼
CD-Compatible Audio
     │
     ▼
Temporary Workspace
     │
     ▼
Burn Backend
```

Source files must never be modified.

---

# 20. Audio Preparation

Audio conversion should produce the exact format required by the selected burning backend.

The application should determine these requirements internally.

The user should not configure:

* sample rate
* channels
* bit depth
* codec

for ordinary Audio CD creation.

Conversion failures should identify the affected source track.

---

# 21. Temporary Workspace

Each burn operation should use its own temporary workspace.

Conceptually:

```text
temp/
└── burn-<unique-id>/
    ├── tracks/
    ├── disc.toc
    └── logs/
```

Exact contents depend on the backend.

Requirements:

* unique per operation
* no source-file modification
* cleanup after success
* cleanup after handled failure
* cleanup after cancellation where possible

Consider detecting abandoned temporary workspaces after crashes.

---

# 22. External Process Layer

FFmpeg, FFprobe, cdrdao, and other CLI tools should not each invent their own process-running logic.

Provide a shared process layer.

Responsibilities:

* locate bundled executables
* create commands safely
* pass structured arguments
* capture stdout
* capture stderr
* return exit codes
* hide console windows on Windows
* support cancellation where appropriate
* prevent orphan processes
* support progress output

Never build commands by concatenating untrusted filenames into shell strings.

Prefer direct process execution.

---

# 23. Windows Child Processes

GUI builds must not display:

* Command Prompt
* PowerShell
* terminal windows

when launching helper processes.

The process subsystem should handle this centrally.

Do not solve this independently in every FFmpeg/cdrdao invocation.

---

# 24. Disc Detection

The disc subsystem owns optical hardware state.

It should normalize platform/backend information into application concepts.

The frontend should receive:

```text
Blank writable CD
```

rather than having to interpret:

```text
raw device/backend output
```

Disc detection should support:

* no writer
* one writer
* multiple writers
* no media
* inserted media
* media removal
* writable media
* unsuitable media
* blank/nonblank state
* capacity where available

---

# 25. Disc Monitoring

The application should notice media changes without requiring restart.

If reliable event-driven detection is practical, use it.

Otherwise use modest polling.

Do not aggressively poll optical hardware.

The monitoring implementation belongs in the backend/native layer, not React timers scattered throughout components.

---

# 26. Burn Coordinator

The complete burn operation spans several subsystems.

A dedicated coordinator/service should own this workflow.

Conceptually:

```text
BurnCoordinator
      │
      ├── Validate project
      ├── Validate drive
      ├── Validate media
      ├── Create workspace
      ├── Prepare tracks
      ├── Generate burn description
      ├── Start backend
      ├── Monitor progress
      ├── Finalize
      ├── Report result
      └── Cleanup
```

This prevents either the UI or burning backend from becoming responsible for the entire application workflow.

---

# 27. Burn Progress

Burn progress should use normalized application events.

Examples:

```text
PreparingTrack
PreparationComplete
WritingStarted
WritingProgress
Finalizing
Completed
Failed
```

Include useful data where available:

```text
currentTrack
totalTracks
percentage
message
```

Do not invent percentages.

If the backend only indicates:

```text
Writing track 4
```

show that rather than manufacturing a fake `63%`.

---

# 28. Tauri Events

Long-running operations such as burning should report progress asynchronously.

Conceptually:

```text
Rust
 │
 ├── BurnProgress
 ├── DiscStateChanged
 └── BurnCompleted
       │
       ▼
Tauri Events
       │
       ▼
React
```

Do not block a frontend command until an entire long-running operation has completed if doing so prevents useful progress reporting or cancellation.

---

# 29. Error Architecture

Technical errors and user-facing errors should be separate concepts.

For example:

```text
Technical:

cdrdao exited with status 2
Sense Code ...
```

may map to:

```text
User:

The CD couldn't be written.

Try another blank disc and burn again.
```

Technical details should remain available for diagnostics.

Do not discard them.

---

# 30. Error Categories

Normalize common failures.

Potential categories:

```text
NoWriter
NoMedia
MediaNotWritable
MediaNotBlank
InsufficientCapacity
AudioDecodeFailure
BackendUnavailable
BurnFailed
EjectFailed
PermissionDenied
```

The exact model should evolve based on actual backend behavior.

Do not make the frontend parse arbitrary error strings.

---

# 31. Platform Layer

Windows/Linux differences should be isolated where practical.

```text
platform/
├── windows.rs
└── linux.rs
```

Possible responsibilities include:

* executable discovery
* process flags
* optical-device paths
* permissions
* installed/portable paths
* OS-specific integration

Do not scatter platform checks throughout unrelated modules unless there is a good reason.

---

# 32. Portable Mode

Portable operation is an architectural requirement.

The application should determine its storage mode centrally.

Conceptually:

```text
StorageMode
├── Installed
└── Portable
```

Other subsystems should ask a path/configuration service where data belongs.

Do not let each subsystem independently decide where to store files.

---

# 33. Windows Portable Layout

Expected concept:

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

Portable paths should be resolved relative to the executable/resources rather than the shell's current working directory.

---

# 34. Installed Mode

Installed builds should use appropriate operating-system locations.

Do not attempt to write mutable settings beside an executable installed under protected locations such as:

```text
C:\Program Files\
```

The settings subsystem should abstract this difference.

---

# 35. Settings

Settings should remain simple.

Initial settings may include:

```text
theme
preferred_drive
eject_after_burn
burn_speed
```

Prefer JSON unless requirements become complex enough to justify another storage mechanism.

Do not introduce SQLite solely for a few preferences.

---

# 36. Application State

Frontend application state should remain modest.

Likely state includes:

```text
discTitle
tracks
selectedDrive
discState
burnState
settings
```

Avoid introducing a large state-management framework unless React's existing mechanisms become insufficient.

---

# 37. Source of Truth

Avoid storing the same state independently in multiple places.

For example:

Track order should have one authoritative representation.

Disc hardware state should originate from the backend.

Frontend state may cache/display it, but should not invent hardware state.

---

# 38. Dependency Direction

Prefer dependencies flowing inward toward application abstractions.

For example:

```text
UI
 ↓
Application Services
 ↓
Domain/SubSystems
 ↓
Platform / External Tools
```

Avoid:

```text
FFmpeg implementation
       ↓
React component
```

or backend-specific code reaching upward into UI concepts.

---

# 39. Logging

Use centralized logging.

Useful diagnostic information may include:

* application version
* platform
* detected writers
* media detection
* audio preparation
* process exit codes
* burn stages
* technical errors

Do not unnecessarily log unrelated personal data.

Logging should be particularly useful for hardware-dependent failures that cannot be reproduced by a developer without the same drive.

---

# 40. Security Boundary

Treat all external input as untrusted.

This includes:

* paths
* filenames
* metadata
* backend output

Never invoke helper programs using shell strings built from user-controlled content.

For example, a filename containing:

```text
&
"
'
;
```

must remain a filename, not become command syntax.

---

# 41. Repository Navigation for Coding Agents

When working on a task, begin with the smallest relevant area.

Examples:

### Track appearance

Start with:

```text
src/components/TrackList/
src/components/TrackRow/
```

### Capacity calculation/display

Start with:

```text
src/components/CapacityMeter/
```

and the associated duration utilities/types.

### Audio metadata

Start with:

```text
src-tauri/src/audio/
```

### Optical drive problem

Start with:

```text
src-tauri/src/disc/
```

### Windows-only problem

Start with:

```text
src-tauri/src/platform/windows.rs
```

### External executable problem

Start with:

```text
src-tauri/src/process/
```

### Burn failure

Start with:

```text
BurnCoordinator
src-tauri/src/disc/
src-tauri/src/error/
```

Do not begin by reading every file in the repository.

---

# 42. Avoid Monolithic Files

The following are architectural warning signs:

```text
App.tsx          → hundreds of lines of unrelated UI
commands.rs      → every Tauri command
main.rs          → application business logic
utils.ts         → dozens of unrelated helpers
burn.rs          → entire optical subsystem
```

Split by responsibility before these become difficult to maintain.

---

# 43. Avoid Over-Engineering

Compartmentalization does not mean creating an abstraction for every function.

Do not create:

* unnecessary interfaces
* factories for trivial objects
* complex dependency injection
* microservices
* event buses without need
* dozens of one-function modules

Use the simplest architecture that maintains clear boundaries.

---

# 44. Testing Architecture

Tests should generally live near the subsystem they verify or in a clearly organized test directory.

Prioritize automated testing for logic that does not require physical hardware.

Good candidates include:

* duration calculations
* capacity calculations
* track ordering
* settings serialization
* metadata normalization
* error mapping
* progress parsing
* command argument generation

Hardware behavior requires separate manual verification.

---

# 45. Hardware Boundary

Never confuse:

```text
unit test passed
```

with:

```text
Audio CD successfully burned.
```

Physical burn functionality requires actual hardware testing.

Document hardware tests separately where useful.

Testing should eventually include:

```text
CD Writer
    ↓
Blank CD-R
    ↓
Burn
    ↓
Finalize
    ↓
Eject
    ↓
Standalone CD Player
```

The final playback test is important because the goal is not merely producing a disc the computer itself can read.

---

# 46. Build Architecture

Keep build and packaging logic outside application source where practical.

Use:

```text
scripts/
```

for repeatable packaging/build operations.

Potential scripts:

```text
scripts/
├── build-windows.ps1
├── package-windows-portable.ps1
├── build-linux.sh
└── package-linux.sh
```

Build scripts should not contain application business logic.

---

# 47. Release Architecture

Expected release families:

## Windows

```text
Application-Setup-x.y.z.exe
Application-Portable-x.y.z.zip
```

## Linux

```text
Application-x.y.z.AppImage
application_x.y.z_amd64.deb
```

RPM may be added later.

The same application source should produce installed and portable variants.

Do not maintain separate application implementations for portable and installed editions.

---

# 48. Third-Party Binaries

Bundled tools should have a predictable resource location.

Do not search arbitrary locations on the user's computer first if the application ships its own known-compatible version.

A centralized executable resolver should answer questions such as:

```text
Where is FFmpeg?
Where is FFprobe?
Where is the burning backend?
```

Development builds may optionally support system-installed tools where useful.

Production behavior should be predictable.

---

# 49. Licensing Boundary

Third-party executables must be tracked.

Maintain:

```text
THIRD_PARTY_LICENSES.md
```

and/or:

```text
licenses/
```

as appropriate.

Adding a new external binary is not merely an implementation detail; its redistribution terms must be considered.

---

# 50. Architecture Changes

This document should evolve.

When a significant architectural decision changes:

1. update the implementation
2. update this document
3. update `PROJECT.md` if the product-level design changed
4. record outstanding migration/testing work in `NEXT.md`

Do not leave architecture documentation describing a system that no longer exists.

---

# 51. Current Expected Data Flow

Adding a track:

```text
User drops file
      │
      ▼
AudioDropZone
      │
      ▼
audioService.ts
      │
      ▼
Tauri audio command
      │
      ▼
Audio subsystem
      │
      ▼
FFprobe
      │
      ▼
Normalized AudioTrack
      │
      ▼
React track state
      │
      ▼
TrackList + CapacityMeter
```

Burning:

```text
User clicks Burn
      │
      ▼
Frontend validates obvious state
      │
      ▼
burnService
      │
      ▼
Tauri burn command
      │
      ▼
BurnCoordinator
      │
      ├── Validate media
      ├── Create workspace
      ├── Prepare audio
      ├── Prepare CD-TEXT
      └── Start BurnBackend
                │
                ▼
          Physical Writer

During operation:

BurnCoordinator
      │
      ▼
Progress Events
      │
      ▼
Tauri
      │
      ▼
React BurnProgress
```

---

# 52. Architectural Success Criteria

The architecture is successful if:

* React can be redesigned without rewriting the burn engine.
* The burn backend can be replaced without redesigning React.
* FFmpeg integration can change without rewriting track-list components.
* Windows-specific fixes do not require modifying Linux logic unnecessarily.
* portable and installed builds share the same application code.
* a coding agent can locate the subsystem responsible for a bug quickly.
* individual files maintain clear responsibilities.
* important technical behavior is documented.
* physical hardware failures produce useful diagnostic information.
* adding features does not steadily turn `App.tsx` or `main.rs` into monoliths.

Above all:

> **Keep the simple user experience separate from the complicated machinery required to make it work.**

The user should experience:

```text
Add music → Arrange → Insert CD → Burn
```

even though internally the application may perform:

```text
Probe
  ↓
Validate
  ↓
Detect Hardware
  ↓
Inspect Media
  ↓
Calculate Capacity
  ↓
Decode
  ↓
Convert
  ↓
Generate TOC
  ↓
Write
  ↓
Finalize
  ↓
Eject
```

That separation is the central architectural principle of the project.
