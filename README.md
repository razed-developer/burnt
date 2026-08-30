# Burnt

A deliberately simple desktop application for making standard playable Audio CDs.

## Current state

The `fresh-start` branch contains the first Tauri v2 + React/Vite/TypeScript UI scaffold. Burning is not connected yet. Browser preview uses sample tracks and simulated disc status so the interface can be iterated without consuming blank discs.

The hardware-tested Windows IMAPI2 proof-of-concept is preserved under `reference/imapi-v3/`.

## Local development

Requirements:

- Node.js / npm
- Rust toolchain
- Tauri v2 Windows prerequisites (including WebView2 and MSVC build tools)

Then:

```powershell
npm install
npm run tauri dev
```

For a quick UI-only browser preview:

```powershell
npm run dev
```

Open `http://localhost:1420` if it does not open automatically.

## Current limitations

- Real track durations are not read yet; Tauri-selected files show `Duration pending` until ffprobe integration.
- Disc detection is simulated.
- Burn action is simulated.
- FFmpeg and the native burner helper are not yet bundled.

See `NEXT.md` for the active work queue.
