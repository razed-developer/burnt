use std::fmt::Write as _;
use std::path::Path;

use super::BurnTrack;

pub fn generate_toc(
    tracks: &[BurnTrack],
    cd_title: &str,
    catalog: &str,
    output_path: &Path,
) -> Result<(), String> {
    let mut toc = String::with_capacity(1024);

    writeln!(toc, "CD_DA").map_err(|e| e.to_string())?;

    if !catalog.is_empty() {
        writeln!(toc, "CATALOG \"{}\"", escape_cdtext(catalog)).map_err(|e| e.to_string())?;
    }

    if !cd_title.is_empty() {
        writeln!(toc).map_err(|e| e.to_string())?;
        writeln!(toc, "CD_TEXT {{").map_err(|e| e.to_string())?;
        writeln!(toc, "  LANGUAGE_MAP {{").map_err(|e| e.to_string())?;
        writeln!(toc, "    0 : EN").map_err(|e| e.to_string())?;
        writeln!(toc, "  }}").map_err(|e| e.to_string())?;
        writeln!(toc).map_err(|e| e.to_string())?;
        writeln!(toc, "  LANGUAGE 0 {{").map_err(|e| e.to_string())?;
        writeln!(toc, "    TITLE \"{}\"", escape_cdtext(cd_title)).map_err(|e| e.to_string())?;
        writeln!(toc, "  }}").map_err(|e| e.to_string())?;
        writeln!(toc, "}}").map_err(|e| e.to_string())?;
    }

    for track in tracks.iter() {
        writeln!(toc).map_err(|e| e.to_string())?;
        writeln!(toc, "TRACK AUDIO").map_err(|e| e.to_string())?;

        let has_text = !track.title.is_empty() || track.artist.is_some();
        if has_text {
            writeln!(toc, "CD_TEXT {{").map_err(|e| e.to_string())?;
            writeln!(toc, "  LANGUAGE 0 {{").map_err(|e| e.to_string())?;
            if !track.title.is_empty() {
                writeln!(toc, "    TITLE \"{}\"", escape_cdtext(&track.title))
                    .map_err(|e| e.to_string())?;
            }
            if let Some(ref artist) = track.artist {
                writeln!(toc, "    PERFORMER \"{}\"", escape_cdtext(artist))
                    .map_err(|e| e.to_string())?;
            }
            writeln!(toc, "  }}").map_err(|e| e.to_string())?;
            writeln!(toc, "}}").map_err(|e| e.to_string())?;
        }

        writeln!(toc, "  AUDIOFILE \"{}\" 0", escape_path(&track.path))
            .map_err(|e| e.to_string())?;
    }

    std::fs::write(output_path, &toc).map_err(|e| format!("Failed to write TOC file: {}", e))?;

    Ok(())
}

fn escape_cdtext(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\"")
}

fn escape_path(s: &str) -> String {
    s.replace('\\', "/")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_tracks() -> Vec<BurnTrack> {
        vec![
            BurnTrack {
                index: 1,
                title: "First Song".into(),
                artist: Some("Artist One".into()),
                path: "/tmp/track01.wav".into(),
                duration_secs: 240.0,
            },
            BurnTrack {
                index: 2,
                title: "Second Song".into(),
                artist: None,
                path: "/tmp/track02.wav".into(),
                duration_secs: 180.0,
            },
        ]
    }

    #[test]
    fn toc_starts_with_cd_da() {
        let dir = std::env::temp_dir().join(uuid::Uuid::new_v4().to_string());
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("test.toc");

        generate_toc(&sample_tracks(), "My Album", "1234567890123", &path).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.starts_with("CD_DA"));

        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn toc_includes_cd_text_and_catalog() {
        let dir = std::env::temp_dir().join(uuid::Uuid::new_v4().to_string());
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("test.toc");

        generate_toc(&sample_tracks(), "My Album", "1234567890123", &path).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("CATALOG \"1234567890123\""));
        assert!(content.contains("CD_TEXT"));
        assert!(content.contains("TITLE \"My Album\""));

        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn toc_has_track_entries() {
        let dir = std::env::temp_dir().join(uuid::Uuid::new_v4().to_string());
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("test.toc");

        generate_toc(&sample_tracks(), "", "", &path).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("TRACK AUDIO"));
        assert!(content.contains("AUDIOFILE"));
        assert!(content.contains("First Song"));
        assert!(content.contains("PERFORMER \"Artist One\""));

        std::fs::remove_dir_all(&dir).unwrap();
    }
}
