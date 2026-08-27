# Development Preferences

This file describes my general preferences for software projects and AI-assisted development.

These preferences should be followed throughout the project unless `PROJECT.md`, `NEXT.md`, or a direct instruction explicitly overrides them.

## Instruction Priority

When instructions conflict, use this priority:

1. My current/direct instruction
2. `NEXT.md`
3. `PROJECT.md`
4. `PREFERENCE.md`
5. Existing implementation assumptions

Do not ignore an explicit request because it conflicts with an older design decision.

---

# 1. Development Style

I develop software iteratively.

My typical workflow is:

1. Describe an idea or requested change.
2. Have the AI implement it.
3. Build and run the application locally.
4. Test it myself.
5. Report bugs, problems, and new ideas.
6. Iterate.

Design the project to support this workflow.

Do not assume that the initial specification is permanent. The application will evolve as I use it.

Prefer implementations that are easy to understand, modify, replace, and extend.

---

# 2. Implement vs. Discuss

Pay attention to the language I use.

If I clearly ask you to:

* implement
* add
* change
* fix
* remove
* proceed
* build

then make the requested change.

If I am exploring an idea with language such as:

* "What if..."
* "Could we..."
* "Would it make sense..."
* "I'm wondering..."
* "How difficult would..."
* "What do you think about..."

do not automatically treat the idea as an approved implementation.

Discuss it first.

If my intent is genuinely unclear and implementing the wrong interpretation would create substantial rework, ask a focused question.

Do not repeatedly ask for confirmation when my instruction is already clear.

---

# 3. Preserve Working Functionality

Do not casually rewrite working systems when implementing a new feature.

Before changing an existing subsystem:

1. Understand how it currently works.
2. Identify the smallest appropriate change.
3. Preserve unrelated functionality.
4. Test for regressions where practical.

Prefer focused changes over broad rewrites.

Large refactors are appropriate when there is a clear architectural reason, but explain why they are necessary.

---

# 4. Keep Code Compartmentalized

Code organization is extremely important.

Avoid large files containing unrelated responsibilities.

Do not allow files such as:

* `App.tsx`
* `main.rs`
* `commands.rs`
* `utils.ts`

to become dumping grounds for the entire application.

Split functionality into logical modules early.

For example:

```text
src/
├── components/
├── pages/
├── hooks/
├── services/
├── types/
└── utils/

src-tauri/src/
├── commands/
├── services/
├── storage/
├── platform/
└── error/
```

The exact structure should match the project.

Do not create folders merely for the sake of having folders, but create clear subsystem boundaries.

---

# 5. Optimize the Repository for AI-Assisted Development

The repository should be organized so an AI coding assistant can work efficiently without repeatedly reading the entire project.

A future task should normally require inspecting only the relevant subsystem.

For example:

> Fix track reordering.

should ideally direct the AI toward something like:

```text
src/components/TrackList/
```

rather than requiring inspection of the entire frontend.

Likewise:

> Fix optical-drive detection.

should primarily require something like:

```text
src-tauri/src/disc/
```

Keep related files together.

Use descriptive names.

Avoid hidden relationships between distant parts of the codebase.

---

# 6. Keep Source Files Reasonably Small

There is no arbitrary maximum line count, but files should have focused responsibilities.

If a file becomes difficult to understand without scrolling through many unrelated concerns, split it.

Prefer:

```text
disc/
├── backend.rs
├── drive.rs
├── media.rs
├── burn.rs
└── progress.rs
```

over:

```text
disc.rs
```

containing the entire subsystem.

Do not over-fragment simple code into dozens of tiny files either.

The goal is clarity.

---

# 7. Maintain Clear Architectural Boundaries

Separate:

* presentation
* application/business logic
* persistence
* operating-system integration
* external processes
* external APIs

The UI should not directly contain complicated system logic.

Platform-specific behavior should be isolated where practical.

External tools and services should be wrapped behind interfaces or service modules so they can be replaced later.

Avoid tight coupling.

---

# 8. Preferred Technology

For desktop applications, my preferred stack is generally:

* React
* TypeScript
* Vite
* Tauri v2
* Rust

Use this unless the project has a good reason to use something else.

For storage, prefer the simplest solution appropriate to the application.

Possible choices include:

* JSON
* SQLite
* PocketBase
* Appwrite

Do not introduce a database when a small JSON file is sufficient.

---

# 9. Portability

For desktop applications, portability is important.

When practical, design applications from the beginning to support both:

* installed mode
* portable mode

