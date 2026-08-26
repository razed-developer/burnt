# AGENTS.md

## Working relationship

Kevin develops ideas by using working software. A functioning build is part of
the planning process, so do not require a complete upfront specification.

Translate Kevin's ideas into technical decisions and explain important
consequences in plain language. Do not require him to know programming terms.

## Before making changes

- Read `PROJECT.md` and `NEXT.md`.
- Inspect the existing repository and Git status.
- Understand what is already implemented before editing.
- Preserve unrelated work and existing user data.
- Identify requests that could affect architecture, stored data, or portability.
- Ask only when an unresolved choice would materially change the result.

## Preferred technology

Unless there is a strong reason to choose otherwise:

- Use React, Vite, and TypeScript for web applications.
- Use Tauri with React, Vite, and TypeScript for desktop applications.
- Prefer TypeScript over JavaScript.
- Keep the application lightweight.
- Avoid unnecessary dependencies.
- Organize and compartmentalize the code from the beginning.
- Do not allow files such as `App.tsx` to become oversized.
- Separate interface, application logic, storage, and platform-specific code.

## Desktop targets

Plan Tauri applications for:

- Windows installer
- Windows portable
- Linux installation
- Linux portable

Always include a proper application icon and required platform icon files.
Do not ship a Tauri application with the default icon.

## Design approach

Other applications may be used as references, but do not blindly copy them.
Identify what makes their workflow useful and look for a simpler or better
solution suited to this application.

A visual or working prototype may be used to help Kevin discover requirements.

## Authorization

This repository belongs to Kevin. Codex is authorized to inspect, edit, build,
test, commit, and push requested project work without repeatedly asking.

This does not authorize destructive operations, publishing private information,
or unrelated account and repository changes.

## Git and builds

- Prefer focused, understandable commits.
- Push completed source changes to the configured GitHub repository.
- Verify that the push succeeded.
- Report the branch and commit.
- Minimize GitHub Actions because Kevin normally builds locally.
- Do not commit generated build output unless the repository intentionally
  distributes binaries that way.
- Keep build and packaging output clearly organized.

## Verification

After changing the project:

- Run the relevant build, type checking, linting, and tests.
- Do not describe a successful build as proof that every feature works.
- Clearly identify anything that requires testing on Kevin's computer.
- Do not claim something was tested when it was only inspected.

## Completion report

Report:

- what changed;
- what remains unfinished;
- major files or areas changed;
- checks run and their results;
- manual testing Kevin should perform;
- known caveats;
- branch and pushed commit.

## Change labels

Interpret entries in `NEXT.md` as:

- `[BUG]` — Intended behaviour is broken.
- `[REQUIRED]` — Must be addressed in the current work.
- `[WANTED]` — Desired improvement; schedule deliberately.
- `[IDEA]` — Record and discuss; do not implement automatically.
- `[QUESTION]` — Discuss before making a decision.

Do not silently expand `[IDEA]` or `[QUESTION]` entries into implementation work.