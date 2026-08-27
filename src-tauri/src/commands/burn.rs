use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, OnceLock};

use crate::burn;
use crate::burn::{BurnOptions, BurnProgress, BurnTrack};

/// Handle used to request cancellation of an in-progress burn.
fn cancel_flag() -> &'static Arc<AtomicBool> {
    static FLAG: OnceLock<Arc<AtomicBool>> = OnceLock::new();
    FLAG.get_or_init(|| Arc::new(AtomicBool::new(false)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnRequest {
    pub drive_path: String,
    pub cd_title: String,
    pub catalog: String,
    pub tracks: Vec<BurnTrackRequest>,
    pub speed: u32,
    pub simulate: bool,
    pub eject: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnTrackRequest {
    pub index: u32,
    pub title: String,
    pub artist: Option<String>,
    pub path: String,
    pub duration_secs: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnResponse {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub fn start_burn(request: BurnRequest, channel: tauri::ipc::Channel<BurnProgress>) -> BurnResponse {
    eprintln!("[cmd] start_burn called");

    let options = BurnOptions {
        drive_path: request.drive_path,
        cd_title: request.cd_title,
        catalog: request.catalog,
        tracks: request
            .tracks
            .into_iter()
            .map(|t| BurnTrack {
                index: t.index,
                title: t.title,
                artist: t.artist,
                path: t.path,
                duration_secs: t.duration_secs,
            })
            .collect(),
        speed: request.speed,
        simulate: request.simulate,
        eject: request.eject,
    };

    let (tx, rx) = mpsc::channel();
    let flag = cancel_flag().clone();
    flag.store(false, Ordering::SeqCst);

    std::thread::spawn(move || {
        // The IMAPI2 backend consults the shared cancel flag while writing so
        // a user can abort a running burn (see the `cancel_burn` command).
        let result = burn::burn(&options, tx.clone(), Some(&flag));
        if let Err(e) = result {
            eprintln!("[burn] burn failed: {}", e);
            let _ = tx.send(BurnProgress::Error {
                message: e.clone(),
                details: e,
            });
        }
        drop(tx);
    });

    let mut last_error: Option<String> = None;

    for progress in rx {
        match &progress {
            BurnProgress::Stage { stage } => {
                eprintln!("[burn] stage: {}", stage);
                let _ = channel.send(progress);
            }
            BurnProgress::TrackWriting { track, total } => {
                eprintln!("[burn] writing track {}/{}", track, total);
                let _ = channel.send(progress);
            }
            BurnProgress::Percent { value } => {
                eprintln!("[burn] progress: {:.0}%", value);
                let _ = channel.send(progress);
            }
            BurnProgress::Done => {
                eprintln!("[burn] done");
                let _ = channel.send(BurnProgress::Done);
                return BurnResponse {
                    success: true,
                    message: "Burn completed successfully".into(),
                };
            }
            BurnProgress::Error { message, details } => {
                eprintln!("[burn] error: {} - {}", message, details);
                last_error = Some(message.clone());
                let _ = channel.send(progress.clone());
            }
        }
    }

    BurnResponse {
        success: false,
        message: last_error.unwrap_or_else(|| "Burn failed unexpectedly".into()),
    }
}

#[tauri::command]
pub fn check_cdrdao() -> Result<String, String> {
    burn::cdrdao::find_cdrdao()
}

/// Request cancellation of a running burn. The Windows IMAPI2 backend aborts
/// the write on the next stream read after this flag is set.
#[tauri::command]
pub fn cancel_burn() -> bool {
    cancel_flag().store(true, Ordering::SeqCst);
    true
}
