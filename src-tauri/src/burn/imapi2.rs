// Windows-native Audio CD burning via IMAPI2.
//
// This backend uses Microsoft's Image Mastering API v2 (built into Windows
// Vista and later) to write a Disc-At-Once audio CD. It replaces cdrdao on
// Windows only. Linux keeps using the cdrdao backend.

use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

use windows::core::{implement, BSTR};
use windows::Win32::Foundation::{
    E_ABORT, E_FAIL, E_NOTIMPL, VARIANT_BOOL, VARIANT_FALSE, VARIANT_TRUE,
};
use windows::Win32::Storage::Imapi::*;
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoUninitialize, IStream, CLSCTX_ALL, COINIT_MULTITHREADED,
    STATFLAG, STATSTG, STREAM_SEEK, STREAM_SEEK_END, STREAM_SEEK_SET,
};
use windows::Win32::System::Ole::{
    SafeArrayAccessData, SafeArrayGetLBound, SafeArrayGetUBound, SafeArrayUnaccessData,
};

use super::{BurnOptions, BurnProgress};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

pub fn burn(
    options: &BurnOptions,
    tx: Sender<BurnProgress>,
    cancel: Option<&Arc<AtomicBool>>,
) -> Result<(), String> {
    if options.tracks.is_empty() {
        return Err("No tracks to burn. Add audio files first.".into());
    }

    let _ = tx.send(BurnProgress::Stage {
        stage: "preparing".into(),
    });

    // Copy the cancellation handle out so the worker can share it.
    let cancel = match cancel {
        Some(f) => f.clone(),
        None => Arc::new(AtomicBool::new(false)),
    };

    let temp_dir = super::generate_temp_dir()?;
    let prepared = super::prepare::convert_all(options, &temp_dir)?;

    // Once the image has been built the WAV files are no longer needed, but
    // they are removed on every exit path below.
    let result = run_imapi_burn(options, &prepared, &tx, &cancel);
    let _ = std::fs::remove_dir_all(&temp_dir);
    result
}

fn run_imapi_burn(
    options: &BurnOptions,
    prepared: &[super::prepare::PreparedTrack],
    tx: &Sender<BurnProgress>,
    cancel: &Arc<AtomicBool>,
) -> Result<(), String> {
    // COM must be initialised on the thread that calls into IMAPI2.
    // CoInitializeEx returns a raw HRESULT. is_ok() covers both S_OK (0) and
    // S_FALSE (1, already initialised), which are both acceptable here.
    unsafe {
        let hr = CoInitializeEx(None, COINIT_MULTITHREADED);
        if !hr.is_ok() {
            return Err(format_hr(
                "Could not initialise Windows imaging API",
                windows::core::Error::from(hr),
            ));
        }
    }
    let _guard = CoUninitGuard;

    // 1. Find the recorder matching the requested drive.
    let recorder = select_recorder(&options.drive_path)?;
    eprintln!("[imapi] selected recorder: {}", recorder.device_path);

    // 2. Build the raw DAO-96 image (IRawCDImageCreator).
    let image = build_image(options, prepared)?;

    let tx = tx.clone();
    let cancel = cancel.clone();

    _ = tx.send(BurnProgress::Stage {
        stage: "burning".into(),
    });

    // 3. Create the format object and point it at the recorder.
    let format: IDiscFormat2RawCD =
        unsafe { CoCreateInstance(&MsftDiscFormat2RawCD, None, CLSCTX_ALL) }
            .map_err(|e| format_hr("Could not create the disc writer", e.into()))?;
    unsafe {
        format.SetRecorder(&recorder.recorder)
            .map_err(|e| format_hr("The drive could not be opened for writing", e.into()))?;
        format
            .SetClientName(&BSTR::from("Burnt"))
            .ok();
        format
            .SetRequestedSectorType(IMAPI_FORMAT2_RAW_CD_SUBCODE_IS_RAW)
            .ok();
    }

    // 4. Capability check: total image size vs. what the disc can hold.
    let needed = unsafe { image.creator.StartOfLeadout() }
        .map_err(|e| format_hr("Could not measure the disc image", e.into()))?;
    let available = unsafe { format.LastPossibleStartOfLeadout() }
        .unwrap_or(needed);
    eprintln!("[imapi] needed leadout={} available={}", needed, available);
    if needed > available {
        return Err(
            "The compilation is too long for this disc. Remove tracks or use a larger CD.".into(),
        );
    }

    // 5. Wrap the image stream to report progress and honour cancellation.
    let total_stream = |s: &IStream| -> u64 {
        unsafe {
            let mut st: STATSTG = std::mem::zeroed();
            if s.Stat(&mut st, STATFLAG(0)).is_ok() {
                st.cbSize
            } else {
                0
            }
        }
    };
    let total = total_stream(&image.stream);
    let progress = Arc::new(WriteState {
        bytes_read: AtomicU64::new(0),
        total,
        cancel: cancel.clone(),
        tx: Mutex::new(Some(tx.clone())),
        last_percent: AtomicU64::new(u64::MAX),
    });
    let wrapped: IStream = ProgressStream {
        inner: image.stream.clone(),
        state: progress.clone(),
    }
    .into();

    // 6. PrepareMedia locks the drive, WriteMedia writes, ReleaseMedia unlocks.
    unsafe {
        format
            .PrepareMedia()
            .map_err(|e| format_hr("Could not prepare the disc", e.into()))?;
    }

    let write_result = unsafe { format.WriteMedia(&wrapped) };

    // If the user cancelled, finalize cleanly with a dedicated message.
    if cancel.load(Ordering::SeqCst) {
        let _ = unsafe { format.CancelWrite() };
    }
    let _ = unsafe { format.ReleaseMedia() };

    if let Err(e) = write_result {
        if cancel.load(Ordering::SeqCst) {
            return Err("Burning was cancelled.".into());
        }
        return Err(format_hr("The disc could not be written", e.into()));
    }

    _ = tx.send(BurnProgress::Stage {
        stage: "finalizing".into(),
    });

    if options.eject {
        unsafe {
            recorder
                .recorder
                .EjectMedia()
                .map_err(|e| format_hr("The disc was written but could not be ejected", e.into()))?;
        }
    }

    _ = tx.send(BurnProgress::Done);
    Ok(())
}

