# AGENTS.md

## 專案定位

這個儲存庫是 Cerebr 的獨立外掛 repo，提供 `slash-commands` shell plugin。`plugin.json` 設定了 `kind: "script"`、`scope: "shell"`，而且 repo 根目錄本身就是 sideload 載入目標，所以真正的 plugin payload 直接放在根目錄，不要再外包一層資料夾。

此 repo 不是 Cerebr Chrome 擴充套件本體。開發時要一直記得「宿主是 `ref/Cerebr`，這裡是外掛」這個邊界，避免把主程式的做法直接搬進來。

## 工作區與主要檔案

- `plugin.json`: manifest、permissions、相容版本、入口檔。
- `shell.js`: 外掛主體，處理 storage、slash descriptors、管理頁面事件與 cleanup。
- `helpers/plugin-i18n.js`: locale 載入與字串查詢，使用 JSON module import，不靠 runtime fetch。
- `helpers/__selftest__.mjs`: 零依賴 schema/self-test，檢查 locale 與 `seed-prompts.json`。
- `locales/*.json`: UI 與 seed command metadata。
- `seed-prompts.json`: 預設 seed prompt，四個 seed 都必須保留 `{{lang}}`。
- `scripts/check-manifests.mjs`: manifest 驗證。
- `scripts/package-plugin.mjs`: 追蹤中的正式打包腳本，輸出 `dist/lite-slash-commands/`。
- `.github/workflows/ci.yml`: CI 只跑 `npm run check` 與 `npm run selftest`。
- `.github/workflows/release-package.yml`: `v*.*.*` tag 發版流程，會驗證 tag 與 `plugin.json.version` 一致後再打包 release zip。

## 核心架構邊界

這個外掛採用 host-native UI。斜線選擇器、管理頁面、選單入口都交給 Cerebr host 算繪，外掛本身只提供資料與事件。

- Slash picker: `api.shell.setSlashCommands(...)`
- 管理頁面: `api.shell.openPage(...)` / `api.shell.updatePage(...)`
- 選單入口: `api.shell.setMenuItems(...)`

如果要新增新的 shell UI surface，優先順序依序是：

1. `shell.setInputActions()`
2. `shell.setSlashCommands()`
3. `shell.setMenuItems()`
4. `shell.openPage({ view })`
5. `shell.showModal()`
6. `shell.mountInputAddon()`

不要為了修 bug 回退成自建 DOM / CSS picker。`ref/legacy/zeta_lite-slash-commands/` 的確保留了另一種實作，而且它能避開目前 `/` 選單滾動後回到頂部的宿主 bug；但那條路線會讓外掛跟 Cerebr host UI 脫節。現在的決策是等 Cerebr upstream 修宿主問題，不在現行 `shell.js` 裡注入自訂 DOM/CSS workaround。

## 資料流與狀態模型

狀態存在 `api.storage` 的 `cerebr_plugin_lite_slash_commands_v1`，格式是 envelope：

```json
{
  "schemaVersion": 1,
  "seedVersion": "v1",
  "commands": [],
  "meta": {
    "initializedAt": 0,
    "lastResetAt": 0,
    "userManagedAt": 0
  }
}
```

修改資料時先看這幾個函式：

- `normalizeEnvelope` / `serializeEnvelope`: 讀寫正規化邊界。
- `loadInitialEnvelope`: storage 為空時用 seed 資料重建預設指令。
- `refreshSeedCommandsForLocale`: 切語系時只刷新 seed command 的 metadata。
- `persistEnvelope`: 唯一正式寫入路徑，寫 storage、更新 `userManagedAt`、同步 slash commands。
- `buildSlashCommandDescriptors`: 把儲存的 command 轉成 host picker descriptor，並在這一步展開 `{{lang}}`。
- `handlePageEvent`: page 事件總入口，依 `manage` / `import` / `export` 分流。

頁面狀態靠 `runtimeState.pageMode` 與 `pageViewRevision` 控制。調整列表、切換 mode、重新開頁時，通常都要同步考慮 `pageViewRevision` 是否需要遞增。

## i18n 與 seed command 規則

`helpers/plugin-i18n.js` 以 JSON module import 方式載入 `locales/en.json`、`zh_CN.json`、`zh_TW.json`。這是 sideload 沙箱需求，不要改成 runtime `fetch(import.meta.url)`。

新增語系時，至少同步更新：

