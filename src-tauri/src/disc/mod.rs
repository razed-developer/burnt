use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveInfo {
    pub name: String,
    pub path: String,
    pub can_write_cd: bool,
    pub is_writable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaInfo {
    pub has_media: bool,
    pub is_blank: bool,
    pub is_writable: bool,
    pub capacity_minutes: u32,
    pub media_type: Option<String>,
    pub disc_state: DiscState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DiscState {
    NoDrive,
    NoMedia,
    Blank,
    NotBlank,
    NotWritable,
    Unknown,
}

impl Default for MediaInfo {
    fn default() -> Self {
        Self {
            has_media: false,
            is_blank: false,
            is_writable: false,
            capacity_minutes: 80,
            media_type: None,
            disc_state: DiscState::NoMedia,
        }
    }
}

mod platform;

pub fn detect_drives() -> Vec<DriveInfo> {
    platform::detect_drives()
}

pub fn inspect_media(drive_path: &str) -> MediaInfo {
    platform::inspect_media(drive_path)
}
