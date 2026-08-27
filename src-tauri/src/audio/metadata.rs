use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::process;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioMetadata {
    pub duration: f64,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub format: String,
    pub sample_rate: Option<u32>,
    pub channels: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeResult {
    pub success: bool,
    pub metadata: Option<AudioMetadata>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FfprobeOutput {
    format: Option<FfprobeFormat>,
    streams: Option<Vec<FfprobeStream>>,
}

#[derive(Debug, Deserialize)]
struct FfprobeFormat {
    duration: Option<String>,
    format_name: Option<String>,
    tags: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Deserialize)]
struct FfprobeStream {
    codec_type: Option<String>,
    #[allow(dead_code)]
    codec_name: Option<String>,
    sample_rate: Option<String>,
    channels: Option<u32>,
}

pub fn probe_file(path: &Path) -> ProbeResult {
    let ffprobe = match process::find_tool("ffprobe") {
        Some(p) => p,
        None => {
            return ProbeResult {
                success: false,
                metadata: None,
                error: Some("ffprobe not found. Is it installed?".into()),
            }
        }
    };

    let path_str = path.to_string_lossy();

    let args = [
        "-hide_banner",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        &path_str,
    ];

    let output = match process::run_tool(&ffprobe, &args, std::time::Duration::from_secs(30)) {
        Ok(o) => o,
        Err(e) => {
            return ProbeResult {
                success: false,
                metadata: None,
                error: Some(e),
            }
        }
    };

    if output.exit_code != 0 {
        let stderr = output.stderr.trim();
        return ProbeResult {
            success: false,
            metadata: None,
            error: Some(if stderr.is_empty() {
                "ffprobe returned an error".into()
            } else {
                format!("ffprobe error: {}", stderr)
            }),
        };
    }

    let parsed: FfprobeOutput = match serde_json::from_str(&output.stdout) {
        Ok(p) => p,
        Err(e) => {
            return ProbeResult {
                success: false,
                metadata: None,
                error: Some(format!("Failed to parse ffprobe output: {}", e)),
            }
        }
    };

    let duration = parsed
        .format
        .as_ref()
        .and_then(|f| f.duration.as_deref())
        .and_then(|d| d.parse::<f64>().ok());

    let duration = match duration {
        Some(d) if d > 0.0 => d,
        _ => {
            return ProbeResult {
                success: false,
                metadata: None,
                error: Some("Could not determine audio duration".into()),
            }
        }
    };

    let format_name = parsed
        .format
        .as_ref()
        .and_then(|f| f.format_name.as_deref())
        .unwrap_or("unknown")
        .to_string();

    let tags = parsed
        .format
        .as_ref()
        .and_then(|f| f.tags.as_ref());

    let title = tags.and_then(|t| t.get("title").cloned()).or_else(|| {
        tags.and_then(|t| t.get("TITLE").cloned())
    });

    let artist = tags.and_then(|t| t.get("artist").cloned()).or_else(|| {
        tags.and_then(|t| t.get("ARTIST").cloned())
    });

    let album = tags.and_then(|t| t.get("album").cloned()).or_else(|| {
        tags.and_then(|t| t.get("ALBUM").cloned())
    });

    let audio_stream = parsed
        .streams
        .as_ref()
        .and_then(|s| s.iter().find(|s| s.codec_type.as_deref() == Some("audio")));

    let sample_rate = audio_stream
        .and_then(|s| s.sample_rate.as_deref())
        .and_then(|r| r.parse::<u32>().ok());

    let channels = audio_stream.and_then(|s| s.channels);

    ProbeResult {
        success: true,
        metadata: Some(AudioMetadata {
            duration,
            title,
            artist,
            album,
            format: format_name,
            sample_rate,
            channels,
        }),
        error: None,
    }
}

pub fn probe_files(paths: &[String]) -> Vec<(String, ProbeResult)> {
    paths
        .iter()
        .map(|p| {
            let result = probe_file(Path::new(p));
            (p.clone(), result)
        })
        .collect()
}
