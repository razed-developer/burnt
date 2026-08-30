use serde::Serialize;
use std::{
    fs::{self, OpenOptions},
    io::{self, Write},
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use tauri::Manager;

const CD_SECTOR_BYTES: u64 = 2352;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn hidden_command(program: impl AsRef<std::ffi::OsStr>) -> Command {
    let mut command = Command::new(program);
    #[cfg(windows)]
    {
        command.creation_flags(CREATE_NO_WINDOW);
        command.show_window(0);
    }
    command
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioMetadata { pub duration_seconds: f64 }

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedTrack { pub source_path: String, pub pcm_path: String, pub duration_seconds: f64, pub bytes: u64, pub sectors: u64 }

fn push_tool_candidate(candidates: &mut Vec<PathBuf>, base: &Path, exe_name: &str) { candidates.push(base.join("tools").join("bin").join(exe_name)); candidates.push(base.join("bin").join(exe_name)); }
fn tool_candidates(app: &tauri::AppHandle, name: &str) -> Vec<PathBuf> {
    let exe_name = if cfg!(windows) { format!("{name}.exe") } else { name.to_string() }; let mut candidates = Vec::new();
    if let Ok(resource_dir) = app.path().resource_dir() { push_tool_candidate(&mut candidates, &resource_dir, &exe_name); }
    if let Ok(exe) = std::env::current_exe() { if let Some(dir) = exe.parent() { push_tool_candidate(&mut candidates, dir, &exe_name); for ancestor in dir.ancestors().take(6) { push_tool_candidate(&mut candidates, ancestor, &exe_name); } } }
    if let Ok(cwd) = std::env::current_dir() { push_tool_candidate(&mut candidates, &cwd, &exe_name); if let Some(parent) = cwd.parent() { push_tool_candidate(&mut candidates, parent, &exe_name); } }
    candidates.sort(); candidates.dedup(); candidates
}
fn resolve_tool(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> { let candidates=tool_candidates(app,name);if let Some(found)=candidates.iter().find(|path|path.is_file()){return Ok(found.clone());}let checked=candidates.iter().map(|path|path.display().to_string()).collect::<Vec<_>>().join("\n- ");Err(format!("{name} was not found. Put the portable executable in tools/bin. Checked:\n- {checked}")) }
fn parse_duration(stdout:&[u8])->Result<f64,String>{let text=String::from_utf8_lossy(stdout);let value=text.lines().map(str::trim).find(|line|!line.is_empty()).ok_or_else(||"ffprobe did not return a duration".to_string())?;let duration=value.parse::<f64>().map_err(|_|format!("Could not parse ffprobe duration: {value}"))?;if duration.is_finite()&&duration>=0.0{Ok(duration)}else{Err("ffprobe returned an invalid duration".to_string())}}
pub fn probe_audio(app:&tauri::AppHandle,source_path:&str)->Result<AudioMetadata,String>{let ffprobe=resolve_tool(app,"ffprobe")?;let output=hidden_command(ffprobe).args(["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",source_path]).output().map_err(|error|format!("Could not start ffprobe: {error}"))?;if !output.status.success(){let stderr=String::from_utf8_lossy(&output.stderr).trim().to_string();return Err(if stderr.is_empty(){"ffprobe could not inspect this audio file".to_string()}else{format!("ffprobe could not inspect this audio file: {stderr}")});}Ok(AudioMetadata{duration_seconds:parse_duration(&output.stdout)?})}
fn create_session_dir()->Result<PathBuf,String>{let stamp=SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error|format!("System clock error: {error}"))?.as_millis();let dir=std::env::temp_dir().join("Burnt").join(format!("session-{stamp}"));fs::create_dir_all(&dir).map_err(|error|format!("Could not create temporary audio folder: {error}"))?;Ok(dir)}
fn pad_to_cd_sector(path:&Path)->Result<(u64,u64),String>{let len=fs::metadata(path).map_err(|error|format!("Could not inspect prepared PCM: {error}"))?.len();let remainder=len%CD_SECTOR_BYTES;if remainder!=0{let padding=(CD_SECTOR_BYTES-remainder)as usize;let mut file=OpenOptions::new().append(true).open(path).map_err(|error|format!("Could not pad prepared PCM: {error}"))?;file.write_all(&vec![0u8;padding]).map_err(|error|format!("Could not pad prepared PCM: {error}"))?;}let bytes=fs::metadata(path).map_err(|error|format!("Could not verify prepared PCM: {error}"))?.len();Ok((bytes,bytes/CD_SECTOR_BYTES))}
pub fn prepare_audio(app:&tauri::AppHandle,source_paths:&[String])->Result<Vec<PreparedTrack>,String>{if source_paths.is_empty(){return Ok(Vec::new());}let ffmpeg=resolve_tool(app,"ffmpeg")?;let session_dir=create_session_dir()?;let result=(||{let mut prepared=Vec::with_capacity(source_paths.len());for(index,source_path)in source_paths.iter().enumerate(){let metadata=probe_audio(app,source_path)?;let pcm_path=session_dir.join(format!("track-{:02}.pcm",index+1));let output=hidden_command(&ffmpeg).args(["-v","error","-y","-i",source_path,"-vn","-ar","44100","-ac","2","-f","s16le"]).arg(&pcm_path).output().map_err(|error|format!("Could not start FFmpeg: {error}"))?;if !output.status.success(){let stderr=String::from_utf8_lossy(&output.stderr).trim().to_string();return Err(if stderr.is_empty(){format!("FFmpeg could not prepare track {}",index+1)}else{format!("FFmpeg could not prepare track {}: {stderr}")});}let(bytes,sectors)=pad_to_cd_sector(&pcm_path)?;prepared.push(PreparedTrack{source_path:source_path.clone(),pcm_path:pcm_path.display().to_string(),duration_seconds:metadata.duration_seconds,bytes,sectors});}Ok(prepared)})();if result.is_err(){let _=fs::remove_dir_all(&session_dir);}result}
pub fn cleanup_prepared_tracks(pcm_paths:&[String])->Result<(),String>{for pcm_path in pcm_paths{let path=PathBuf::from(pcm_path);match fs::remove_file(&path){Ok(())=>{},Err(error)if error.kind()==io::ErrorKind::NotFound=>{},Err(error)=>return Err(format!("Could not remove {}: {error}",path.display())),}if let Some(parent)=path.parent(){if parent.file_name().and_then(|name|name.to_str()).is_some_and(|name|name.starts_with("session-")){let _=fs::remove_dir(parent);}}}Ok(())}
