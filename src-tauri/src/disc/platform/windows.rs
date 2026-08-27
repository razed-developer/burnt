// Windows disc/drive detection via IMAPI2.
//
// IMAPI2 is built into Windows (Vista+), so this removes the cdrdao dependency
// on Windows. cdrdao remains the Linux backend.

use crate::disc::{DiscState, DriveInfo, MediaInfo};
use windows::core::BSTR;
use windows::Win32::Foundation::VARIANT_TRUE;
use windows::Win32::Storage::Imapi::*;
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoUninitialize, SAFEARRAY, CLSCTX_ALL, COINIT_MULTITHREADED,
};
use windows::Win32::System::Ole::{
    SafeArrayAccessData, SafeArrayGetLBound, SafeArrayGetUBound, SafeArrayUnaccessData,
};

/// Initialise COM on the calling thread and run `f`, tearing COM down after.
/// Returns the fallback result if COM cannot be initialised.
fn with_com<T>(f: impl FnOnce() -> T) -> T {
    unsafe {
        let hr = CoInitializeEx(None, COINIT_MULTITHREADED);
        let result = if hr.is_ok() {
            f()
        } else {
            f()
        };
        CoUninitialize();
        result
    }
}

pub fn detect_drives() -> Vec<DriveInfo> {
    with_com(detect_drives_inner)
}

/// Enumerate optical recorders through IMAPI2 so we get a real drive name
/// (vendor + product) and its drive letters.
fn detect_drives_inner() -> Vec<DriveInfo> {
    let mut drives = Vec::new();

    // Enumerate optical recorders through IMAPI2 so we get a real drive name
    // (vendor + product) and its drive letters.
    let master: IDiscMaster2 =
        match unsafe { CoCreateInstance(&MsftDiscMaster2, None, CLSCTX_ALL) } {
            Ok(m) => m,
            Err(e) => {
                eprintln!("[disc] IMAPI2 master unavailable: {:?}", e);
                return fallback_logical_drives();
            }
        };

    let count = match unsafe { master.Count() } {
        Ok(c) => c as usize,
        Err(_) => return fallback_logical_drives(),
    };

    for i in 0..count {
        let device_path: BSTR = match unsafe { master.get_Item(i as i32) } {
            Ok(p) => p,
            Err(_) => continue,
        };
        let device_path = device_path.to_string();

        let rec: IDiscRecorder2 = match unsafe {
            CoCreateInstance(&MsftDiscRecorder2, None, CLSCTX_ALL)
        } {
            Ok(r) => r,
            Err(_) => continue,
        };
        if unsafe { rec.InitializeDiscRecorder(&BSTR::from(&device_path)) }.is_err() {
            continue;
        }

        // Build a readable name from VendorId + ProductId.
        let vendor = unsafe { rec.VendorId() }.ok();
        let product = unsafe { rec.ProductId() }.ok();
        let name = match (vendor, product) {
            (Some(v), Some(p)) => format!("{} {}", v.to_string().trim(), p.to_string().trim())
                .trim()
                .to_string(),
            (Some(v), None) => v.to_string().trim().to_string(),
            (None, Some(p)) => p.to_string().trim().to_string(),
            (None, None) => "Optical Drive".to_string(),
        };

        // Drive letters, if the drive currently has media mounted.
        let mut letters = String::new();
        if let Ok(paths) = unsafe { rec.VolumePathNames() } {
            letters = read_bstr_array(paths).join(",");
        }
        // DriveInfo.path expects a drive letter. Prefer a mounted letter;
        // otherwise fall back to the device path so the burn code can still
        // find it.
        let path = letters
            .split(',')
            .next()
            .map(|s| s.trim().trim_end_matches('\\').to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| device_path.clone());

        eprintln!(
            "[disc] drive: name={} path={} device={}",
            name, path, device_path
        );

        drives.push(DriveInfo {
            name,
            path,
            can_write_cd: true,
            is_writable: true,
        });
    }

    if drives.is_empty() {
        drives = fallback_logical_drives();
    }
    drives
}

/// Fallback that lists known CD-ROM drives via GetLogicalDrives when IMAPI2
/// enumeration is unavailable (e.g. no recorder present).
fn fallback_logical_drives() -> Vec<DriveInfo> {
    let mut drives = Vec::new();
    let bitmask = unsafe { windows::Win32::Storage::FileSystem::GetLogicalDrives() };
    if bitmask == 0 {
        return drives;
    }
    for i in 0..26u32 {
        if bitmask & (1 << i) != 0 {
            let letter = (b'A' + i as u8) as char;
            let path = format!("{}:\\\0", letter);
            let wide: Vec<u16> = path.encode_utf16().collect();
            let drive_type = unsafe {
                windows::Win32::Storage::FileSystem::GetDriveTypeW(
                    windows::core::PCWSTR::from_raw(wide.as_ptr()),
                )
            };
            // DRIVE_CDROM = 5
            if drive_type == 5 {
                drives.push(DriveInfo {
                    name: "Optical Drive".to_string(),
                    path: format!("{}:", letter),
                    can_write_cd: true,
                    is_writable: true,
                });
            }
        }
    }
    drives
}

pub fn inspect_media(drive_path: &str) -> MediaInfo {
    // Prefer IMAPI2 for accurate media state.
    if let Some(info) = with_com(|| try_imapi2_inspect(drive_path)) {
        return info;
    }

    // Fallback: try to open the drive to check if media is present.
    inspect_via_createfile(drive_path)
}