// ---------------------------------------------------------------------------
// Recorder selection
// ---------------------------------------------------------------------------

struct Recorder {
    recorder: IDiscRecorder2,
    device_path: String,
}

/// Find the IMAPI2 recorder whose drive letter matches `options.drive_path`
/// (e.g. "E:"). When exactly one recorder exists, it is used regardless.
fn select_recorder(drive_path: &str) -> Result<Recorder, String> {
    let master: IDiscMaster2 =
        unsafe { CoCreateInstance(&MsftDiscMaster2, None, CLSCTX_ALL) }
            .map_err(|e| format_hr("Could not enumerate CD drives", e.into()))?;

    let count = unsafe { master.Count() }
        .map_err(|e| format_hr("Could not enumerate CD drives", e.into()))?;
    if count <= 0 {
        return Err("No CD burner was found on this computer.".into());
    }

    // Build the list of recorders and their drive letters.
    let mut candidates: Vec<(String, String)> = Vec::new(); // (device_path, joined drive letters)
    for i in 0..count {
        let device_path: BSTR = unsafe { master.get_Item(i) }
            .map_err(|e| format_hr("Could not read CD drive information", e.into()))?;
        let device_path = device_path.to_string();

        let rec: IDiscRecorder2 =
            unsafe { CoCreateInstance(&MsftDiscRecorder2, None, CLSCTX_ALL) }
                .map_err(|e| format_hr("Could not access a CD drive", e.into()))?;
        unsafe {
            rec.InitializeDiscRecorder(&BSTR::from(&device_path))
                .map_err(|e| format_hr("Could not access a CD drive", e.into()))?;
        }

        let mut letters = String::new();
        if let Ok(paths) = unsafe { rec.VolumePathNames() } {
            letters = read_bstr_array(paths).join(",");
        }

        eprintln!(
            "[imapi] drive: device={} paths={}",
            device_path,
            if letters.is_empty() { "(none)" } else { &letters }
        );
        candidates.push((device_path.clone(), letters));
    }

    let wanted = drive_path.trim().trim_end_matches(':').to_ascii_uppercase();

    // Prefer an exact drive-letter match.
    let mut best: Option<usize> = None;
    for (i, (_, letters)) in candidates.iter().enumerate() {
        if letters
            .split(',')
            .any(|l| l.trim().trim_end_matches('\\').eq_ignore_ascii_case(&wanted))
        {
            best = Some(i);
            break;
        }
    }

    // If no letter match, fall back to the only recorder present.
    if best.is_none() && count == 1 {
        best = Some(0);
    }

    let (device_path, _) = best
        .map(|i| candidates[i].clone())
        .ok_or_else(|| "The selected CD drive could not be found.".to_string())?;

    let recorder: IDiscRecorder2 =
        unsafe { CoCreateInstance(&MsftDiscRecorder2, None, CLSCTX_ALL) }
            .map_err(|e| format_hr("Could not access the CD drive", e.into()))?;
    unsafe {
        recorder
            .InitializeDiscRecorder(&BSTR::from(&device_path))
            .map_err(|e| format_hr("Could not access the CD drive", e.into()))?;
    }

    Ok(Recorder {
        recorder,
        device_path,
    })
}