Do not treat portable operation as an afterthought.

A portable build should:

* run without installation
* keep its application-owned mutable data with the portable application where practical
* survive being moved to another directory
* avoid unnecessary registry dependencies
* use robust relative/resource paths
* avoid assuming the working directory
* avoid scattering files throughout the operating system

Document any unavoidable exceptions.

---

# 10. Windows Releases

When applicable, I generally want:

```text
Application-Setup.exe
Application-Portable.zip
```

The portable version should be genuinely portable.

Launching a GUI application must not leave:

* PowerShell
* Command Prompt
* terminal windows

open in the background.

Command-line helper programs should run invisibly unless their output is intentionally being shown for troubleshooting.

---

# 11. Linux Releases

When applicable, prefer:

```text
Application.AppImage
application.deb
```

RPM support can be added when useful.

AppImage is generally preferred for the portable Linux version.

Do not require the user to launch an ordinary desktop application with `sudo`.

Use appropriate Linux permission mechanisms when elevated access is genuinely necessary.

---

# 12. Local Builds

I generally build and test applications locally.

Do not assume GitHub Actions or other cloud CI/CD systems are required.

Prefer simple local build scripts and clear documentation.

Examples:

```powershell
.\scripts\build-windows.ps1
```

and:

```bash
./scripts/build-linux.sh
```

Automate repetitive build and packaging steps where practical.

A build script should clearly report:

* success or failure
* errors
* where the resulting files were created

---

# 13. Git and Repository Workflow

Use Git to preserve meaningful development checkpoints.

Make commits focused and understandable.

Avoid mixing large unrelated changes into a single commit when practical.

Do not commit:

* build artifacts
* temporary files
* caches
* secrets
* unnecessary generated files

unless the project specifically requires them.

Maintain an appropriate `.gitignore`.

When asked to push changes, make sure the project builds or clearly report anything preventing verification.

Do not claim a push succeeded unless it actually succeeded.

---

# 14. Documentation

Documentation is part of the project, not an afterthought.

Important decisions should not exist only in conversation history.

Maintain:

```text
README.md
PROJECT.md
PREFERENCE.md
NEXT.md
```

and project-specific documentation under:

```text
docs/
```

when useful.

---

# 15. PROJECT.md

`PROJECT.md` describes the application itself.

It should contain stable information such as:

* purpose
* target users
* core workflow
* requirements
* architecture
* supported platforms
* major features
* non-goals
* important technical decisions

Update it when the definition of the product changes.

Do not put temporary bug reports or short-term requests here.

---

# 16. NEXT.md

`NEXT.md` is the primary working queue.

Use it for:

* bugs I report
* requested changes
* improvements
* features I have approved
* things that need investigation
* next implementation steps

It should make it possible to resume development without searching through old conversations.

Keep it current.

Clearly distinguish between:

* confirmed work
* bugs
* ideas under consideration

Do not silently turn an unapproved idea into a committed feature.

---

# 17. README.md

Write `README.md` primarily to help me use and maintain the project.

Assume I may return to the repository months later and have forgotten how it works.

Explain:

* what the application does
* how to set up development
* how to run it
* how to build it
* how to create installers
* how to create portable builds
* important project directories
* required external dependencies
* where configuration/data is stored
* common troubleshooting steps
* how `PROJECT.md`, `PREFERENCE.md`, and `NEXT.md` should be used

Do not assume I will remember decisions made during development.

---

# 18. Visual Design Preferences

I prefer interfaces that are:

* clean
* modern
* practical
* easy to understand
* desktop-oriented
* visually distinctive without being distracting

Prefer:

* solid colours
* strong visual hierarchy
* good typography
* generous but efficient spacing
* clear borders where useful
* restrained shadows
* accessible contrast
* modest corner rounding
* obvious interactive states

Avoid:

* gradients
* excessive rounded corners
* excessive pill-shaped controls
* glassmorphism
* excessive animation
* huge empty spaces
* unnecessary cards
* dashboards for applications that do not need dashboards
* generic-looking AI-generated interfaces

Functionality and clarity come before decoration.

---

# 19. Colour

Prefer bold, solid colours rather than gradients.

A Pacific Northwest-inspired palette is often appropriate:

* blues
* greens
* earthy browns
* neutrals

Black text on white or very light backgrounds is preferred for light interfaces where appropriate.

Colour should have purpose.

Do not rely on colour alone to communicate state.

---

# 20. Desktop Applications Should Feel Like Desktop Applications

