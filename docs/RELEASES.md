# Update and release policy

## Current repository state

- `main` is the canonical source branch, and accepted changes reach it through reviewed pull requests after required checks pass.
- The current integration version is [`0.1.58`](../custom_components/nikas_climate/manifest.json); the current UI version is `1.4.29`.
- At the 2026-09-14 audit baseline, this repository had no Git tags or GitHub Releases. The README documents installation as a custom HACS integration.
- End-to-end acceptance that HACS exposes and installs the current `main` state was not performed by that audit. A merged commit is accepted source, not confirmed user delivery, until verification succeeds in the target Home Assistant installation.

## Approved future publication target

The approved target is **beta → user verification → stable**:

1. Merge a reviewed candidate to `main` only after repository, HACS and Hassfest checks pass.
2. Publish a beta from that exact commit, with the version derived from `custom_components/nikas_climate/manifest.json` rather than invented by automation.
3. Refresh the custom repository in HACS, install the beta, restart Home Assistant when required, and complete user verification on the real installation.
4. Verify Syncleo loss and recovery, installed-bundle identity, command feedback, focus, gestures, scrolling and title navigation on the target devices.
5. Promote only that verified commit and version to stable. Keep the preceding stable release immutable and available as the rollback target.

This is a publication target, not evidence that a beta or stable Release already exists. Publication automation, tags and Releases are outside this maintenance change.

## Rollback

Until the first stable release under the target model exists, rollback uses the previously accepted commit and the operator's Home Assistant backup. After adoption, the preceding stable release remains available and must not be deleted or retargeted.

The repository-specific target above is an approved future exception to the blanket no-Releases wording in the pinned [`NIKAS_SPECIALIZED_PANEL_UI_STANDARD.md`](NIKAS_SPECIALIZED_PANEL_UI_STANDARD.md). The pinned shared file remains unchanged until its central authority is reconciled; this policy does not claim that publication automation or a release channel already exists.
