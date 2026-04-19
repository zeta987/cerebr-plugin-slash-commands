[English](./README.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)

# Cerebr Plugin: Slash Commands

A Cerebr shell plugin that gives you a quick-edit slash command menu. This repository is the standalone home for developing and maintaining it.

## Attribution

Originally created by [ZETA](https://github.com/zeta987), then substantially improved by [yym68686](https://github.com/yym68686).

## How it works

The plugin hands its command list to Cerebr's native slash picker through `shell.setSlashCommands()`. That means Cerebr owns everything you see and touch in the `/` menu — the UI, keyboard navigation, IME handling, and filtering — and stays the single source of truth for that experience.

What the plugin itself handles is the data and management layer: it keeps an editable list of commands (four are seeded by default), rewrites any `{{lang}}` token into the label for your current locale the moment you pick a command, and renders a management page inside Cerebr for creating, editing, resetting, importing, and exporting commands.

## UI preview

<img width="793" height="683" alt="Slash picker — English locale" src="https://github.com/user-attachments/assets/856df077-5429-4152-989f-6444f4f2fa04" />

<img width="1203" height="683" alt="Management page — English locale" src="https://github.com/user-attachments/assets/256f9b44-ebf5-41f4-b000-03690ad59e4e" />

## Browser support

The release zip packages the plugin for the Chrome build of Cerebr — i.e. the Cerebr extension running inside a Chromium-based browser. The plugin has only been tested on **Chrome** and **Brave**; other browsers (Firefox, Safari, Edge, Arc, etc.) are not verified and compatibility is not guaranteed.

## Install from a release

Cerebr's plugin manager only accepts folders, not zip archives. To install a packaged release:

1. Download `slash-commands-v*.*.*.zip` from the [latest release](../../releases/latest).
2. Unzip it — you'll get a `lite-slash-commands/` folder.
3. In Cerebr, open developer mode and sideload that unzipped folder.

Want the latest unreleased work? `git clone https://github.com/zeta987/cerebr-plugin-slash-commands.git` the repo and sideload its root directly.

## Repository layout

```text
slash-commands/
  plugin.json
  shell.js
  helpers/
  locales/
  seed-prompts.json
  scripts/
  dist/                        # optional local build output, gitignored
```

## Where to edit

Everything that ships with the plugin lives at the repo root. Edit these directly:

- `plugin.json`
- `shell.js`
- `helpers/`
- `locales/`
- `seed-prompts.json`

You can point Cerebr's developer-mode sideload straight at the repo root. The `dist/` folder is only there if you want to produce a local packaged build, and git ignores it.

## Development

Check the manifest:

```bash
npm run check
```

Run the self-tests (no dependencies required):

```bash
npm run selftest
```

Package a sideload-ready folder into `dist/lite-slash-commands/`:

```bash
npm run package
```

Driven by [`scripts/package-plugin.mjs`](./scripts/package-plugin.mjs), this runs the manifest check and self-tests first, then copies `plugin.json`, `shell.js`, `seed-prompts.json`, `helpers/`, and `locales/` into `dist/lite-slash-commands/`. Drop that folder straight into Cerebr developer mode — no zipping required.

## Manual testing

For a quick local sanity check, run the same two commands CI runs:

```bash
npm run check
npm run selftest
```

To invoke the manifest validator directly against the plugin entry:

```bash
node ./scripts/check-manifests.mjs ./plugin.json
```

For a hands-on pass, sideload the repo root in Cerebr developer mode, open the shell plugin, and walk through the real flows: command management, `{{lang}}` substitution, import/export, and the `All commands` palette.

## Working in the Cerebr ecosystem

This is a Cerebr shell plugin, so development, sideloading, and manual testing all happen inside Cerebr itself.

- Cerebr main app: https://github.com/yym68686/Cerebr
- Cerebr plugin template: https://github.com/yym68686/cerebr-plugin-template

If you're starting a fresh plugin from scratch, fork the template repo above. This repo is the standalone implementation of `slash-commands` and only carries what that specific plugin needs to run and be maintained.

## License

Licensed under the [GNU General Public License v3.0](./LICENSE).