Do not make a desktop utility feel like a website unnecessarily.

Prefer:

* compact useful layouts
* keyboard shortcuts where appropriate
* drag and drop
* context menus where useful
* native file dialogs
* sensible window sizing
* desktop conventions

Avoid unnecessary:

* hamburger menus
* giant hero sections
* marketing-style layouts
* mobile-first navigation patterns

---

# 21. Keep Applications Simple

Do not add features merely because they are technically possible.

Protect the core purpose of the application.

When considering a feature, ask:

1. Does it help the application's primary purpose?
2. Does it make the common workflow easier?
3. Does it create ongoing complexity?
4. Is there a simpler solution?

Prefer a small application that does its job exceptionally well over a large application filled with marginal features.

---

# 22. Progressive Complexity

Keep advanced functionality out of the primary workflow.

If advanced controls are necessary, place them behind something such as:

```text
Advanced
```

or in Settings.

Good defaults should allow most users to ignore advanced configuration entirely.

---

# 23. Error Messages

User-facing errors should be understandable.

Do not expose technical errors as the primary message.

Instead of:

```text
Process exited with code 3.
```

prefer:

```text
The operation couldn't be completed.

The selected file could not be read.
```

Technical details should remain available for:

* troubleshooting
* logs
* bug reports

Separate technical errors from user-facing explanations.

---

# 24. Do Not Hide Problems

Do not silently swallow errors to make something appear functional.

If something:

* cannot be implemented
* cannot be tested
* is platform-dependent
* requires hardware
* requires user action
* remains uncertain

say so clearly.

Distinguish between:

* implemented
* compiled
* automatically tested
* manually tested
* hardware tested
* unverified

Never claim something works merely because the code looks correct.

---

# 25. Testing

After making changes, run the most relevant available checks.

Examples:

```text
npm run build
npm run lint
cargo check
cargo test
```

Do not repeatedly run expensive full builds when a smaller check is sufficient.

Before declaring a significant phase complete, perform an appropriate full build.

Fix errors introduced by your changes before stopping whenever possible.

---

# 26. Hardware-Dependent Features

When a project interacts with hardware, distinguish code-level verification from physical verification.

For example:

```text
✓ Compiles
✓ Device enumeration implemented
? Tested with physical hardware
```

Do not claim physical functionality was verified when no hardware test occurred.

Provide clear instructions for what I should test locally.

---

# 27. External Dependencies

Before adding a dependency, consider:

* Is it necessary?
* Is it maintained?
* Is it cross-platform?
* What is its license?
* Does it complicate portable builds?
* How large is it?
* Could existing dependencies already solve the problem?

Avoid dependency bloat.

Do not reinvent complicated functionality when a mature, appropriate library already exists.

---

# 28. Security

Treat:

* filenames
* paths
* URLs
* metadata
* external command output
* user-entered content

as untrusted.

When executing external programs, use structured arguments instead of constructing shell command strings.

Avoid command injection.

Never commit:

* API keys
* passwords
* access tokens
* private credentials

to the repository.

---

# 29. Performance

Applications should feel responsive.

Avoid:

* blocking the UI thread
* repeatedly scanning unchanged data
* rereading large datasets unnecessarily
* spawning excessive child processes
* expensive work during startup that could be deferred
* scanning entire libraries when checking only for new content would suffice

Cache or reuse information where appropriate, while ensuring caches can be invalidated correctly.

---

# 30. Background Work

Long-running operations should provide visible status.

Where appropriate show:

* what is happening
* progress
* current item
* completion
* understandable failure information

Do not leave the user wondering whether the application has frozen.

---

# 31. File and Folder Operations

Use native file/folder dialogs where appropriate.

Support drag and drop when it improves the workflow.

Never:

* delete user files unexpectedly
* modify source files unnecessarily
* overwrite files without appropriate warning
* assume a path exists
* assume a particular drive letter

Handle paths robustly across Windows and Linux.

---

# 32. Accessibility and Usability

Where practical:

* support keyboard navigation
* provide visible focus states
* use accessible labels
* maintain sufficient contrast
* provide useful tooltips for unfamiliar icons
* avoid icon-only controls when their meaning is unclear

The application should be understandable without needing documentation for ordinary tasks.

---

# 33. Icons

Desktop applications should have proper icons.

Do not ship release builds using default:

* Tauri
* Vite
* React

branding.

Provide appropriate icon sizes/formats for each target platform.

---

# 34. Refactoring

Refactor when it improves:

