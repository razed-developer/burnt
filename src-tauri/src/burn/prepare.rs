use std::path::{Path, PathBuf};

use super::{BurnOptions, BurnTrack};

/// A track that has been decoded to a CD-DA WAV file in the burn temp dir.
#[derive(Debug, Clone)]
pub struct PreparedTrack {
    pub index: u32,
    pub title: String,
    pub artist: Option<String>,
    /// Absolute path to the converted 44.1k/16-bit/stereo PCM WAV file.
    pub abs_wav: PathBuf,
    /// Filename within the temp dir referenced by the cdrdao TOC.
    pub rel_name: String,
    pub duration_secs: f64,
}

/// Convert every source track to a CD-DA WAV in `temp_dir`.
///
/// On failure this removes the temp dir and returns a track-specific error.
pub fn convert_all(
    options: &BurnOptions,
    temp_dir: &Path,
) -> Result<Vec<PreparedTrack>, String> {
    let total = options.tracks.len() as u32;
    let mut prepared: Vec<PreparedTrack> = Vec::with_capacity(options.tracks.len());

    for (i, track) in options.tracks.iter().enumerate() {
        let rel_name = format!("track-{:03}.wav", i + 1);
        let wav_path = temp_dir.join(&rel_name);

        eprintln!(
            "[burn] converting track {}/{}: {} -> {}",
            i + 1,
            total,
            track.path,
            wav_path.display()
        );

        let result =
            crate::audio::conversion::convert_to_cdda(Path::new(&track.path), &wav_path);

        if !result.success {
            let _ = std::fs::remove_dir_all(temp_dir);
            let err_msg = result.error.unwrap_or_else(|| "Conversion failed".into());
            return Err(format!(
                "Failed to convert track {} ({}): {}",
                i + 1,
                track.title,
                err_msg
            ));
        }

        prepared.push(PreparedTrack {
            index: (i + 1) as u32,
            title: track.title.clone(),
            artist: track.artist.clone(),
            abs_wav: wav_path.clone(),
            rel_name,
            duration_secs: track.duration_secs,
        });
    }

    Ok(prepared)
}

/// Map a prepared track back onto the `BurnTrack` shape the TOC generator uses.
pub fn as_burn_track(prepared: &PreparedTrack) -> BurnTrack {
    BurnTrack {
        index: prepared.index,
        title: prepared.title.clone(),
        artist: prepared.artist.clone(),
        // Relative filename: cdrdao runs with CWD set to the temp dir.
        path: prepared.rel_name.clone(),
        duration_secs: prepared.duration_secs,
    }
}
