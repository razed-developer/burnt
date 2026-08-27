use std::path::Path;

use crate::process;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConversionResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

pub fn convert_to_cdda(input: &Path, output: &Path) -> ConversionResult {
    let ffmpeg = match process::find_tool("ffmpeg") {
        Some(p) => p,
        None => {
            return ConversionResult {
                success: false,
                output_path: None,
                error: Some("ffmpeg not found. Is it installed?".into()),
            }
        }
    };

    let input_str = input.to_string_lossy();
    let output_str = output.to_string_lossy();

    let args = [
        "-y",
        "-hide_banner",
        "-v",
        "error",
        "-i",
        &input_str,
        "-ar",
        "44100",
        "-ac",
        "2",
        "-acodec",
        "pcm_s16le",
        &output_str,
    ];

    match process::run_tool(&ffmpeg, &args, std::time::Duration::from_secs(600)) {
        Ok(output) => {
            if output.exit_code == 0 {
                ConversionResult {
                    success: true,
                    output_path: Some(output_str.to_string()),
                    error: None,
                }
            } else {
                let stderr = output.stderr.trim();
                ConversionResult {
                    success: false,
                    output_path: None,
                    error: Some(if stderr.is_empty() {
                        "FFmpeg conversion failed".into()
                    } else {
                        format!("FFmpeg error: {}", stderr)
                    }),
                }
            }
        }
        Err(e) => ConversionResult {
            success: false,
            output_path: None,
            error: Some(e),
        },
    }
}

pub fn prepare_temp_dir() -> Result<std::path::PathBuf, String> {
    let base = std::env::temp_dir();
    let id = uuid::Uuid::new_v4();
    let dir = base.join(format!("burnt-{}", id));
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;
    Ok(dir)
}

pub fn cleanup_temp_dir(dir: &Path) {
    let _ = std::fs::remove_dir_all(dir);
}