/// Read a SAFEARRAY of BSTR into `Vec<String>`.
fn read_bstr_array(sa: *mut windows::Win32::System::Com::SAFEARRAY) -> Vec<String> {
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

// ---------------------------------------------------------------------------
// Image building (IRawCDImageCreator)
// ---------------------------------------------------------------------------

struct BuiltImage {
    /// The result image stream. This is what gets written to the disc.
    stream: IStream,
    /// The image creator, retained for size reads (leadout sector).
    creator: IRawCDImageCreator,
}

fn build_image(
    options: &BurnOptions,
    prepared: &[super::prepare::PreparedTrack],
) -> Result<BuiltImage, String> {
    let image: IRawCDImageCreator =
        unsafe { CoCreateInstance(&MsftRawCDImageCreator, None, CLSCTX_ALL) }
            .map_err(|e| format_hr("Could not prepare the disc image", e.into()))?;

    unsafe {
        image
            .SetResultingImageType(IMAPI_FORMAT2_RAW_CD_SUBCODE_IS_RAW)
            .map_err(|e| format_hr("This drive does not support raw audio recording", e.into()))?;
    }

    if !options.catalog.is_empty() {
        unsafe {
            image
                .SetMediaCatalogNumber(&BSTR::from(&options.catalog))
                .ok();
        }
    }

    let mut track_index: i32 = 0;
    for track in prepared {
        let stream = open_wav_stream(&track.abs_wav)
            .map_err(|msg| format!("Could not open '{}': {}", track.abs_wav.display(), msg))?;

        let idx = unsafe { image.AddTrack(IMAPI_CD_SECTOR_AUDIO, &stream) }
            .map_err(|e| format_hr("Could not add a track to the disc image", e.into()))?;
        track_index = idx;

        eprintln!(
            "[imapi] added track {} ({})",
            track.index,
            track.abs_wav.display()
        );
        let _ = stream; // retained, AddTrack read the stream synchronously
    }

    eprintln!("[imapi] total tracks in image: {}", track_index);

    // Freeze the image and obtain the stream that WriteMedia will consume.
    let stream = unsafe { image.CreateResultImage() }
        .map_err(|e| format_hr("Could not finalise the disc image", e.into()))?;

    Ok(BuiltImage {
        stream,
        creator: image,
    })
}

// ---------------------------------------------------------------------------
// Custom IStream over a std::fs::File (track sources)
// ---------------------------------------------------------------------------

#[implement(IStream)]
struct FileStream {
    file: Mutex<File>,
    pos: Mutex<u64>,
    len: u64,
}

fn open_wav_stream(path: &std::path::Path) -> Result<IStream, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let len = file
        .metadata()
        .map_err(|e| e.to_string())?
        .len();
    let _ = file.seek(SeekFrom::Start(0));
    let fs: IStream = FileStream {
        file: Mutex::new(file),
        pos: Mutex::new(0),
        len,
    }
    .into();
    Ok(fs)
}

impl windows::Win32::System::Com::ISequentialStream_Impl for FileStream_Impl {
    fn Read(
        &self,
        pv: *mut core::ffi::c_void,
        cb: u32,
        pcbread: *mut u32,
    ) -> windows::core::HRESULT {
        let mut file = self.file.lock().unwrap();
        let mut pos = self.pos.lock().unwrap();
        let buf = unsafe { std::slice::from_raw_parts_mut(pv as *mut u8, cb as usize) };
        match file.read(buf) {
            Ok(n) => {
                *pos += n as u64;
                unsafe { *pcbread = n as u32 };
                windows::core::HRESULT(0)
            }
            Err(_) => {
                unsafe { *pcbread = 0 };
                E_FAIL
            }
        }
    }

    fn Write(
        &self,
        _pv: *const core::ffi::c_void,
        _cb: u32,
        _pcbwritten: *mut u32,
    ) -> windows::core::HRESULT {
        E_NOTIMPL
    }
}