* maintainability
* reliability
* performance
* separation of concerns
* future development efficiency

Do not refactor simply because another implementation is aesthetically preferable.

If a substantial refactor is required, preserve behavior and explain the reason.

---

# 35. Avoid Premature Complexity

Do not introduce:

* microservices
* complex event buses
* unnecessary global state systems
* elaborate dependency injection
* unnecessary databases
* complicated plugin systems

unless the project genuinely benefits from them.

Prefer the simplest architecture that remains maintainable.

---

# 36. Platform-Specific Code

Where Windows and Linux require different implementations, isolate the differences.

Prefer:

```text
platform/
├── windows.rs
└── linux.rs
```

or equivalent organization.

Keep the application's common logic platform-independent.

---

# 37. Build for Future Modification

Assume requirements will change.

Avoid hardcoding things that are reasonably likely to become configurable.

However, do not turn every value into configuration pre-emptively.

Choose sensible boundaries.

---

# 38. Comments

Use comments to explain:

* why something unusual is necessary
* platform-specific workarounds
* non-obvious algorithms
* surprising API behavior
* decisions future developers may otherwise undo

Do not fill files with comments that merely repeat what obvious code does.

---

# 39. Naming

Use descriptive names.

Prefer:

```text
detect_optical_drives()
```

over:

```text
get_devices()
```

when the function specifically detects optical drives.

Names should make targeted repository searches effective.

---

# 40. AI Work Sessions

At the beginning of a substantial coding task:

1. Read `PROJECT.md`.
2. Read `PREFERENCE.md`.
3. Read `NEXT.md`.
4. Inspect the relevant architecture/documentation.
5. Inspect the relevant subsystem.
6. Avoid reading unrelated large sections of the repository unless needed.

Before finishing:

1. Run relevant checks.
2. Update documentation if architecture or behavior changed.
3. Update `NEXT.md`.
4. Clearly summarize what changed.
5. Identify anything that still requires my testing.

---

# 41. Context Efficiency

AI context and coding-agent usage are limited resources.

Work efficiently.

Do not repeatedly reread the entire repository.

Use:

* documentation
* directory structure
* descriptive filenames
* targeted searches
* focused modules

to find the relevant code.

If a subsystem has good documentation, read that before exploring every source file.

When making architectural changes, update documentation so future sessions benefit from the work already done.

---

# 42. When I Report Multiple Changes

When I provide several bugs or feature requests at once:

1. record them in `NEXT.md`
2. group related work where sensible
3. identify dependencies between requests
4. implement in a logical order
5. do not accidentally omit requests
6. report which items were completed and which remain

If one request cannot be completed, continue with unrelated requests when practical rather than abandoning the entire batch.

---

# 43. Preserve My Intent

Do not optimize away behavior I explicitly requested merely because another approach is more conventional.

If a request presents a genuine technical problem, explain the problem and recommend an alternative.

The application's design should reflect its intended use rather than blindly following generic software conventions.

---

# 44. Suggestions

Suggestions and constructive criticism are welcome.

If you identify:

* a usability problem
* architectural risk
* security issue
* simpler approach
* potential conflict
* feature that may cause problems later

point it out.

However, distinguish a **recommendation** from an **implemented decision**.

Do not add significant functionality solely because you suggested it.

---

# 45. Overall Goal

The goal is not merely to produce code that works today.

The goal is to create projects that are:

* pleasant to use
* visually polished
* straightforward to build
* easy to understand
* easy to modify
* portable where appropriate
* well documented
* resistant to feature creep
* efficient for AI-assisted iteration
* recoverable after months away from the project

When choosing between cleverness and clarity, prefer clarity.

When choosing between unnecessary complexity and a straightforward solution, prefer the straightforward solution.

## Multi-Agent Git Workflow

This repository may be modified by multiple coding agents.

- Treat the current working tree as authoritative.
- Existing changes may be intentional even if you did not create them.
- Never revert, reset, checkout, overwrite, or discard unfamiliar changes merely because they came from another agent.
- Inspect and understand existing changes before modifying overlapping code.
- Focus on whether the current implementation is correct, not which agent introduced it.
- Git history may be used to understand intent, but attribution is not a task unless explicitly requested.
- Continue from existing partially completed work whenever practical.
- Ask before performing destructive Git operations.
- Do not stop solely because the working tree is dirty.

When choosing between a giant interconnected implementation and clean subsystem boundaries, prefer clean subsystem boundaries.

Build software that both a human developer and a future AI coding assistant can understand.
