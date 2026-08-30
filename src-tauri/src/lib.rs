mod audio;

use audio::{cleanup_prepared_tracks, prepare_audio, probe_audio, AudioMetadata, PreparedTrack};
use tauri::AppHandle;

#[tauri::command]
fn probe_audio_file(app: AppHandle, path: String) -> Result<AudioMetadata, String> {
    probe_audio(&app, &path)
}

#[tauri::command]
fn prepare_audio_tracks(app: AppHandle, paths: Vec<String>) -> Result<Vec<PreparedTrack>, String> {
    prepare_audio(&app, &paths)
}

#[tauri::command]
fn cleanup_audio_tracks(paths: Vec<String>) -> Result<(), String> {
    cleanup_prepared_tracks(&paths)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            probe_audio_file,
            prepare_audio_tracks,
            cleanup_audio_tracks
        ])
        .run(tauri::generate_context!())
        .expect("error while running Burnt");
}
