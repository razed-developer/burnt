use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::Duration;

use super::{BurnOptions, BurnProgress, BurnTrack};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn find_cdrdao() -> Result<String, String> {
    crate::process::find_tool("cdrdao")
        .ok_or_else(|| "cdrdao not found. Install it:\n  Windows: install from https://github.com/cdrdao/cdrdao\n  Linux: sudo apt install cdrdao".into())
}

pub fn burn(
    options: &BurnOptions,
    tx: mpsc::Sender<BurnProgress>,
) -> Result<(), String> {
    let cdrdao_path = find_cdrdao()?;
    eprintln!("[burn] cdrdao resolved to: {}", cdrdao_path);
    eprintln!("[burn] exe dir: {}", std::env::current_exe()
        .map(|p| p.parent().map(|d| d.to_string_lossy().to_string()).unwrap_or_default())
        .unwrap_or_default());
    eprintln!("[burn] working dir: {}", std::env::current_dir()
        .map(|d| d.to_string_lossy().to_string())
        .unwrap_or_default());
    eprintln!("[burn] PATH: {}", std::env::var("PATH").unwrap_or_default());

    let temp_dir = super::generate_temp_dir()?;
    let toc_path = temp_dir.join("disc.toc");

    let _ = tx.send(BurnProgress::Stage {
        stage: "preparing".into(),
    });

    // Decode every source track to a CD-DA WAV. cdrdao requires uncompressed
    // PCM (it cannot decode MP3/FLAC/etc.), as does the Windows IMAPI2 path.
    let prepared = super::prepare::convert_all(options, &temp_dir)?;
    let total_tracks = prepared.len() as u32;

    let converted_tracks: Vec<BurnTrack> = prepared
        .iter()
        .map(super::prepare::as_burn_track)
        .collect();

    eprintln!("[burn] all {} tracks converted to CD-DA WAV", total_tracks);

    if let Err(e) = super::toc::generate_toc(&converted_tracks, &options.cd_title, &options.catalog, &toc_path) {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err(e);
    }

    let _ = tx.send(BurnProgress::Stage {
        stage: "burning".into(),
    });

    let mut args = vec![
        "write".to_string(),
        "--device".to_string(),
        options.drive_path.clone(),
        "--speed".to_string(),
        options.speed.to_string(),
    ];

    if options.simulate {
        args.push("--simulate".to_string());
    }

    if !options.eject {
        args.push("--eject".to_string());
        args.push("no".to_string());
    }

    args.push(toc_path.to_string_lossy().to_string());

    eprintln!("[burn] running: cdrdao {}", args.join(" "));
    eprintln!("[burn] toc file: {}", toc_path.to_string_lossy());

    let mut cmd = Command::new(&cdrdao_path);
    cmd.args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    // Set working directory to the temp burn dir so cdrdao resolves the
    // relative WAV paths in the TOC. DLLs are found via ensure_dll_dirs()
    // (AddDllDirectory at startup), so we don't need the exe dir here.
    cmd.current_dir(&temp_dir);
    eprintln!("[burn] child working dir: {}", temp_dir.display());

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[burn] FAILED to spawn cdrdao: {}", e);
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err(format!("Failed to start cdrdao: {}", e));
        }
    };

    let stderr = match child.stderr.take() {
        Some(s) => s,
        None => {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err("Failed to capture cdrdao output".into());
        }
    };
    let reader = BufReader::new(stderr);

    let mut current_track: u32 = 0;
    let mut stderr_log = Vec::new();

    for line in reader.lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };

        eprintln!("[burn] cdrdao: {}", line);
        stderr_log.push(line.clone());

        if let Some(parsed) = parse_cdrdao_line(&line, total_tracks, &mut current_track) {
            let _ = tx.send(parsed);
        }
    }

    let status = match child.wait() {
        Ok(s) => s,
        Err(e) => {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err(format!("Failed to wait for cdrdao: {}", e));
        }
    };

    eprintln!("[burn] cdrdao exited with code: {:?}", status.code());
    if stderr_log.is_empty() {
        eprintln!("[burn] cdrdao produced no stderr output");
    }

    let _ = std::fs::remove_dir_all(&temp_dir);

    if status.success() {
        let _ = tx.send(BurnProgress::Stage {
            stage: "finalizing".into(),
        });
        std::thread::sleep(Duration::from_secs(2));
        let _ = tx.send(BurnProgress::Done);
        Ok(())
    } else {
        let (msg, details) = interpret_burn_failure(status.code(), &stderr_log);
        let _ = tx.send(BurnProgress::Error {
            message: msg,
            details,
        });
        Ok(())
    }
}

fn parse_cdrdao_line(
    line: &str,
    total_tracks: u32,
    current_track: &mut u32,
) -> Option<BurnProgress> {
    let lower = line.to_lowercase();

    if lower.contains("writing") && lower.contains("track") {
        if let Some(track_num) = extract_track_number(line) {
            if track_num != *current_track {
                *current_track = track_num;
                return Some(BurnProgress::TrackWriting {
                    track: track_num,
                    total: total_tracks,
                });
            }
        }
    }

    if let Some(pct) = extract_percent(line) {
        return Some(BurnProgress::Percent { value: pct });
    }

    if lower.contains("finalize") || lower.contains("closing") {
        return Some(BurnProgress::Stage {
            stage: "finalizing".into(),
        });
    }

    if lower.contains("error") || lower.contains("failed") {
        return Some(BurnProgress::Error {
            message: "The disc could not be written.".into(),
            details: line.trim().to_string(),
        });
    }

    None
}

fn extract_track_number(line: &str) -> Option<u32> {
    let lower = line.to_lowercase();
    let idx = lower.find("track")?;
    let rest = &line[idx + 5..].trim_start();
    let num_str: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
    num_str.parse().ok()
}

fn extract_percent(line: &str) -> Option<f64> {
    for word in line.split_whitespace() {
        if let Some(pct_str) = word.strip_suffix('%') {
            if let Ok(val) = pct_str.parse::<f64>() {
                if (0.0..=100.0).contains(&val) {
                    return Some(val);
                }
            }
        }
    }
    None
}

fn interpret_burn_failure(exit_code: Option<i32>, stderr: &[String]) -> (String, String) {
    let combined = stderr.join("\n").to_lowercase();
    let code = exit_code.unwrap_or(-1);

    if combined.contains("no disk") || combined.contains("no disc") || combined.contains("medium not found") {
        return (
            "No disc detected. Please insert a blank CD-R and try again.".into(),
            format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
        );
    }

    if combined.contains("power calibration") || combined.contains("power cal") {
        return (
            "The drive could not calibrate power for this disc. Try a different brand of CD-R or lower the burn speed.".into(),
            format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
        );
    }

    if combined.contains("cannot") && combined.contains("speed") {
        return (
            "The drive cannot write at the selected speed. Try Automatic or a lower speed.".into(),
            format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
        );
    }

    if combined.contains("permission denied") || combined.contains("access denied") {
        return (
            "Permission denied. On Linux, you may need to run with sudo or add yourself to the cdrom group.".into(),
            format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
        );
    }

    if combined.contains("busy") || combined.contains("device or resource busy") {
        return (
            "The drive is busy. Close any other disc software and try again.".into(),
            format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
        );
    }

    if combined.contains("read error") || combined.contains("i/o error") {
        return (
            "A read/write error occurred. The disc may be damaged. Try a new blank CD-R.".into(),
            format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
        );
    }

    (
        "The disc could not be written. The disc may be damaged or the drive reported an error.".into(),
        format!("cdrdao exited with code {}\n{}", code, stderr.join("\n")),
    )
}
