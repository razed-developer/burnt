mod audio;
mod burner;

use audio::{cleanup_prepared_tracks, prepare_audio, probe_audio, AudioMetadata, PreparedTrack};
use burner::{burn_pcm_tracks, inspect_disc, BurnResult, DiscInfo};
use tauri::AppHandle;

#[tauri::command]
fn probe_audio_file(app: AppHandle, path: String) -> Result<AudioMetadata, String> { probe_audio(&app, &path) }
#[tauri::command]
fn prepare_audio_tracks(app: AppHandle, paths: Vec<String>) -> Result<Vec<PreparedTrack>, String> { prepare_audio(&app, &paths) }
#[tauri::command]
fn cleanup_audio_tracks(paths: Vec<String>) -> Result<(), String> { cleanup_prepared_tracks(&paths) }
#[tauri::command]
fn get_disc_status(app: AppHandle) -> Result<DiscInfo, String> { inspect_disc(&app) }
#[tauri::command]
fn burn_audio_cd(app: AppHandle, paths: Vec<String>) -> Result<BurnResult, String> { burn_pcm_tracks(&app, &paths) }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![probe_audio_file, prepare_audio_tracks, cleanup_audio_tracks, get_disc_status, burn_audio_cd])
        .run(tauri::generate_context!())
        .expect("error while running Burnt");
}
