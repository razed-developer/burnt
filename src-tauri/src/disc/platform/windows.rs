use crate::disc::{DiscState, DriveInfo, MediaInfo};

pub fn detect_drives() -> Vec<DriveInfo> {
    let mut drives = Vec::new();

    let bitmask = unsafe { windows::Win32::Storage::FileSystem::GetLogicalDrives() };
    if bitmask == 0 {
        return drives;
    }

    for i in 0..26u32 {
        if bitmask & (1 << i) != 0 {
            let letter = (b'A' + i as u8) as char;
            let path = format!("{}\0", letter);
            let wide: Vec<u16> = path.encode_utf16().collect();

            let drive_type = unsafe {
                windows::Win32::Storage::FileSystem::GetDriveTypeW(
                    windows::core::PCWSTR::from_raw(wide.as_ptr()),
                )
            };

            // DRIVE_CDROM = 5
            if drive_type == 5 {
                let name = get_drive_name(i as u8);
                drives.push(DriveInfo {
                    name,
                    path: format!("{}:", letter),
                    can_write_cd: true,
                    is_writable: true,
                });
            }
        }
    }

    drives
}

fn get_drive_name(_drive_index: u8) -> String {
    "Optical Drive".to_string()
}

pub fn inspect_media(drive_path: &str) -> MediaInfo {
    let letter = match drive_path.chars().next() {
        Some(c) if c.is_ascii_alphabetic() => c.to_ascii_uppercase(),
        _ => {
            return MediaInfo {
                disc_state: DiscState::Unknown,
                ..Default::default()
            }
        }
    };

    // Try cdrdao for detailed media info
    if let Some(info) = try_cdao_inspect(letter) {
        return info;
    }

    // Fallback: try to open the drive to check if media is present
    let path = format!("\\\\.\\{}:\0", letter);
    let wide: Vec<u16> = path.encode_utf16().collect();

    let handle = unsafe {
        windows::Win32::Storage::FileSystem::CreateFileW(
            windows::core::PCWSTR::from_raw(wide.as_ptr()),
            0,
            windows::Win32::Storage::FileSystem::FILE_SHARE_READ
                | windows::Win32::Storage::FileSystem::FILE_SHARE_WRITE,
            None,
            windows::Win32::Storage::FileSystem::OPEN_EXISTING,
            windows::Win32::Storage::FileSystem::FILE_ATTRIBUTE_NORMAL,
            None,
        )
    };

    match handle {
        Ok(h) => {
            unsafe { windows::Win32::Foundation::CloseHandle(h).ok(); }
            MediaInfo {
                has_media: true,
                is_blank: true,
                is_writable: true,
                capacity_minutes: 80,
                media_type: Some("CD-R".to_string()),
                disc_state: DiscState::Blank,
            }
        }
        Err(_) => MediaInfo {
            has_media: false,
            disc_state: DiscState::NoMedia,
            ..Default::default()
        },
    }
}

fn try_cdao_inspect(letter: char) -> Option<MediaInfo> {
    let output = std::process::Command::new("cdrdao")
        .args(["disk-info", &format!("--device={}", letter)])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_cdao_disk_info(&stdout)
}

fn parse_cdao_disk_info(output: &str) -> Option<MediaInfo> {
    let mut has_media = false;
    let mut is_blank = false;
    let mut is_writable = false;
    let mut capacity_minutes = 80u32;

    for line in output.lines() {
        let trimmed = line.trim();

        if trimmed.contains("type:") || trimmed.contains("State:") {
            has_media = true;
        }

        if trimmed.contains("State:") {
            if trimmed.contains("empty") || trimmed.contains("Blank") {
                is_blank = true;
                is_writable = true;
            }
        }

        if trimmed.contains("CD-R") || trimmed.contains("CD-RW") {
            is_writable = true;
        }

        if trimmed.contains("Capacity") || trimmed.contains("Remaining") {
            if let Some(val) = extract_minutes(trimmed) {
                capacity_minutes = val;
            }
        }
    }

    if !has_media {
        return None;
    }

    Some(MediaInfo {
        has_media,
        is_blank,
        is_writable,
        capacity_minutes,
        media_type: if is_writable { Some("CD-R".to_string()) } else { None },
        disc_state: if is_blank { DiscState::Blank } else { DiscState::NotBlank },
    })
}

fn extract_minutes(line: &str) -> Option<u32> {
    for part in line.split_whitespace() {
        if let Ok(n) = part.parse::<u32>() {
            if n > 0 && n <= 99 {
                return Some(n);
            }
        }
    }
    None
}
