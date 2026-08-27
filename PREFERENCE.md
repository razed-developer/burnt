# Preferences

Development and design preferences that persist across tasks.

## Simplicity

- The application does one thing: burn Audio CDs.
- Every feature must justify its existence by making CD burning easier.
- When in doubt, leave it out.

## Architecture

- Keep files compartmentalized and focused.
- Never put the entire application in a single file.
- Separate presentation, business logic, storage, and platform code.
- Maintain clear module boundaries.
- The UI should not know how a CD is burned.
- The burning backend should be replaceable without redesigning the frontend.

## Code Style

- TypeScript for frontend code, not JavaScript.
- Prefer explicit types over `any`.
- Prefer straightforward implementations over clever ones.
- Follow existing conventions in the codebase.
- No comments unless something is genuinely non-obvious.

## Dependencies

- Keep dependencies minimal and justified.
- Do not add a library when a simpler approach exists.
- Check what the project already uses before introducing new tools.

## Visual Design

- Clean, modern, uncluttered.
- Desktop utility, not a web page.
- Solid colours over gradients.
- Good spacing and clear hierarchy.
- Strong typography.
- Modest corner rounding.
- Excellent hover and focus states.
- No glassmorphism, no excessive animation, no bubble UI.

## Error Handling

- Translate technical errors into plain language.
- Always make technical details available for troubleshooting.
- Never lose the user's track list because of an error.
- Never crash when a file is invalid.

## Platform

- Windows and Linux are first-class targets.
- Portable mode works from day one.
- Platform-specific code stays in platform modules.
- No scattered `#[cfg]` in business logic.

## Build and Distribution

- No cloud CI/CD unless requested.
- Build scripts for common operations.
- Predictable release artifacts.
- No default Tauri icons in release builds.