impl windows::Win32::System::Com::IStream_Impl for FileStream_Impl {
    fn Seek(
        &self,
        dlibmove: i64,
        dworigin: STREAM_SEEK,
        plibnewposition: *mut u64,
    ) -> windows::core::Result<()> {
        let mut file = self.file.lock().unwrap();
        let mut pos = self.pos.lock().unwrap();
        let base: i64 = match dworigin.0 {
            v if v == STREAM_SEEK_SET.0 => 0,
            v if v == STREAM_SEEK_END.0 => self.len as i64,
            _ => *pos as i64,
        };
        let newpos = (base + dlibmove).max(0) as u64;
        file.seek(SeekFrom::Start(newpos))
            .map_err(windows::core::Error::from)?;
        *pos = newpos;
        unsafe { *plibnewposition = newpos };
        Ok(())
    }

    fn SetSize(&self, _libnewsize: u64) -> windows::core::Result<()> {
        Err(windows::core::Error::from(E_NOTIMPL))
    }

    fn CopyTo(
        &self,
        _pstm: windows::core::Ref<'_, IStream>,
        _cb: u64,
        _pcbread: *mut u64,
        _pcbwritten: *mut u64,
    ) -> windows::core::Result<()> {
        Err(windows::core::Error::from(E_NOTIMPL))
    }

    fn Commit(&self, _grfcommitflags: &windows::Win32::System::Com::STGC)
    -> windows::core::Result<()> {
        Ok(())
    }

    fn Revert(&self) -> windows::core::Result<()> {
        Ok(())
    }

    fn LockRegion(
        &self,
        _liboffset: u64,
        _cb: u64,
        _dwlocktype: &windows::Win32::System::Com::LOCKTYPE,
    ) -> windows::core::Result<()> {
        Err(windows::core::Error::from(E_NOTIMPL))
    }

    fn UnlockRegion(
        &self,
        _liboffset: u64,
        _cb: u64,
        _dwlocktype: u32,
    ) -> windows::core::Result<()> {
        Err(windows::core::Error::from(E_NOTIMPL))
    }

    fn Stat(
        &self,
        pstatstg: *mut STATSTG,
        _grfstatflag: &STATFLAG,
    ) -> windows::core::Result<()> {
        unsafe {
            let s = &mut *pstatstg;
            s.cbSize = self.len;
            s.r#type = 2; // STGTY_STREAM
        }
        Ok(())
    }

    fn Clone(&self) -> windows::core::Result<IStream> {
        Err(windows::core::Error::from(E_NOTIMPL))
    }
}

// ---------------------------------------------------------------------------
// Progress / cancellation IStream wrapping the raw image
// ---------------------------------------------------------------------------

struct WriteState {
    bytes_read: AtomicU64,
    total: u64,
    cancel: Arc<AtomicBool>,
    tx: Mutex<Option<Sender<BurnProgress>>>,
    last_percent: AtomicU64,
}

#[implement(IStream)]
struct ProgressStream {
    inner: IStream,
    state: Arc<WriteState>,
}

impl ProgressStream {
    fn report(&self, position: u64) {
        let total = self.state.total;
        if total == 0 {
            return;
        }
        let pct = (position.min(total) as f64 / total as f64 * 100.0) as u64;
        let last = self.state.last_percent.load(Ordering::Relaxed);
        if pct != last {
            self.state.last_percent.store(pct, Ordering::Relaxed);
            if let Ok(tx) = self.state.tx.lock() {
                if let Some(tx) = tx.as_ref() {
                    let _ = tx.send(BurnProgress::Percent {
                        value: pct as f64,
                    });
                }
            }
        }
    }
}

impl windows::Win32::System::Com::ISequentialStream_Impl for ProgressStream_Impl {
    fn Read(
        &self,
        pv: *mut core::ffi::c_void,
        cb: u32,
        pcbread: *mut u32,
    ) -> windows::core::HRESULT {
        if self.state.cancel.load(Ordering::SeqCst) {
            return E_ABORT;
        }
        let mut read: u32 = 0;
        let hr = unsafe { self.inner.Read(pv, cb, Some(&mut read)) };
        // Report progress based on how much has been consumed from the image.
        self.state.bytes_read.fetch_add(read as u64, Ordering::Relaxed);
        let position = self.state.bytes_read.load(Ordering::Relaxed);
        self.report(position);
        unsafe { *pcbread = read };
        hr
    }

    fn Write(
        &self,
        _pv: *const core::ffi::c_void,
        _cb: u32,
        _pcbwritten: *mut u32,
    ) -> windows::core::HRESULT {
        E_NOTIMPL
    }
}