- `helpers/plugin-i18n.js` 內的 `LOCALE_MAP`
- `SUPPORTED_LOCALES`
- `normalizeLocaleCode`
- 新 locale JSON 的 `language_label`
- 新 locale JSON 的 `ui.*`
- 新 locale JSON 的 `seed_commands.*`

新增 seed command 時，至少同步更新：

- `SEED_ORDER`
- `seed-prompts.json`
- `locales/en.json`
- `locales/zh_CN.json`
- `locales/zh_TW.json`
- `helpers/__selftest__.mjs` 的 `REQUIRED_SEED_KEYS`

`seed-prompts.json` 內的每個 seed prompt 都必須保留 `{{lang}}` token。

## ref 參考資料政策

`ref/` 是本地參考資料區，不保證每個開發者 clone 下來都會有。這個 repo 的 `.git/info/exclude` 通常會忽略：

- `ref/`
- `scripts/package-lite-slash-commands.ps1`
- `.claude/`
- `.codex/`
- `.gemini/`
- `.cursor/`
- `.agents/`
- `.agent/`
- `openspec/`

因此開始引用 `ref/` 前，先確認本地是否存在，不要直接假設。

### `ref/` 目錄用途

- `ref/Cerebr/`: Cerebr 主程式原始碼快照。查 host API 行為、picker 內部邏輯、宿主 bug 歸屬時用它。
- `ref/template-starter/`: 官方外掛模板與說明。優先查 `docs/api-reference.md`、`docs/permissions-and-slots.md`、`docs/runtime-architecture.md`。
- `ref/legacy/zeta_lite-slash-commands/`: 舊版自建 DOM 實作，只拿來做歷史對照與滾動 bug 背景參考。

### `ref/` 缺失時的處理

先檢查目錄是否存在，再決定要不要補齊：

- `ref/Cerebr/` 不在時，可從 `https://github.com/yym68686/Cerebr` 補 clone。
- `ref/template-starter/` 不在時，可從 `https://github.com/yym68686/cerebr-plugin-template` 補 clone。
- `ref/legacy/zeta_lite-slash-commands/` 不在時，不要自己捏造內容；先回報缺失，再依現有 repo 與 host 參考繼續工作。

不要修改 `ref/` 下任何檔案。它們是參考副本，不是這個 repo 的可提交來源。

## 開發指令

```bash
npm run check
npm run selftest
npm run package
```

說明：

- `npm run check`: 驗證 `plugin.json`
- `npm run selftest`: 檢查 `{{lang}}` 展開與 locale / seed schema
- `npm run package`: 執行 `scripts/package-plugin.mjs`，先驗證再複製 payload 到 `dist/lite-slash-commands/`

`dist/` 已在 `.gitignore` 內，打包輸出不要提交。

本地如果剛好有 `scripts/package-lite-slash-commands.ps1`，那是個人忽略檔，不是正式共用入口。請以 `scripts/package-plugin.mjs` / `npm run package` 為準。

## 手動驗證

沒有無頭測試可以完全取代宿主端驗證。修改後至少要用 Cerebr 開發者模式 sideload repo 根目錄或 `dist/lite-slash-commands/`，實際走過：

- `/` slash picker 是否正常列出與執行指令
- 管理頁面 CRUD
- 匯入 / 匯出 JSON
- `{{lang}}` 在切換 Cerebr 語系後是否正確展開
- `All commands` 命令面板入口

## 修改前後的注意事項

- `plugin.json.script.entry` 必須維持相對路徑 `./shell.js`。
- `permissions` 目前仍使用舊 namespace；新增 shell API 呼叫前，先對照 `ref/template-starter/docs/permissions-and-slots.md`。
- `setup(api)` 回傳的 cleanup 必須保留 `clearSlashCommands`、`clearMenuItems`、`closePage` 這類收尾，不然熱重載會殘留 UI。
- 不要繞過 `persistEnvelope` 直接寫 storage。
- 改到 locale、seed prompt、seed command metadata 時，記得一起跑 `npm run selftest`。

## 搜尋與閱讀建議

做 repo 內搜尋時，先用 `sg` 找函式宣告、呼叫點、imports、AST 形狀，再用 `rg` 補字串、錯誤訊息、JSON key、README 與 workflow 文字。這個 repo 最常先查的關鍵點通常是：

- `persistEnvelope`
- `buildSlashCommandDescriptors`
- `handlePageEvent`
- `loadInitialEnvelope`
- `refreshSeedCommandsForLocale`
- `scripts/package-plugin.mjs`
