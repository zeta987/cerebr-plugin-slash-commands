[English](./README.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)

# Cerebr 外掛：Slash Commands（斜線指令）

本儲存庫專用於開發 `slash-commands` Cerebr shell 外掛。

## 貢獻說明

本外掛由 [ZETA](https://github.com/zeta987) 創作，並經 [yym68686](https://github.com/yym68686) 大幅改良。

本外掛透過 `shell.setSlashCommands()` 將指令目錄註冊至 Cerebr 原生斜線選擇器，因此 `/` 選單的體驗、鍵盤導覽、輸入法（IME）行為及篩選邏輯，均由 Cerebr 原生處理。外掛本身則負責：管理使用者可編輯的指令目錄（內建 4 個預設指令）；選取指令時，將 `{{lang}}` 佔位符替換為當前語系的語言標籤；並提供宿主端算繪的管理頁面，支援新增、重置、編輯、匯入與匯出。

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

## 手動測試

如果只是想先做本機快速驗證，可以直接執行和 CI 相同的檢查：

```bash
npm run check
npm run selftest
```

如果想直接呼叫 manifest 驗證腳本，也可以這樣跑：

```bash
node ./scripts/check-manifests.mjs ./plugin.json
```

互動式驗證時，請把本儲存庫根目錄用 Cerebr 開發者模式側載進去，再實際確認指令管理、`{{lang}}` 展開、匯入匯出，以及 `All commands` 命令面板都能正常運作。

## 如何開發

這個專案是 Cerebr 的 shell 外掛，所以開發、側載與手動測試都依附在 Cerebr 生態裡進行。

- Cerebr 主程式：https://github.com/yym68686/Cerebr
- Cerebr 外掛開發模板：https://github.com/yym68686/cerebr-plugin-template

如果妳想從零開始做另一個外掛，建議先從上面的模板儲存庫起手；而這個 repo 則是 `slash-commands` 外掛獨立出來之後的實作與維護倉庫。

## 授權

本專案以 [GNU General Public License v3.0](./LICENSE) 釋出。