impl windows::Win32::System::Com::IStream_Impl for ProgressStream_Impl {
    fn Seek(
        &self,
        dlibmove: i64,
        dworigin: STREAM_SEEK,
        plibnewposition: *mut u64,
    ) -> windows::core::Result<()> {
        // Track position so a seek can recompute reported progress.
        unsafe { self.inner.Seek(dlibmove, dworigin, Some(plibnewposition))? };
        let position = unsafe { *plibnewposition };
        self.state.bytes_read.store(position, Ordering::Relaxed);
        self.report(position);
        Ok(())
    }

    fn SetSize(&self, libnewsize: u64) -> windows::core::Result<()> {
        unsafe { self.inner.SetSize(libnewsize) }
    }

    fn CopyTo(
        &self,
        _pstm: windows::core::Ref<'_, IStream>,
        _cb: u64,
        _pcbread: *mut u64,
        _pcbwritten: *mut u64,
    ) -> windows::core::Result<()> {
        // Not used by the raw write path; avoid the Ref-to-Option<Interface>
        // forwarding that the binding expects in this version.
        Err(windows::core::Error::from(E_NOTIMPL))
    }

    fn Commit(&self, grfcommitflags: &windows::Win32::System::Com::STGC)
    -> windows::core::Result<()> {
        unsafe { self.inner.Commit(*grfcommitflags) }
    }

    fn Revert(&self) -> windows::core::Result<()> {
        unsafe { self.inner.Revert() }
    }

    fn LockRegion(
        &self,
        liboffset: u64,
        cb: u64,
        dwlocktype: &windows::Win32::System::Com::LOCKTYPE,
    ) -> windows::core::Result<()> {
        unsafe { self.inner.LockRegion(liboffset, cb, *dwlocktype) }
    }

    fn UnlockRegion(
        &self,
        liboffset: u64,
        cb: u64,
        dwlocktype: u32,
    ) -> windows::core::Result<()> {
        unsafe { self.inner.UnlockRegion(liboffset, cb, dwlocktype) }
    }

    fn Stat(&self, pstatstg: *mut STATSTG, grfstatflag: &STATFLAG) -> windows::core::Result<()> {
        unsafe { self.inner.Stat(pstatstg, *grfstatflag) }
    }

    fn Clone(&self) -> windows::core::Result<IStream> {
        Err(windows::core::Error::from(E_NOTIMPL))
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

struct CoUninitGuard;

impl Drop for CoUninitGuard {
    fn drop(&mut self) {
        unsafe { CoUninitialize() };
    }
}

#[allow(dead_code)]
fn bool_var(b: bool) -> VARIANT_BOOL {
    if b {
        VARIANT_TRUE
    } else {
        VARIANT_FALSE
    }
}

fn hr_code(e: &windows::core::Error) -> u32 {
    e.code().0 as u32
}

/// Translate an IMAPI2/COM error into a friendly, human-readable message.
pub fn format_hr(context: &str, e: windows::core::Error) -> String {
    let code = hr_code(&e);
    let technical = format!("{} (HRESULT {:#010x})", e.message(), code);

    let hint = match code {
        // 0x80070015: device not ready / 0x800702AA: data error
        0x80070015 => "The drive is not ready. Make sure a disc is inserted and the tray is closed.",
        0x800702aa => "The drive had trouble reading or writing the disc. It may be damaged or low quality.",
        // IMAPI_E_MEDIA_INVALIDATED (0xC0AA0303) and friends
        0xc0aa0202 => "No blank disc was detected. Insert a blank CD-R and try again.",
        0xc0aa0203 => "This disc is not blank and cannot be written over. Insert a blank CD-R.",
        0xc0aa0302 => "This disc is not writable. Insert a blank CD-R and try again.",
        0xc0aa0303 => "The disc was left in an incomplete state. Insert a blank disc and try again.",
        0xc0aa0201 => "The wrong media type is installed. Use a CD-R or CD-RW.",
        0xc0aa0304 => "The disc does not have enough space for this compilation.",
        0xc0aa0305 => "The media is write-protected. Remove the write protection or use another disc.",
        0x80070020 => "The drive is in use by another program. Close other disc software and try again.",
        0x80070005 => "Access was denied. You may need to run with more permissions, or the drive may be locked.",
        _ => "",
    };
    let _ = &technical;

    if hint.is_empty() {
        format!("{}\n\n{}", context, e.message())
    } else {
        format!("{}.\n\n{}", hint, context)
    }
}
