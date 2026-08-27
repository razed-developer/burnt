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
    let which = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    let output = Command::new(which)
        .arg("cdrdao")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to search for cdrdao: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        stdout
            .lines()
            .next()
            .map(|l| l.trim().to_string())
            .ok_or_else(|| "cdrdao found but path is empty".into())
    } else {
        Err("cdrdao not found. Install it:\n  Windows: install from https://github.com/cdrdao/cdrdao\n  Linux: sudo apt install cdrdao".into())
    }
}

pub fn burn(
    options: &BurnOptions,
    tx: mpsc::Sender<BurnProgress>,
) -> Result<(), String> {
    let cdrdao_path = find_cdrdao()?;

    let temp_dir = super::generate_temp_dir()?;
    let toc_path = temp_dir.join("disc.toc");

    let burn_tracks: Vec<BurnTrack> = options
        .tracks
        .iter()
        .enumerate()
        .map(|(i, t)| BurnTrack {
            index: (i + 1) as u32,
            title: t.title.clone(),
            artist: t.artist.clone(),
            path: t.path.clone(),
            duration_secs: t.duration_secs,
        })
        .collect();

    let _ = tx.send(BurnProgress::Stage {
        stage: "preparing".into(),
    });

    super::toc::generate_toc(&burn_tracks, &options.cd_title, &options.catalog, &toc_path)?;

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

    let mut cmd = Command::new(&cdrdao_path);
    cmd.args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start cdrdao: {}", e))?;

    let stderr = child.stderr.take().ok_or("Failed to capture cdrdao output")?;
    let reader = BufReader::new(stderr);

    let total_tracks = burn_tracks.len() as u32;
    let mut current_track: u32 = 0;

    for line in reader.lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };

        eprintln!("[burn] cdrdao: {}", line);

        if let Some(parsed) = parse_cdrdao_line(&line, total_tracks, &mut current_track) {
            let _ = tx.send(parsed);
        }
    }

    let status = child
        .wait()
        .map_err(|e| format!("Failed to wait for cdrdao: {}", e))?;

    let _ = std::fs::remove_dir_all(&temp_dir);

    if status.success() {
        let _ = tx.send(BurnProgress::Stage {
            stage: "finalizing".into(),
        });
        std::thread::sleep(Duration::from_secs(2));
        let _ = tx.send(BurnProgress::Done);
        Ok(())
    } else {
        let msg = "The disc could not be written. The disc may be damaged or the drive reported an error.".into();
        let details = format!("cdrdao exited with code {}", status.code().unwrap_or(-1));
        let _ = tx.send(BurnProgress::Error {
            message: msg,
            details,
        });
        Err("Burn failed".into())
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
