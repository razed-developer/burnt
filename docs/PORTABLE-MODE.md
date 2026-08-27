# Portable Mode

This document describes how the application determines where it is running and
how it keeps application-owned state in the right place in each mode.

---

## 1. Overview

The application supports two storage modes from the beginning:

```text
StorageMode
├── Installed
└── Portable
```

A single source builds both variants. There is no separate portable
implementation.

Code location: `src-tauri/src/platform/` plus a path/configuration service
that other subsystems ask where data belongs.

```text
src-tauri/src/
├── platform/
│   ├── mod.rs
│   ├── windows.rs
│   └── linux.rs
└── settings/
    ├── mod.rs      # StorageMode + settings load/save
    └── storage.rs  # resolves data directories
```

Other subsystems must not each decide independently where to store files; they
ask the settings/path service.

---

## 2. Determining Mode

The application decides at startup whether it is installed or portable by
looking at what is present next to the executable/resources:

- If the application's binary/resources live in a writable portable folder
  (development build, extracted portable folder, AppImage), treat it as
  `Portable` and keep mutable state in that folder.
- If it is an installed build (for example under Windows `Program Files`), it
  must not try to write alongside the executable; use the OS application-data
  location.

The exact detection rule depends on the platform and is implemented centrally
in the platform layer. Paths are resolved relative to the executable/resources,
never the shell's current working directory, so the app works after being
moved.

---

## 3. Windows Layout

### Portable

```text
Application/
├── Application.exe
├── bin/
│   ├── ffmpeg.exe
│   └── ffprobe.exe
├── data/
│   └── settings.json
└── licenses/
```

The Windows burner (IMAPI2 / SPTI-MMC) is part of the application itself, so
no external burning helper is bundled. See `docs/BURNING-BACKEND.md`.

- Launched by double-clicking the `.exe`.
- No installation required.
- No PowerShell/Command Prompt/terminal window flashes at startup.
- Bundled CLI processes execute hidden.
- Settings and other mutable state stay under `data/`.
- Works after the whole folder is moved.

### Installed

An ordinary installer places the application under an OS-approved location.
Mutable settings go to the OS application-data location, not beside the
executable.

---

## 4. Linux Layout

### Portable (AppImage)

The AppImage bundles runtime components and resolves paths via the standard
AppImage environment (`$APPDIR` / resource dir), not the user's shell working
directory.

### Installed

`.deb` (and optionally `.rpm`) packages:

- desktop entry
- application icon
- executable
- bundled resources
- dependencies
- optical-drive access requirements (see section 6)

---

## 5. Mutable State Locations

| Mode      | Settings / mutable state                            |
|-----------|-----------------------------------------------------|
| Portable  | Inside the application folder (e.g. `data/`)        |
| Installed | OS application-data directory                        |

---

## 6. Linux Optical-Drive Permissions

We must not solve permission problems by telling users to run the GUI as root.

Modern systemd distributions grant the active console user write access to
optical devices (`/dev/sr*`) via udev `uaccess` tags and ACLs, or via group
membership (`cdrom` / `optical`, depending on distribution).

Approach:

- Document the required group membership or uaccess behavior for the target
  distributions.
- Prefer safe configuration through packaging when necessary.
- Never ship an SUID-root helper to gain access.
- Never silently weaken system permissions.

See `TROUBLESHOOTING.md` for the user-facing guidance.

---

## 7. Requirements

- Portable operation is a first-class requirement, designed in from the start.
- Installed and portable must share the same application code.
- Portable builds must use relative/resource-safe paths and survive being
  moved.
- Avoid scattering files throughout the operating system in portable mode.
- Document any unavoidable exceptions.
