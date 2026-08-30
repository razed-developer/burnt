mod audio;
mod burner;

use audio::{cleanup_prepared_tracks, prepare_audio, probe_audio, AudioMetadata, PreparedTrack};
use burner::{burn_pcm_tracks, inspect_disc, BurnResult, DiscInfo};
use tauri::AppHandle;

#[tauri::command]
async fn probe_audio_file(app: AppHandle, path: String) -> Result<AudioMetadata, String> {
    tauri::async_runtime::spawn_blocking(move || probe_audio(&app, &path)).await.map_err(|e| format!("Audio probe task failed: {e}"))?
}
#[tauri::command]
async fn prepare_audio_tracks(app: AppHandle, paths: Vec<String>) -> Result<Vec<PreparedTrack>, String> {
    tauri::async_runtime::spawn_blocking(move || prepare_audio(&app, &paths)).await.map_err(|e| format!("Audio preparation task failed: {e}"))?
}
#[tauri::command]
async fn cleanup_audio_tracks(paths: Vec<String>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || cleanup_prepared_tracks(&paths)).await.map_err(|e| format!("Audio cleanup task failed: {e}"))?
}
#[tauri::command]
async fn get_disc_status(app: AppHandle) -> Result<DiscInfo, String> {
    tauri::async_runtime::spawn_blocking(move || inspect_disc(&app)).await.map_err(|e| format!("Disc status task failed: {e}"))?
}
#[tauri::command]
async fn burn_audio_cd(app: AppHandle, paths: Vec<String>) -> Result<BurnResult, String> {
    tauri::async_runtime::spawn_blocking(move || burn_pcm_tracks(&app, &paths)).await.map_err(|e| format!("Burner task failed: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![probe_audio_file, prepare_audio_tracks, cleanup_audio_tracks, get_disc_status, burn_audio_cd])
        .run(tauri::generate_context!())
        .expect("error while running Burnt");
}
