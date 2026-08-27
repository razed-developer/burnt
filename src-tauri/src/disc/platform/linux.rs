use crate::disc::{DiscState, DriveInfo, MediaInfo};

pub fn detect_drives() -> Vec<DriveInfo> {
    let mut drives = Vec::new();

    if let Ok(mut enumerator) = udev::Enumerator::new() {
        if enumerator.match_subsystem("block").is_ok()
            && enumerator.match_property("ID_CDROM", "1").is_ok()
        {
            if let Ok(device_list) = enumerator.scan_devices() {
                for device in device_list {
                    if let Some(devnode) = device.devnode() {
                        let path = devnode.to_string_lossy().to_string();
                        let name = get_device_name(&device);
                        let can_write = can_write_cd(&device);

                        drives.push(DriveInfo {
                            name,
                            path,
                            can_write_cd: can_write,
                            is_writable: can_write,
                        });
                    }
                }
            }
        }
    }

    if drives.is_empty() {
        check_legacy_paths(&mut drives);
    }

    drives
}

fn get_device_name(device: &udev::Device) -> String {
    let model = device
        .property_value("ID_MODEL")
        .map(|v| v.to_string_lossy().to_string());

    let vendor = device
        .property_value("ID_VENDOR")
        .map(|v| v.to_string_lossy().to_string());

    match (vendor, model) {
        (Some(v), Some(m)) => format!("{} {}", v, m),
        (Some(v), None) => v,
        (None, Some(m)) => m,
        None => "Optical Drive".to_string(),
    }
}

fn can_write_cd(device: &udev::Device) -> bool {
    device
        .property_value("ID_CDROM_CD_RW")
        .map(|v| v == "1")
        .unwrap_or(false)
        || device
            .property_value("ID_CDROM_CD_R")
            .map(|v| v == "1")
            .unwrap_or(false)
}

fn check_legacy_paths(drives: &mut Vec<DriveInfo>) {
    let legacy_paths = ["/dev/sr0", "/dev/cdrom", "/dev/dvd"];
    for path in &legacy_paths {
        if std::path::Path::new(path).exists() {
            let name = read_sysfs_model(path);
            drives.push(DriveInfo {
                name,
                path: path.to_string(),
                can_write_cd: true,
                is_writable: true,
            });
            break;
        }
    }
}

fn read_sysfs_model(dev_path: &str) -> String {
    let dev_name = match dev_path.rsplit('/').next() {
        Some(n) => n,
        None => return "Optical Drive".to_string(),
    };

    let model_path = format!("/sys/block/{}/device/model", dev_name);
    std::fs::read_to_string(&model_path)
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| "Optical Drive".to_string())
}

pub fn inspect_media(drive_path: &str) -> MediaInfo {
    let dev_name = match drive_path.rsplit('/').next() {
        Some(n) => n,
        None => {
            return MediaInfo {
                disc_state: DiscState::Unknown,
                ..Default::default()
            }
        }
    };

    let sys_path = format!("/sys/block/{}", dev_name);

    if !std::path::Path::new(&sys_path).exists() {
        return MediaInfo {
            disc_state: DiscState::NoMedia,
            ..Default::default()
        };
    }

    let has_media = check_media_present(dev_name);

    if !has_media {
        return MediaInfo {
            has_media: false,
            disc_state: DiscState::NoMedia,
            ..Default::default()
        };
    }

    let mut media = try_udev_media_info(drive_path);
    media.has_media = true;

    if media.disc_state == DiscState::Unknown {
        media.disc_state = if media.is_blank {
            DiscState::Blank
        } else {
            DiscState::NotBlank
        };
    }

    media
}

fn check_media_present(dev_name: &str) -> bool {
    let media_path = format!("/sys/block/{}/media", dev_name);
    if let Ok(val) = std::fs::read_to_string(&media_path) {
        let val = val.trim();
        return val == "1" || val == "loaded";
    }
    true
}

fn try_udev_media_info(drive_path: &str) -> MediaInfo {
    if let Ok(mut enumerator) = udev::Enumerator::new() {
        if enumerator.match_subsystem("block").is_ok() {
            if let Ok(devices) = enumerator.scan_devices() {
                for device in devices {
                    if let Some(devnode) = device.devnode() {
                        if devnode.to_string_lossy() == drive_path {
                            return parse_udev_device(&device);
                        }
                    }
                }
            }
        }
    }

    MediaInfo {
        has_media: true,
        is_blank: true,
        is_writable: true,
        capacity_minutes: 80,
        media_type: Some("CD-R".to_string()),
        disc_state: DiscState::Blank,
    }
}

fn parse_udev_device(device: &udev::Device) -> MediaInfo {
    let has_media = device
        .property_value("ID_CDROM_MEDIA")
        .map(|v| v == "1")
        .unwrap_or(false);

    if !has_media {
        return MediaInfo {
            has_media: false,
            disc_state: DiscState::NoMedia,
            ..Default::default()
        };
    }

    let state = device
        .property_value("ID_CDROM_MEDIA_STATE")
        .map(|v| v.to_string_lossy().to_string());

    let is_blank = state.as_deref() == Some("blank");

    let media_type = if is_blank {
        determine_blank_type(device)
    } else {
        Some("Data Disc".to_string())
    };

    MediaInfo {
        has_media: true,
        is_blank,
        is_writable: is_blank,
        capacity_minutes: 80,
        media_type,
        disc_state: if is_blank {
            DiscState::Blank
        } else {
            DiscState::NotBlank
        },
    }
}

fn determine_blank_type(device: &udev::Device) -> Option<String> {
    if device
        .property_value("ID_CDROM_MEDIA_CD_RW")
        .map(|v| v == "1")
        .unwrap_or(false)
    {
        Some("CD-RW".to_string())
    } else if device
        .property_value("ID_CDROM_MEDIA_CD_R")
        .map(|v| v == "1")
        .unwrap_or(false)
    {
        Some("CD-R".to_string())
    } else {
        Some("CD".to_string())
    }
}
