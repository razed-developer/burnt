# Project Preferences

## Workflow

- Development branch: `fresh-start` unless explicitly changed.
- Keep commits focused and understandable.
- Push source changes to GitHub after a coherent subphase is ready for local testing.
- The user will pull/build/run/test on their Windows PC and report results.
- Do not rely on GitHub Actions for normal builds, tests, packaging, or releases.
- Be explicit about what was only inspected/compiled versus what was actually hardware tested.

## Technical direction

- Tauri v2 + React + Vite + TypeScript.
- Keep dependencies modest and purposeful.
- Compartmentalize code early so later work can target a subsystem without reading the entire project.
- Preserve the native C++ IMAPI2 reference implementation rather than prematurely porting it to Rust.
- Portable Windows operation is a first-class requirement.

## Product direction

- Burnt should feel extremely simple to use even though the implementation underneath is technical.
- Avoid feature creep in v1.
- Avoid heavy rounded-card UI and unnecessary decorative chrome.
- Prefer a clean modern interface with strong hierarchy and straightforward controls.
