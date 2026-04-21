[English](./README.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)

# Cerebr 外掛：Slash Commands（快捷指令）

本儲存庫專用於開發 `slash-commands` Cerebr shell 外掛。

## 貢獻說明

本外掛由 [ZETA](https://github.com/zeta987) 創作，並經 [yym68686](https://github.com/yym68686) 大幅改良。

本外掛透過 `shell.setSlashCommands()` 將指令目錄註冊至 Cerebr 原生斜線選擇器，因此 `/` 選單的體驗、鍵盤導覽、輸入法（IME）行為及篩選邏輯，均由 Cerebr 原生處理。外掛本身則負責：管理使用者可編輯的指令目錄（內建 4 個預設指令）；選取指令時，將 `{{lang}}` 佔位符替換為當前語系的語言標籤；並提供宿主端算繪的管理頁面，支援新增、重置、編輯、匯入與匯出。

## 介面預覽

<img width="800" height="689" alt="斜線指令選擇器 — 繁體中文語系" src="https://github.com/user-attachments/assets/cdc3f4a8-94c5-4478-9c77-eefc49dfd620" />

<img width="1272" height="1011" alt="管理頁面 — 繁體中文" src="https://github.com/user-attachments/assets/ec57a208-36fd-4f11-bd8e-deea00c69787" />

## 瀏覽器支援

Release 的 zip 產物只針對 Chrome 版本的 Cerebr 打包，也就是安裝在 Chromium 核心瀏覽器裡的 Cerebr 擴充。本外掛實際測試過的環境只有 **Chrome** 與 **Brave**，其他瀏覽器（Firefox、Safari、Edge、Arc 等）尚未驗證，不保證相容性。

## 從 Release 安裝

Cerebr 外掛管理只接受資料夾，安裝打包版本的流程如下：

1. 到 [最新 Release](../../releases/latest) 下載 `slash-commands-v*.*.*.zip`。
2. 解壓縮後會得到 `lite-slash-commands/` 資料夾。
3. 在 Cerebr 開啟開發者模式，把該資料夾拖入進去。

想試還沒發版的最新版？直接 `git clone https://github.com/zeta987/cerebr-plugin-slash-commands.git` 本儲存庫整個拖入即可。

## 變更日誌

請查看 [CHANGELOG.md](./CHANGELOG.md)，了解每個版本的功能變更、Bug 修正與相容性更新。

## 儲存庫結構

```text
slash-commands/
  plugin.json
  shell.js
  helpers/
  locales/
  seed-prompts.json
  scripts/
  dist/                        # 本機打包輸出（git 已排除）
```

## 開發檔案

請直接編輯根目錄下的外掛內容：

- `plugin.json`
- `shell.js`
- `helpers/`
- `locales/`
- `seed-prompts.json`

根目錄檔案可直接用於 Cerebr 開發者模式側載（sideload）。`dist/` 目錄已設為 git 排除，僅存放本機打包輸出。

## 開發指令

執行 manifest 檢查：

```bash
npm run check
```

執行零依賴自我測試：

```bash
npm run selftest
```

快速打包一份可直接側載的資料夾到 `dist/lite-slash-commands/`：

```bash
npm run package
```

這個指令由 [`scripts/package-plugin.mjs`](./scripts/package-plugin.mjs) 驅動，會先跑 manifest 檢查與自我測試，再把 `plugin.json`、`shell.js`、`seed-prompts.json`、`helpers/`、`locales/` 複製到 `dist/lite-slash-commands/`。該資料夾可直接拖入 Cerebr 開發者模式側載，不需要額外壓縮。

## 手動測試

如果只是想先做本機快速驗證，可以直接執行和 CI 相同的檢查：

```bash
npm run check
npm run selftest
```

如果想直接呼叫 manifest 驗證指令碼，也可以這樣跑：

```bash
node ./scripts/check-manifests.mjs ./plugin.json
```

互動式驗證時，請把本儲存庫根目錄用 Cerebr 開發者模式側載進去，再實際確認指令管理、`{{lang}}` 展開、匯入匯出，以及 `All commands` 命令面板都能正常運作。

## 如何開發

這個專案是 Cerebr 的 shell 外掛，所以開發、側載與手動測試都依附在 Cerebr 生態裡進行。

- Cerebr 主程式：https://github.com/yym68686/Cerebr
- Cerebr 外掛開發範本：https://github.com/yym68686/cerebr-plugin-template

如果妳想從零開始做另一個外掛，建議先從上面的範本儲存庫起手；而這個 repo 則是 `slash-commands` 外掛獨立出來之後的實作與維護倉庫。

## 授權

本專案以 [GNU General Public License v3.0](./LICENSE) 釋出。
