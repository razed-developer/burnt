pub mod cdrdao;
pub mod prepare;
pub mod toc;

#[cfg(target_os = "windows")]
pub mod imapi2;

use std::sync::mpsc::Sender;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnTrack {
    pub index: u32,
    pub title: String,
    pub artist: Option<String>,
    pub path: String,
    pub duration_secs: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnOptions {
    pub drive_path: String,
    pub cd_title: String,
    pub catalog: String,
    pub tracks: Vec<BurnTrack>,
    pub speed: u32,
    pub simulate: bool,
    pub eject: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum BurnProgress {
    #[serde(rename = "stage")]
    Stage { stage: String },
    #[serde(rename = "track")]
    TrackWriting { track: u32, total: u32 },
    #[serde(rename = "percent")]
    Percent { value: f64 },
    #[serde(rename = "done")]
    Done,
    #[serde(rename = "error")]
    Error { message: String, details: String },
}

pub fn generate_temp_dir() -> Result<std::path::PathBuf, String> {
    let base = std::env::temp_dir();
    let id = uuid::Uuid::new_v4();
    let dir = base.join(format!("burnt-burn-{}", id));
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;
    Ok(dir)
}

/// Platform-dispatched burn entry point. Windows uses the native IMAPI2
/// backend; all other platforms keep using cdrdao.
///
/// `cancel` is checked by the Windows backend during writing; when set, the
/// write is aborted cleanly.
pub fn burn(
    options: &BurnOptions,
    tx: Sender<BurnProgress>,
    cancel: Option<&std::sync::Arc<std::sync::atomic::AtomicBool>>,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return imapi2::burn(options, tx, cancel);
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = cancel;
        return cdrdao::burn(options, tx);
    }
}
