# Portable Mode

## Principle

Portable mode is a first-class requirement, not an afterthought. The application must work correctly whether installed or extracted from a zip file.

## Detection

The application determines its mode at startup:

```text
If the executable's directory contains a writable "data/" folder
  → portable mode
Else
  → installed mode
```

This is checked once at startup and cached. The mode does not change during the application's lifetime.

## Directory Structure

### Portable (Windows)

```text
Burnt-Portable/
├── Burnt.exe
├── bin/
│   ├── ffmpeg.exe
│   ├── ffprobe.exe
│   └── [other bundled tools]
├── data/
│   └── settings.json
└── licenses/
    └── THIRD_PARTY_LICENSES.md
```

### Installed (Windows)

```text
%LOCALAPPDATA%\Burnt\
├── data/
│   └── settings.json
└── logs/
    └── burnt.log

%PROGRAMFILES%\Burnt\
├── Burnt.exe
├── bin/
│   ├── ffmpeg.exe
│   ├── ffprobe.exe
│   └── [other bundled tools]
└── licenses/
    └── THIRD_PARTY_LICENSES.md
```

### Portable (Linux AppImage)

AppImage provides its own filesystem. Mutable state is written to:

```text
~/.local/share/burnt/
├── data/
│   └── settings.json
└── logs/
    └── burnt.log
```

### Installed (Linux)

```text
/etc/burnt/              — (not writable, system config only)
~/.config/burnt/
├── data/
│   └── settings.json
└── logs/
    └── burnt.log
```

## Settings Location

| Mode | Platform | Settings Path |
|------|----------|--------------|
| Portable | Windows | `<exe_dir>/data/settings.json` |
| Installed | Windows | `%APPDATA%\Burnt\data\settings.json` |
| Portable | Linux AppImage | `~/.local/share/burnt/data/settings.json` |
| Installed | Linux | `~/.config/burnt/data/settings.json` |

## Finding Bundled Binaries

### Portable Mode

```text
exe_dir / bin / ffmpeg.exe    (Windows)
exe_dir / bin / ffmpeg        (Linux)
```

### Installed Mode

```text
resource_dir / bin / ffmpeg.exe    (Windows)
resource_dir / bin / ffmpeg        (Linux)
```

The `resource_dir` path is provided by Tauri's path API.

## Relative Paths

All internal paths should be relative to the application's root directory, not the current working directory. The working directory is unreliable:

- On Windows, a shortcut may set a different working directory
- On Linux, the AppImage may mount to a temporary location
- Users may launch the application from a terminal in any directory

Use `std::env::current_exe()` to find the executable's directory, then resolve paths relative to that.

## Console Windows

On Windows, bundled CLI tools (FFmpeg, FFprobe, cdrdao) must not flash a console window. This is handled by:

1. Setting `CREATE_NO_WINDOW` (0x08000000) creation flag on all child processes
2. Using Tauri's sidecar mechanism, which may handle this automatically
3. Testing on a clean Windows install without a terminal attached

## Portable Data Integrity

- Portable mode never writes outside the portable directory tree
- Settings changes are written atomically (write to temp, then rename)
- If the portable directory is read-only (CD-ROM, protected folder), settings are read-only and changes silently fail with a warning

## Tauri Configuration

Tauri's `tauri.conf.json` must be configured for both modes:

```json
{
  "bundle": {
    "resources": ["bin/*"],
    "externalBin": ["bin/ffmpeg", "bin/ffprobe"]
  }
}
```

The `externalBin` entries use the Tauri sidecar naming convention with target triple suffixes in the source directory. Tauri strips these at build time.
