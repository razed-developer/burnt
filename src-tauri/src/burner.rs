use serde::Serialize;
use std::{path::{Path, PathBuf}, process::Command};
use tauri::Manager;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BurnResult { pub drive: Option<String>, pub message: String, pub log: Vec<String> }

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscInfo { pub state: String, pub label: String, pub drive: Option<String>, pub free_sectors: Option<u64> }

fn push_candidate(candidates: &mut Vec<PathBuf>, base: &Path, exe_name: &str) { candidates.push(base.join("tools").join("bin").join(exe_name)); candidates.push(base.join("bin").join(exe_name)); }
fn resolve_burner(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let exe_name = if cfg!(windows) { "burnt-burner.exe" } else { "burnt-burner" }; let mut candidates = Vec::new();
    if let Ok(resource_dir) = app.path().resource_dir() { push_candidate(&mut candidates, &resource_dir, exe_name); }
    if let Ok(exe) = std::env::current_exe() { if let Some(dir) = exe.parent() { for ancestor in dir.ancestors().take(6) { push_candidate(&mut candidates, ancestor, exe_name); } } }
    if let Ok(cwd) = std::env::current_dir() { push_candidate(&mut candidates, &cwd, exe_name); if let Some(parent) = cwd.parent() { push_candidate(&mut candidates, parent, exe_name); } }
    candidates.sort(); candidates.dedup(); candidates.into_iter().find(|path| path.is_file()).ok_or_else(|| "burnt-burner.exe was not found. Build native/windows/burnt-burner/build.bat first.".to_string())
}

pub fn inspect_disc(app: &tauri::AppHandle) -> Result<DiscInfo, String> {
    if !cfg!(windows) { return Ok(DiscInfo { state: "missing".into(), label: "Windows burner backend unavailable".into(), drive: None, free_sectors: None }); }
    let output = Command::new(resolve_burner(app)?).arg("status").output().map_err(|error| format!("Could not inspect the optical drive: {error}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout); let stderr = String::from_utf8_lossy(&output.stderr);
    let mut drive = None; let mut free_sectors = None; let mut state = None; let mut label = None; let mut error = None;
    for line in stdout.lines().chain(stderr.lines()) { let line = line.trim(); if let Some(value) = line.strip_prefix("DRIVE|") { drive = Some(value.trim().to_string()); } else if let Some(value) = line.strip_prefix("SECTORS|") { free_sectors = value.trim().parse::<u64>().ok(); } else if let Some(value) = line.strip_prefix("DISC|") { let mut parts = value.splitn(2, '|'); state = parts.next().map(str::to_string); label = parts.next().map(str::to_string); } else if let Some(value) = line.strip_prefix("ERROR|") { error = Some(value.trim().to_string()); } }
    if !output.status.success() { return Err(error.unwrap_or_else(|| format!("Disc status helper exited with status {}", output.status))); }
    Ok(DiscInfo { state: state.unwrap_or_else(|| "missing".into()), label: label.unwrap_or_else(|| "Insert a blank writable CD".into()), drive, free_sectors })
}

pub fn burn_pcm_tracks(app: &tauri::AppHandle, pcm_paths: &[String]) -> Result<BurnResult, String> {
    if !cfg!(windows) { return Err("The physical burner backend is currently Windows-only.".to_string()); } if pcm_paths.is_empty() { return Err("No prepared tracks were supplied to the burner.".to_string()); }
    let output = Command::new(resolve_burner(app)?).arg("burn").args(pcm_paths).output().map_err(|error| format!("Could not start the Burnt burner helper: {error}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout); let stderr = String::from_utf8_lossy(&output.stderr); let mut drive = None; let mut complete = None; let mut error = None; let mut log = Vec::new();
    for line in stdout.lines().chain(stderr.lines()) { let line = line.trim(); if line.is_empty() { continue; } log.push(line.to_string()); if let Some(value) = line.strip_prefix("DRIVE|") { drive = Some(value.trim().to_string()); } if let Some(value) = line.strip_prefix("COMPLETE|") { complete = Some(value.trim().to_string()); } if let Some(value) = line.strip_prefix("ERROR|") { error = Some(value.trim().to_string()); } }
    if output.status.success() { Ok(BurnResult { drive, message: complete.unwrap_or_else(|| "Audio CD written successfully".to_string()), log }) } else { Err(error.unwrap_or_else(|| format!("Burner helper exited with status {}", output.status))) }
}
