use serde::{Deserialize, Serialize};

use crate::process;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolStatus {
    pub name: String,
    pub available: bool,
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequirementsStatus {
    pub ffprobe: ToolStatus,
    pub ffmpeg: ToolStatus,
    pub cdrdao: ToolStatus,
    pub all_met: bool,
}

#[tauri::command]
pub fn check_requirements() -> RequirementsStatus {
    let ffprobe = check_tool("ffprobe");
    let ffmpeg = check_tool("ffmpeg");
    let cdrdao = check_tool("cdrdao");

    let all_met = ffprobe.available && ffmpeg.available && cdrdao.available;

    RequirementsStatus {
        ffprobe,
        ffmpeg,
        cdrdao,
        all_met,
    }
}

fn check_tool(name: &str) -> ToolStatus {
    match process::find_tool(name) {
        Some(path) => ToolStatus {
            name: name.to_string(),
            available: true,
            path: Some(path),
        },
        None => ToolStatus {
            name: name.to_string(),
            available: false,
            path: None,
        },
    }
}
