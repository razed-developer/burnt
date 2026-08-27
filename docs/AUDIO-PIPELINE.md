# Audio Pipeline

## Purpose

The audio pipeline reads source audio files, extracts metadata, validates formats, and converts files to CD-DA compatible PCM WAV (44100 Hz, 16-bit, stereo, little-endian).

## External Tools

### FFprobe

Used for metadata extraction and format validation.

**Command:**

```bash
ffprobe -hide_banner -v error -print_format json -show_format -show_streams <file>
```

**Key output fields:**

```json
{
  "format": {
    "duration": "351.190200",
    "format_name": "mp3",
    "tags": {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name"
    }
  },
  "streams": [{
    "codec_type": "audio",
    "codec_name": "mp3",
    "sample_rate": "44100",
    "channels": 2
  }]
}
```

**Extraction target fields:**

| Field | Source | Fallback |
|-------|--------|----------|
| duration | `format.duration` | Reject file |
| title | `format.tags.title` | Filename without extension |
| artist | `format.tags.artist` | None |
| album | `format.tags.album` | None |
| format | `format.format_name` | Extension-based guess |
| sample_rate | `streams[0].sample_rate` | Informational |
| channels | `streams[0].channels` | Informational |

### FFmpeg

Used for converting source audio to CD-DA PCM WAV.

**Command:**

```bash
ffmpeg -i <input> -ar 44100 -ac 2 -acodec pcm_s16le <output.wav>
```

**Flags:**

- `-ar 44100` — resample to 44100 Hz (CD standard)
- `-ac 2` — stereo (mono is duplicated to both channels)
- `-acodec pcm_s16le` — signed 16-bit little-endian PCM

**Input handling:**

| Input | Conversion |
|-------|-----------|
| 44100 Hz, 16-bit, stereo WAV | Pass-through or minimal re-encode |
| 48000 Hz source | Resampled to 44100 Hz |
| 24-bit or 32-bit source | Dithered to 16-bit |
| Mono source | Duplicated to stereo |
| 5.1 surround | Downmixed to stereo |
| Opus, OGG, FLAC, M4A | Decoded and re-encoded as needed |

## Supported Input Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| MP3 | .mp3 | MPEG-1/2/2.5 Layer III |
| FLAC | .flac | Free Lossless Audio Codec |
| WAV | .wav | PCM or compressed |
| M4A/AAC | .m4a, .aac | MPEG-4 Audio |
| OGG Vorbis | .ogg | Ogg container |
| Opus | .opus | Ogg container, low-latency codec |
| AIFF | .aiff, .aif | Audio Interchange File Format |

All formats supported by FFmpeg are supported by Burnt. The list above covers common consumer formats.

## Metadata Extraction

### Title Resolution

1. If tags contain both artist and title: display as `Artist — Title`
2. If tags contain title only: display as `Title`
3. If no title tag: use filename without extension
4. Never reject a file just because metadata is missing

### Duration

Duration is read from `format.duration` (in seconds, floating point). This is used for:

- Track list duration display
- Capacity meter calculation
- Burn eligibility check (total must fit on disc)

## Concurrency

FFprobe and FFmpeg processes are spawned with controlled parallelism:

- **Probing:** Up to 8 concurrent ffprobe processes. Files are queued and processed as slots free up.
- **Conversion:** Up to 4 concurrent ffmpeg processes (limited by disk I/O and CPU). Conversion is typically I/O-bound.

All process spawning uses the centralized process module for:

- Safe argument construction (no shell interpolation)
- Hidden console windows on Windows
- Structured stdout/stderr capture
- Timeout enforcement

## Temporary Files

Conversion produces temporary WAV files. These are stored in a unique per-burn-session directory:

```text
<temp_root>/burnt-<uuid>/
├── track-01.wav
├── track-02.wav
├── track-03.wav
└── ...
```

Cleanup rules:

- Delete the entire directory after successful burn
- Delete the entire directory after handled failure
- Attempt cleanup after cancellation
- Never delete source audio files
- Detect and clean abandoned directories from previous crashes

## Error Handling

| Error | User Message |
|-------|-------------|
| File not found | "This file could not be found. It may have been moved or deleted." |
| Unsupported format | "This audio format is not supported." |
| Corrupt file | "This audio file could not be read. It may be damaged." |
| Conversion failure | "This file could not be converted for burning. It may be corrupted or use an unusual encoding." |
| Disk space | "Not enough disk space to prepare audio files." |

Technical details are always available behind a "Show details" expander.

## Future Considerations

- **Rust-native probing:** The `symphonia` or `lofty` crates could replace FFprobe for metadata-only extraction, avoiding process spawn overhead. This is a Phase 2+ optimization.
- **Streaming conversion:** For very large files, streaming conversion (pipe FFmpeg output to the burn backend) could reduce temporary disk usage.
- **Normalization:** Not a V1 feature. If added later, it should be an explicit user choice, not automatic.
