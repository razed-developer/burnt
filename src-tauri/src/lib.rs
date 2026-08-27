pub mod audio;
pub mod burn;
pub mod commands;
pub mod disc;
pub mod process;

pub mod error {
    use serde::Serialize;

    #[derive(Debug, thiserror::Error)]
    pub enum AppError {
        #[error("IO error: {0}")]
        Io(#[from] std::io::Error),
        #[error("{0}")]
        Custom(String),
    }

    impl Serialize for AppError {
        fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::Serializer,
        {
            serializer.serialize_str(&self.to_string())
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::audio::probe_audio_file,
            commands::audio::probe_audio_files,
            commands::audio::prepare_track,
            commands::disc::detect_drives,
            commands::disc::inspect_media,
            commands::disc::get_disc_info,
            commands::burn::start_burn,
            commands::burn::check_cdrdao,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
