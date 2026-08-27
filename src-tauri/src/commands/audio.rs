use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::audio::conversion;
use crate::audio::metadata;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeRequest {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeResponse {
    pub path: String,
    pub file_name: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: f64,
    pub format: String,
    pub is_valid: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrepareRequest {
    pub path: String,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrepareResponse {
    pub id: String,
    pub input_path: String,
    pub output_path: Option<String>,
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub fn probe_audio_file(path: String) -> ProbeResponse {
    let p = Path::new(&path);
    let file_name = p
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    let stem = p
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| file_name.clone());

    let ext = p
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if !is_supported_format(&ext) {
        let msg = format!("Unsupported audio format: .{}", ext);
        return ProbeResponse {
            path,
            file_name,
            title: stem,
            artist: None,
            album: None,
            duration: 0.0,
            format: ext,
            is_valid: false,
            error_message: Some(msg),
        };
    }

    match metadata::probe_file(p) {
        result if result.success => {
            let meta = result.metadata.unwrap();
            let title = meta.title.unwrap_or(stem);

            ProbeResponse {
                path,
                file_name,
                title,
                artist: meta.artist,
                album: meta.album,
                duration: meta.duration,
                format: meta.format,
                is_valid: true,
                error_message: None,
            }
        }
        result => ProbeResponse {
            path,
            file_name,
            title: stem,
            artist: None,
            album: None,
            duration: 0.0,
            format: ext,
            is_valid: false,
            error_message: Some(
                result
                    .error
                    .unwrap_or_else(|| "Could not read audio file".into()),
            ),
        },
    }
}

#[tauri::command]
pub fn probe_audio_files(paths: Vec<String>) -> Vec<ProbeResponse> {
    paths.into_iter().map(|p| probe_audio_file(p)).collect()
}

#[tauri::command]
pub fn prepare_track(path: String, id: String) -> PrepareResponse {
    let input = std::path::PathBuf::from(&path);

    if !input.exists() {
        return PrepareResponse {
            id,
            input_path: path,
            output_path: None,
            success: false,
            error: Some("File not found".into()),
        };
    }

    let temp_dir = match conversion::prepare_temp_dir() {
        Ok(d) => d,
        Err(e) => {
            return PrepareResponse {
                id,
                input_path: path,
                output_path: None,
                success: false,
                error: Some(e),
            }
        }
    };

    let output_name = format!("{}.wav", id);
    let output = temp_dir.join(&output_name);

    match conversion::convert_to_cdda(&input, &output) {
        result if result.success => PrepareResponse {
            id,
            input_path: path,
            output_path: result.output_path,
            success: true,
            error: None,
        },
        result => PrepareResponse {
            id,
            input_path: path,
            output_path: None,
            success: false,
            error: result.error,
        },
    }
}

fn is_supported_format(ext: &str) -> bool {
    matches!(
        ext,
        "mp3" | "flac" | "wav" | "m4a" | "aac" | "ogg" | "opus" | "aiff" | "aif"
    )
}
