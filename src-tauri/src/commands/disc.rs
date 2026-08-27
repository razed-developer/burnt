use serde::{Deserialize, Serialize};

use crate::disc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveResponse {
    pub name: String,
    pub path: String,
    pub can_write_cd: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaResponse {
    pub has_media: bool,
    pub is_blank: bool,
    pub is_writable: bool,
    pub capacity_minutes: u32,
    pub media_type: Option<String>,
    pub disc_state: String,
    pub drive_name: Option<String>,
    pub drive_path: Option<String>,
}

#[tauri::command]
pub fn detect_drives() -> Vec<DriveResponse> {
    disc::detect_drives()
        .into_iter()
        .map(|d| DriveResponse {
            name: d.name,
            path: d.path,
            can_write_cd: d.can_write_cd,
        })
        .collect()
}

#[tauri::command]
pub fn inspect_media(drive_path: String) -> MediaResponse {
    let info = disc::inspect_media(&drive_path);

    let drives = disc::detect_drives();
    let drive = drives.iter().find(|d| d.path == drive_path);

    MediaResponse {
        has_media: info.has_media,
        is_blank: info.is_blank,
        is_writable: info.is_writable,
        capacity_minutes: info.capacity_minutes,
        media_type: info.media_type,
        disc_state: match info.disc_state {
            disc::DiscState::NoDrive => "no-drive",
            disc::DiscState::NoMedia => "no-media",
            disc::DiscState::Blank => "blank",
            disc::DiscState::NotBlank => "not-blank",
            disc::DiscState::NotWritable => "not-writable",
            disc::DiscState::Unknown => "unknown",
        }
        .to_string(),
        drive_name: drive.map(|d| d.name.clone()),
        drive_path: Some(drive_path),
    }
}

#[tauri::command]
pub fn get_disc_info() -> MediaResponse {
    let drives = disc::detect_drives();
    eprintln!("[cmd] get_disc_info: detected {} drives", drives.len());

    if drives.is_empty() {
        return MediaResponse {
            has_media: false,
            is_blank: false,
            is_writable: false,
            capacity_minutes: 80,
            media_type: None,
            disc_state: "no-drive".to_string(),
            drive_name: None,
            drive_path: None,
        };
    }

    let drive = &drives[0];
    eprintln!("[cmd] inspecting drive: {} ({})", drive.name, drive.path);
    let info = disc::inspect_media(&drive.path);
    eprintln!("[cmd] disc state: {:?}", info.disc_state);

    MediaResponse {
        has_media: info.has_media,
        is_blank: info.is_blank,
        is_writable: info.is_writable,
        capacity_minutes: info.capacity_minutes,
        media_type: info.media_type,
        disc_state: match info.disc_state {
            disc::DiscState::NoDrive => "no-drive",
            disc::DiscState::NoMedia => "no-media",
            disc::DiscState::Blank => "blank",
            disc::DiscState::NotBlank => "not-blank",
            disc::DiscState::NotWritable => "not-writable",
            disc::DiscState::Unknown => "unknown",
        }
        .to_string(),
        drive_name: Some(drive.name.clone()),
        drive_path: Some(drive.path.clone()),
    }
}
