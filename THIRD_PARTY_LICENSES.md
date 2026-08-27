# Third-Party Licenses and Redistribution

This file tracks every third-party component we bundle or depend on for
distribution, and the obligations that come with each.

> Status: Preliminary. These entries reflect the Phase 0 plan. Before shipping
> a release, pin exact versions, copy the relevant license texts into
> `licenses/`, and confirm each redistribution obligation with the actual
> build we distribute.

We invoke external helpers as separate CLI processes ("arms-length" use). This
keeps our application code separate from their licenses, but distributing the
helper binaries with our application still carries redistribution obligations
(provide license text, offer source, attribution).

---

## Bundled / Distributed Executables

### FFmpeg / FFprobe

- Project: FFmpeg
- License: LGPL v2.1 or later by default; some optional parts are GPL v2+
  only when `--enable-gpl` is passed.
- Used for: audio metadata/probing (FFprobe) and decoding/conversion (FFmpeg).
- Redistribution: We intend to bundle an **LGPL** build so our application is
  not GPL-tainted. Invoking the binary does not make our app a derivative.
- Obligations:
  - Include the license text (`COPYING.LGPLv2.1`).
  - Provide/offer corresponding source for the FFmpeg build.
  - Attribution in an About/Licenses page.
  - Verify the bundled build reports `License: LGPL` and has no
    `--enable-gpl` / GPL-only codecs.

### cdrdao

- Project: cdrdao (DAO audio CD writer)
- License: GPL-2.0-or-later
- Status: **Not bundled / not used for V1.** The burning backend is
  Windows-native (IMAPI2/SPTI-MMC), so no cdrdao binary is distributed.
- If cdrdao is later adopted for the Linux backend via a distribution package,
  that is a system dependency rather than something we bundle, but its license
  implications would still be reviewed at that time.

---

## To be pinned before release

- Exact FFmpeg version and whether we bundle an LGPL build or rely on a system
  package per platform.

Record final decisions here and copy license texts into `licenses/`.
