use std::process::{Command, Stdio};
use std::time::Duration;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct ProcessOutput {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

pub fn run_tool(
    tool: &str,
    args: &[&str],
    timeout: Duration,
) -> Result<ProcessOutput, String> {
    let mut cmd = Command::new(tool);
    cmd.args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let child = cmd.spawn().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            format!("{} not found. Is it installed and on PATH?", tool)
        } else {
            format!("Failed to start {}: {}", tool, e)
        }
    })?;

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to read {} output: {}", tool, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let _ = timeout;

    Ok(ProcessOutput {
        exit_code: output.status.code().unwrap_or(-1),
        stdout,
        stderr,
    })
}

pub fn run_tool_with_stdin(
    tool: &str,
    args: &[&str],
    stdin_data: &[u8],
) -> Result<ProcessOutput, String> {
    let mut cmd = Command::new(tool);
    cmd.args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd.spawn().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            format!("{} not found. Is it installed and on PATH?", tool)
        } else {
            format!("Failed to start {}: {}", tool, e)
        }
    })?;

    if let Some(mut stdin) = child.stdin.take() {
        use std::io::Write;
        stdin
            .write_all(stdin_data)
            .map_err(|e| format!("Failed to write to {} stdin: {}", tool, e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to read {} output: {}", tool, e))?;

    Ok(ProcessOutput {
        exit_code: output.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

pub fn find_tool(name: &str) -> Option<String> {
    if cfg!(target_os = "windows") {
        find_tool_windows(name)
    } else {
        find_tool_unix(name)
    }
}

fn find_bundled(name: &str) -> Option<String> {
    // Check next to the application executable for bundled binaries
    let exe_dir = std::env::current_exe().ok()?;
    let dir = exe_dir.parent()?;

    let extensions = if cfg!(target_os = "windows") {
        &[".exe", ""][..]
    } else {
        &["", ""][..]
    };

    for ext in extensions {
        let candidate = dir.join(format!("{}{}", name, ext));
        if candidate.is_file() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }

    None
}

fn find_tool_windows(name: &str) -> Option<String> {
    // 1. Check bundled binaries (next to exe)
    if let Some(path) = find_bundled(name) {
        return Some(path);
    }

    // 2. Check PATH directly to avoid "could not determine if gui app" dialog
    let extensions = ["", ".exe", ".cmd", ".bat", ".com"];
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in path_var.split(';') {
            let dir = dir.trim();
            if dir.is_empty() {
                continue;
            }
            for ext in &extensions {
                let candidate = format!("{}\\{}{}", dir, name, ext);
                if std::path::Path::new(&candidate).is_file() {
                    return Some(candidate);
                }
            }
        }
    }

    None
}

fn find_tool_unix(name: &str) -> Option<String> {
    // 1. Check bundled binaries (next to exe)
    if let Some(path) = find_bundled(name) {
        return Some(path);
    }

    // 2. Check PATH via `which`
    let output = Command::new("which")
        .arg(name)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .ok()
        .filter(|o| o.status.success())?;

    String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()
        .map(|s| s.trim().to_string())
}
