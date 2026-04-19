[English](./README.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)

# Cerebr 插件：Slash Commands（快捷命令）

这个仓库是 `slash-commands` Cerebr shell 插件的专属开发仓库。

## 贡献说明

这个插件由 [ZETA](https://github.com/zeta987) 创作，[yym68686](https://github.com/yym68686) 对这个插件进行了大幅改进。

本插件通过 `shell.setSlashCommands()` 将命令目录注册到 Cerebr 原生的斜杠命令选择器（slash picker）中，因此 `/` 选择菜单的使用体验、键盘导航、输入法（IME）行为及筛选逻辑均由 Cerebr 负责。插件自身负责管理一份用户可编辑的命令目录（包含 4 个预设命令），在选中命令时将 `{{lang}}` 占位符展开为当前语言环境对应的语言标签，并提供一个由宿主端（host）渲染的管理页面，支持新增、重置、编辑、导入和导出操作。

## 界面预览

<img width="800" height="689" alt="斜杠命令选择器 — 简体中文语系" src="https://github.com/user-attachments/assets/ee17399b-9c8b-4410-b56f-f17fa92ec2e1" />

<img width="1286" height="1011" alt="管理页面 — 简体中文" src="https://github.com/user-attachments/assets/ed4fe7fe-cd14-452d-8b7c-9f4ab991a985" />

## 浏览器支持

Release 的 zip 产物只针对 Chrome 版本的 Cerebr 打包，也就是安装在 Chromium 内核浏览器里的 Cerebr 扩展。本插件实际测试过的环境只有 **Chrome** 与 **Brave**，其他浏览器（Firefox、Safari、Edge、Arc 等）尚未验证，不保证兼容性。

## 从 Release 安装

Cerebr 插件管理只接受文件夹，安装打包版本的流程如下：

1. 到 [最新 Release](../../releases/latest) 下载 `slash-commands-v*.*.*.zip`。
2. 解压后会得到 `lite-slash-commands/` 文件夹。
3. 在 Cerebr 开启开发者模式，把该文件夹侧载进去。

想试还未发布的最新代码？直接 `git clone https://github.com/zeta987/cerebr-plugin-slash-commands.git` 本仓库并侧载根目录即可。

## 仓库结构

```text
slash-commands/
  plugin.json
  shell.js
  helpers/
  locales/
  seed-prompts.json
  scripts/
  dist/                        # 可选的本地打包输出，已被 git 忽略
```

## 主要源码

请直接编辑仓库根目录下的插件主体文件：

- `plugin.json`
- `shell.js`
- `helpers/`
- `locales/`
- `seed-prompts.json`

仓库根目录可直接用于 Cerebr 开发者模式的本地侧载。`dist/` 目录已被 git 忽略，仅用于存放本地打包输出。

## 开发命令

运行 manifest 检查：

```bash
npm run check
```

运行无依赖自检：

```bash
npm run selftest
```

快速打包一份可直接侧载的文件夹到 `dist/lite-slash-commands/`：

```bash
npm run package
```

这个命令由 [`scripts/package-plugin.mjs`](./scripts/package-plugin.mjs) 驱动，会先跑 manifest 检查与自检，再把 `plugin.json`、`shell.js`、`seed-prompts.json`、`helpers/`、`locales/` 复制到 `dist/lite-slash-commands/`。该文件夹可直接拖入 Cerebr 开发者模式侧载，无需额外压缩。

## 手动测试

如果只是想先做本地快速验证，可以直接执行和 CI 相同的检查：

```bash
npm run check
npm run selftest
```

如果想直接调用 manifest 验证脚本，也可以这样运行：

```bash
node ./scripts/check-manifests.mjs ./plugin.json
```

做交互验证时，请把仓库根目录通过 Cerebr 开发者模式侧载进去，再实际确认命令管理、`{{lang}}` 展开、导入导出，以及 `All commands` 命令面板都能正常工作。

## 如何开发

这个项目是 Cerebr 的 shell 插件，所以开发、侧载与手动测试都依附在 Cerebr 生态里进行。

- Cerebr 主程序：https://github.com/yym68686/Cerebr
- Cerebr 插件开发模板：https://github.com/yym68686/cerebr-plugin-template

如果你想从零开始做另一个插件，建议先从上面的模板仓库起步；而这个 repo 则是 `slash-commands` 插件独立出来之后的实现与维护仓库。

## 许可证

本项目以 [GNU General Public License v3.0](./LICENSE) 发布。