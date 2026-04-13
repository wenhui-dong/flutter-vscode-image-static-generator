# Flutter Image Static Generator

VS Code / Cursor 扩展：从指定图片目录扫描文件，生成 Dart 静态路径常量；配置写在 `pubspec.yaml`，支持监听目录变化后自动重写。

---

## 功能概览

- 读取 `**pubspec.yaml**` 中的 `flutter_image_static_generator` 配置
- 支持 **png / jpg / jpeg / gif / webp / svg / ico / bmp / avif**（递归子目录）
- **保存/增删图片** 或 **修改 pubspec** 时可自动重新生成（可关）
- 命令面板可 **手动生成** 并打开输出文件

---

## 安装与激活

1. 在扩展目录执行 `npm install`（开发时）并 `npm run compile`，用「从 VSIX 安装」或 F5 调试加载扩展。
2. 工作区内需存在 **Flutter 项目**（`pubspec.yaml` 的 `dependencies` 下含 `flutter: sdk: flutter`）。
3. 扩展在检测到 `**/pubspec.yaml` 或执行生成命令时激活。

---

## 必配：`pubspec.yaml`

在 `**pubspec.yaml` 根级**（与 `name:`、`dependencies:` 同级缩进）添加：

```yaml
flutter_image_static_generator:
  image_folder: assets/images
  output_file: lib/generated/asset_paths.dart
```


| 字段             | 说明                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `image_folder` | 图片根目录的**相对路径**（相对**工作区根**，见下文「路径与多根工作区」）。也可用绝对路径。                                                           |
| `output_file`  | 输出文件路径。仅文件名（如 `app_assets.dart`）时，文件写在 **与 `pubspec.yaml` 同目录**（项目根）。建议写完整相对路径，如 `lib/gen/app_assets.dart`。 |


**若 `output_file` 表示目录**（如 `./`、`lib/gen/`、或以 `/` 结尾），会在该目录下自动生成默认文件名 `**asset_paths.dart`**。

含特殊字符的文件名建议加引号：

```yaml
output_file: "app.assets.dart"
```

---

## 可选：VS Code 设置

设置前缀：`flutterImageStaticGenerator`


| 配置项               | 类型  | 默认                  | 说明                        |
| ----------------- | --- | ------------------- | ------------------------- |
| `pathStyle`       | 枚举  | `relativeWorkspace` | 导出字符串的路径形式，见下表            |
| `fileHeader`      | 字符串 | 内置中英文说明             | 生成文件顶部注释                  |
| `watch`           | 布尔  | `true`              | 是否监听 `pubspec.yaml` 与图片目录 |
| `watchDebounceMs` | 数字  | `400`               | 自动重新生成前的防抖（毫秒，最小 50）      |


### `pathStyle` 取值

- `**relativeWorkspace**`：相对**当前用于解析的 Flutter 包根**（第一个工作区文件夹路径）的路径。
- `**relativeOutput`**：相对**输出文件所在目录**。
- `**posixFromImageRoot`**：自 `image_folder` 根起的 POSIX 相对路径。

当图片目录落在 **工作区根以外的子包**（例如 `packages/my_ui_kit/...`，且该目录有独立 `pubspec.yaml`）时，扩展会按 Flutter 惯例生成 `**packages/<包名>/...`** 形式的路径（与 `pathStyle` 配合使用）。

---

## 使用方法

### 自动监听

开启 `flutterImageStaticGenerator.watch`（默认开启）后：

- 修改 `**pubspec.yaml**` 或 `**image_folder` 下文件**（创建、修改、删除）会防抖后重写输出文件。
- 日志在 **视图 → 输出**，通道选择 **「Flutter Image Static Generator」**。

### 手动生成

1. `Ctrl/Cmd + Shift + P` 打开命令面板
2. 运行：**Flutter Image Static: 从 pubspec 生成路径常量**
3. 成功会打开生成的文件；失败会 **弹出错误**；图片目录下没有支持的图片时会 **警告**（仍会生成空类骨架）。

---

## 路径与多根工作区

1. **解析 `pubspec.yaml` 与 `output_file` 的根目录**
  使用 `**workspaceFolders[0]`**（多根工作区里**列表中的第一个**文件夹）。该文件夹下必须存在 `pubspec.yaml`。
2. **解析 `image_folder`**
  会在 **所有工作区根** 下依次尝试拼接相对路径；若配置为 `packages/<包名>/...` 且当前打开的就是该子包根目录，扩展会尝试把路径**回落**为包内相对路径（与 monorepo 子包开发方式兼容）。
3. **子包单独打开仓库**
  若 VS Code 打开的是 `packages/my_app` 而不是 monorepo 根，`image_folder` 应写 **相对该包根** 的路径（如 `assets/images`），不要写带 `packages/my_app/` 的前缀（除非你的目录结构确实如此）。
4. **大小写**
  在 Linux 上路径大小写需与磁盘一致；扩展对部分情况会尝试**忽略大小写**匹配目录名，仍建议与真实路径一致。

---

## 生成内容说明

- **Dart**：生成 `class <类名> { ... static const String xxx = '...'; }`，类名由输出文件名推导（PascalCase）。
- 标识符由相对图片根的路径与文件名生成，重名会自动加后缀区分。

---

## 常见问题


| 现象           | 可能原因                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| 完全没有生成、也无弹窗  | 第一个工作区根下没有 `pubspec.yaml`；或未在 `pubspec.yaml` 中配置 `flutter_image_static_generator`。                 |
| 自动模式没文件但手动可以 | 看 **输出通道** 是否报「图片目录不存在」；`image_folder` 与当前打开的根目录不匹配。                                               |
| 找不到输出文件      | `output_file` 只写了文件名时，文件在 **项目根**（与 `pubspec.yaml` 同级），不在 `lib/`。                                  |
| 配置写了但不生效     | 配置必须在 `**pubspec.yaml`**，不是 VS Code `settings.json`；键名是 `**flutter_image_static_generator**`（下划线）。 |


---

## 开发

```bash
npm install
npm run compile   # 或 npm run watch
```

按 F5 启动 **Extension Development Host** 进行调试。

---

## 版本

见 `package.json` 中的 `version` 字段。