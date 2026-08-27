# Audio Pipeline

This document describes how source audio is inspected and converted into the
form required for a Red Book Audio CD.

---

## 1. Responsibilities

The audio subsystem:

- reads audio metadata and duration;
- validates that a file is usable;
- decodes/converts source audio into CD-compatible PCM during a burn;
- never modifies source files;
- keeps audio logic isolated from the burn backend.

Code location: `src-tauri/src/audio/`.

```text
src-tauri/src/audio/
├── mod.rs
├── probe.rs       # FFprobe integration
├── metadata.rs    # metadata normalization / display title
└── conversion.rs  # FFmpeg decoding/conversion
```

---

## 2. Tools

- **FFprobe** — reading metadata and duration without decoding the whole file.
- **FFmpeg** — decoding and converting source formats to the required PCM.

Both are invoked as separate CLI processes via the shared process layer
(`src-tauri/src/process/`). They are not linked into the application, so this
is an "arms-length" use.

Output audio during a burn is prepared into the temporary burn workspace (see
`ARCHITECTURE.md`, section on Temp Workspace). Source files are never written.

---

## 3. Supported Input Formats

Target common consumer formats:

- MP3
- FLAC
- WAV
- M4A / AAC
- OGG
- Opus
- AIFF

Supported decoding comes from whichever FFmpeg build is bundled; verify the
actual capability with `ffprobe -codecs` for the pinned build.

---

## 4. CD Audio Requirements

The target format for the burn backend:

- Audio sample rate: **44100 Hz**
- Channels: **2 (stereo)**
- Bit depth: **16-bit PCM**
- Standard Red Book Audio CD parameters

The user never chooses these. Conversion settings are determined internally.

---

## 5. Task Flow: Adding a Track

```text
File added (picker or drag/drop)
        │
        ▼
Frontend sends path to Tauri audio command
        │
        ▼
FFprobe  (duration, artist, title, format validation)
        │
        ▼
Normalized AudioTrack   (path, displayTitle, artist, duration, validity)
        │
        ▼
React track state
```

`FFprobe` is used because it reads metadata and duration cheaply without
decoding the whole file. Probing is done asynchronously and with bounded
concurrency so large batches do not launch excessive processes.

---

## 6. Metadata Normalization

When metadata contains artist + title, prefer:

```text
Artist — Title
```

When metadata is absent, fall back to the filename (without relying on ASCII):

```text
dreams.mp3
```

Never reject valid audio merely because metadata is absent.

---

## 7. Track Validation

If a file cannot be decoded/read, the specific track is marked invalid (for
example "This audio file couldn't be read"). One bad file must not fail the
whole application. Burning is blocked while invalid tracks remain unless the
user removes them.

---

## 8. Task Flow: Burning (Preparation)

```text
AudioTrack
        │
        ▼
FFmpeg  (decode source → 44100/16-bit/stereo PCM)
        │
        ▼
CD-Compatible audio file(s) in the burn workspace
        │
        ▼
Burn backend (.toc references prepared files)
```

Conversion failures identify the affected source track.

---

## 9. Process and Safety

- Use structured process arguments, never shell strings built from untrusted
  filenames or metadata (prevent command injection).
- Handle filenames with spaces, quotes, ampersands, non-Latin characters,
  and long paths (see `ARCHITECTURE.md`, Unicode/Filesystem robustness).
- Child processes run hidden on Windows and never block the UI thread.

---

## 10. Performance

- Probe cheaply; do not decode entire files just to get a duration.
- Process batches with sensible concurrency limits.
- Convert at burn time into the temporary workspace.
