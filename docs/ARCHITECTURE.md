# Architecture

## Overview

Burnt is a Tauri v2 desktop application that creates standard Audio CDs. The frontend is React + TypeScript + Vite. The backend is Rust. Platform-specific burning and hardware interaction lives entirely in the Rust layer.

## Layer Diagram

```text
React UI (TypeScript)
   │
   ▼
Tauri Commands / Events / Channels
   │
   ▼
Application Services (Rust)
   │
   ├── AudioService      — metadata extraction, format validation
   ├── DiscService        — drive detection, media inspection, hotplug
   ├── BurnCoordinator   — orchestrates the full burn workflow
   ├── SettingsService    — persistent preferences
   └── ConversionService  — audio decoding to CD-DA PCM
   │
   ▼
Platform Backends
   │
   ├── Windows
   │   ├── IMAPI2 (COM)    — DAO audio CD burning, CD-TEXT
   │   ├── WMI              — drive enumeration
   │   └── WM_DEVICECHANGE  — media hotplug detection
   │
   └── Linux
       ├── cdrdao (external) — DAO audio CD burning, CD-TEXT
       ├── udev              — drive enumeration, hotplug monitoring
       └── SG_IO ioctl       — SCSI commands for media info
   │
   ▼
External Tools (bundled or required)
   │
   ├── FFprobe  — audio metadata and duration
   ├── FFmpeg   — audio conversion to CD-DA PCM WAV
   └── cdrdao   — Linux only, user-installed
```

## Module Boundaries

Each subsystem owns its own domain. No subsystem reaches into another's internals.

### Frontend (`src/`)

The React layer handles presentation only. It receives data from Tauri commands and emits user actions back. It never spawns processes, reads disc hardware, or converts audio.

Key modules:

- `src/components/TrackList/` — track display, reorder, remove
- `src/components/CapacityMeter/` — visual capacity bar
- `src/components/DiscStatus/` — disc state display
- `src/components/BurnProgress/` — burn workflow UI
- `src/components/AudioDropZone/` — drag-and-drop import
- `src/components/DriveSelector/` — optical drive picker
- `src/pages/Burner/` — main burn screen
- `src/pages/Settings/` — settings screen
- `src/services/` — Tauri command wrappers
- `src/hooks/` — React hooks for state and events
- `src/types/` — shared TypeScript types

### Rust Backend (`src-tauri/src/`)

```text
src-tauri/src/
├── main.rs
├── commands/          — Tauri command handlers (thin, delegate to services)
├── audio/
│   ├── mod.rs
│   ├── metadata.rs    — FFprobe wrapper for metadata extraction
│   ├── probe.rs       — batch probing with concurrency control
│   └── conversion.rs  — FFmpeg wrapper for PCM conversion
├── disc/
│   ├── mod.rs
│   ├── drive.rs       — drive enumeration
│   ├── media.rs       — media inspection (blank, capacity, type)
│   ├── burn.rs        — burn execution
│   ├── progress.rs    — progress parsing
│   └── cdtext.rs      — CD-TEXT generation
├── platform/
│   ├── mod.rs         — platform trait definitions
│   ├── windows.rs     — Windows IMAPI2 + WMI implementation
│   └── linux.rs       — Linux cdrdao + udev implementation
├── settings/
│   ├── mod.rs
│   └── schema.rs      — settings file structure
├── error/
│   └── mod.rs         — centralized error model
└── state.rs           — application state management
```

### Process Invocation

All external process calls (FFprobe, FFmpeg, cdrdao) are routed through a centralized process module. This module handles:

- Constructing safe command arguments (no shell interpolation)
- Hiding console windows on Windows (`CREATE_NO_WINDOW`)
- Capturing stdout and stderr
- Timeout handling
- Cleanup on failure

```text
src-tauri/src/process/
├── mod.rs             — shared process utilities
├── command.rs         — safe command builder
└── output.rs          — structured stdout/stderr capture
```

## Data Flow

### Adding a Track

```text
User drops file
  → React calls invoke('add_track', { path })
  → Rust AudioService.probe(path)
    → spawns ffprobe, parses JSON
    → returns TrackInfo { path, title, artist, duration, format }
  → Tauri command returns TrackInfo to frontend
  → React adds to track list, updates capacity meter
```

### Burning a Disc

```text
User clicks Burn
  → React calls invoke('start_burn', { tracks, title, settings })
  → BurnCoordinator validates track list
  → BurnCoordinator creates temporary directory
  → BurnCoordinator converts each track to CD-DA PCM WAV (parallel, bounded)
    → emits progress via Channel
  → BurnCoordinator generates burn description
    → Windows: feeds PCM streams to IMAPI2 RawCDImageCreator
    → Linux: generates .toc file for cdrdao
  → BurnCoordinator initiates burn
    → Windows: IMAPI2 WriteMedia
    → Linux: spawns cdrdao write
    → emits progress via Channel
  → BurnCoordinator waits for completion
  → BurnCoordinator cleans up temporary files
  → Returns success or structured error
  → React shows result screen
```

## Error Model

Errors are categorized into:

1. **User errors** — invalid input, incompatible disc, no writer found
2. **System errors** — missing dependencies, permission denied, hardware failure
3. **Backend errors** — cdrdao/IMAPI2 failures translated to plain language

Each error has:

- A user-facing message (friendly, actionable)
- A technical detail (for logs and the "Show details" expander)
- A severity level (info, warning, error)

## Settings Storage

Settings are stored as a JSON file:

- **Installed mode:** OS-appropriate data directory (`%APPDATA%` on Windows, `~/.config` on Linux)
- **Portable mode:** `data/settings.json` adjacent to the executable

The settings schema is defined in Rust and serialized/deserialized via `serde`.

## Threading Model

- **Tauri main thread:** UI event loop
- **Async runtime (tokio):** Tauri commands, process spawning, I/O
- **Dedicated threads:**
  - Disc hotplug monitor (udev on Linux, WM_DEVICECHANGE on Windows)
  - Progress parser (reads stderr from cdrdao/IMAPI2 events)

Frontend receives updates via:

- **Tauri Channels** for ordered progress during burn/conversion
- **Tauri Events** for disc state changes and drive hotplug