/// Resolve a drive letter (or device path) to an IDiscRecorder2 via IMAPI2.
fn recorder_for_path(drive_path: &str) -> Option<IDiscRecorder2> {
    let master: IDiscMaster2 =
        unsafe { CoCreateInstance(&MsftDiscMaster2, None, CLSCTX_ALL) }.ok()?;
    let count = unsafe { master.Count() }.ok()? as usize;

    let wanted = drive_path
        .trim()
        .trim_end_matches(':')
        .trim_end_matches('\\')
        .to_ascii_uppercase();

    for i in 0..count {
        let device_path: BSTR = unsafe { master.get_Item(i as i32) }.ok()?;
        let device_path_str = device_path.to_string();

        let rec: IDiscRecorder2 =
            unsafe { CoCreateInstance(&MsftDiscRecorder2, None, CLSCTX_ALL) }.ok()?;
        if unsafe { rec.InitializeDiscRecorder(&BSTR::from(&device_path_str)) }.is_err() {
            continue;
        }

        // Match by volume path (drive letter) or by device path.
        let path_match = device_path_str
            .trim()
            .trim_end_matches('\\')
            .eq_ignore_ascii_case(&wanted);
        if path_match {
            return Some(rec);
        }

        if let Ok(paths) = unsafe { rec.VolumePathNames() } {
            for l in read_bstr_array(paths) {
                let l = l.trim().trim_end_matches('\\').to_ascii_uppercase();
                if l == wanted {
                    return Some(rec);
                }
            }
        }
    }
    None
}

fn try_imapi2_inspect(drive_path: &str) -> Option<MediaInfo> {
    let rec = recorder_for_path(drive_path)?;
    let rec_name = unsafe { rec.ProductId() }
        .ok()
        .unwrap_or_default()
        .to_string();

    // Build a RawCD format object to inspect CD media.
    let format: IDiscFormat2RawCD =
        unsafe { CoCreateInstance(&MsftDiscFormat2RawCD, None, CLSCTX_ALL) }.ok()?;
    if unsafe { format.SetRecorder(&rec) }.is_err() {
        eprintln!("[disc] could not bind raw CD writer to recorder {}", rec_name);
        return None;
    }

    // Determine media type; UNKNOWN means no media present.
    let media_type_code = unsafe { format.CurrentPhysicalMediaType() }.ok()?;
    if media_type_code == IMAPI_MEDIA_TYPE_UNKNOWN {
        return Some(MediaInfo {
            has_media: false,
            disc_state: DiscState::NoMedia,
            ..Default::default()
        });
    }

    // Media is present. Establish a friendly type name.
    let media_type = match media_type_code.0 {
        1 => "CD-ROM".to_string(),
        2 => "CD-R".to_string(),
        3 => "CD-RW".to_string(),
        _ => "CD".to_string(),
    };

    // Blank?
    let is_blank = match unsafe { format.MediaPhysicallyBlank() } {
        Ok(v) => v == VARIANT_TRUE,
        Err(_) => false,
    };

    // A writable optical disc is one that is blank (CD-R/CD-RW) or an
    // erasable CD-RW. CD-ROM and other read-only media are not writable.
    let is_writable = is_blank || media_type_code.0 == 3 /* CD-RW */;

    // Capacity in minutes from leadout sectors (LBA).
    let mut capacity_minutes = 80u32;
    if let Ok(leadout) = unsafe { format.LastPossibleStartOfLeadout() } {
        let sectors = leadout as u64;
        // ~75 sectors per second (CD).
        let seconds = sectors.saturating_mul(1) / 75;
        let minutes = (seconds / 60).max(1).min(99) as u32;
        // For a blank disc the leadout reflects the full writable area.
        capacity_minutes = minutes.max(21); // 21 min = ~ typical audio minimum
    }
    // Harden: only trust a reasonable CD range.
    if !(20..=99).contains(&capacity_minutes) {
        capacity_minutes = 80;
    }

    eprintln!(
        "[disc] imapi2: name={} type={} blank={} writable={} capacity={}min",
        rec_name, media_type, is_blank, is_writable, capacity_minutes
    );

    let disc_state = if !is_writable {
        DiscState::NotWritable
    } else if is_blank {
        DiscState::Blank
    } else {
        DiscState::NotBlank
    };

    Some(MediaInfo {
        has_media: true,
        is_blank,
        is_writable,
        capacity_minutes,
        media_type: Some(media_type),
        disc_state,
    })
}

fn inspect_via_createfile(drive_path: &str) -> MediaInfo {
    let letter = match drive_path.chars().next() {
        Some(c) if c.is_ascii_alphabetic() => c.to_ascii_uppercase(),
        _ => {
            return MediaInfo {
                disc_state: DiscState::Unknown,
                ..Default::default()
            }
        }
    };

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

/// Read a SAFEARRAY of BSTR into `Vec<String>`.
fn read_bstr_array(sa: *mut SAFEARRAY) -> Vec<String> {
    let mut out = Vec::new();
    if sa.is_null() {
        return out;
    }
    unsafe {
        let lb = match SafeArrayGetLBound(sa, 1) {
            Ok(v) => v,
            Err(_) => return out,
        };
        let ub = match SafeArrayGetUBound(sa, 1) {
            Ok(v) => v,
            Err(_) => return out,
        };
        let mut data: *mut core::ffi::c_void = std::ptr::null_mut();
        if SafeArrayAccessData(sa, &mut data).is_err() {
            return out;
        }
        let elems = data as *mut BSTR;
        for i in lb..=ub {
            let b = &*elems.add((i - lb) as usize);
            out.push(b.to_string());
        }
        let _ = SafeArrayUnaccessData(sa);
    }
    out
}
