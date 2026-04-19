# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.1] - 2026-04-20

### Added

- Added an expandable, host-native management flow with instant command creation, inline edit cards, drag-and-drop reordering support, and dedicated action icons.
- Added manifest marketplace metadata such as `publisher`, `homepage`, localized `nameKey`/`descriptionKey`, and schema v2 i18n payloads.
- Added `scripts/package-plugin.mjs` plus `npm run package` to build a sideload-ready folder at `dist/lite-slash-commands/`.
- Added self-test coverage for the new management layout, reorder helper, and shell UI action constraints.
- Added UI preview screenshots and packaging guidance to the English, Traditional Chinese, and Simplified Chinese READMEs.

### Changed

- Reshaped the slash command management page into a compact command stack that keeps editing inside the host-native surface instead of a separate settings card layout.
- Updated slash picker descriptors so the right-side label uses command descriptions while the lower description line stays empty.
- Refined locale copy across `en`, `zh-TW`, and `zh-CN`, including the menu label change from "Slash Commands" to "Shortcuts" / "快捷指令" / "快捷命令".
- Updated compatibility and permission metadata to the newer shell/storage namespaces and raised the supported host range to `>=2.5.6 <3.0.0`.
- Kept release packaging aligned with Cerebr sideload expectations by producing a folder-wrapped bundle.

### Fixed

- Fixed multiple slash command panel UX issues around expanded-row editing, import/export page duplication, and draft preservation during reorder actions.
- Removed the unused top-level SVG menu icon constant and cleaned up redundant menu icon wiring.

## [v0.1.0] - 2026-04-19

### Added

- Initial standalone release of the Cerebr `slash-commands` shell plugin with host-native slash picker integration.
- Added localized management UI, storage-backed custom command CRUD, import/export support, and `{{lang}}` placeholder expansion for seed prompts.
- Added `helpers/plugin-i18n.js`, locale JSON files, self-tests, and release workflows for CI plus GitHub tag-based packaging.
- Added release packaging that unwraps into a sideload-ready `lite-slash-commands/` folder for Cerebr developer mode.

[v0.1.1]: https://github.com/zeta987/cerebr-plugin-slash-commands/compare/v0.1.0...v0.1.1
[v0.1.0]: https://github.com/zeta987/cerebr-plugin-slash-commands/releases/tag/v0.1.0
