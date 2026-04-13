import * as fs from "fs";

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/** 判断是否为 Flutter 工程（dependencies 下 flutter.sdk = flutter） */
export function isFlutterPubspecText(text: string): boolean {
  return /\n\s+flutter:\s*\n\s+sdk:\s*flutter\b/.test("\n" + text);
}

function stripYamlScalar(raw: string): string {
  let s = raw.trim();
  const hash = s.indexOf(" #");
  if (hash !== -1) {
    s = s.slice(0, hash).trimEnd();
  }
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

/** 读取顶层 `key:` 下、更深缩进的第一层 `name: value` 键值对 */
function parseTopLevelBlock(
  lines: string[],
  blockKey: string
): Record<string, string> | null {
  const keyRe = new RegExp(`^(\s*)${blockKey}:\\s*(?:#.*)?$`);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(keyRe);
    if (!m) {
      continue;
    }
    const baseIndent = m[1].length;
    const out: Record<string, string> = {};
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (!line.trim() || /^\s*#/.test(line)) {
        continue;
      }
      const indM = line.match(/^(\s*)/);
      const ind = indM ? indM[1].length : 0;
      if (ind <= baseIndent) {
        break;
      }
      const trimmed = line.trim();
      const kv = trimmed.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
      if (kv) {
        out[kv[1]] = stripYamlScalar(kv[2]);
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  }
  return null;
}

export interface ImageStaticPubspecConfig {
  image_folder: string;
  output_file: string;
}

export function readImageStaticConfigFromPubspec(
  pubspecPath: string
): ImageStaticPubspecConfig | { error: string } {
  let text: string;
  try {
    text = fs.readFileSync(pubspecPath, "utf8");
  } catch {
    return { error: `无法读取 pubspec.yaml：${pubspecPath}` };
  }
  if (!isFlutterPubspecText(text)) {
    return {
      error:
        "当前 pubspec.yaml 不是 Flutter 项目（缺少 dependencies → flutter → sdk: flutter）。",
    };
  }
  const lines = splitLines(text);
  const block = parseTopLevelBlock(lines, "flutter_image_static_generator");
  if (!block) {
    return {
      error:
        "请在 pubspec.yaml 根级添加 flutter_image_static_generator 配置，例如：\nflutter_image_static_generator:\n  image_folder: assets/images\n  output_file: lib/generated/asset_paths.dart\n子包（相对 monorepo 根）：\n  image_folder: packages/my_ui_kit/assets/images\n若 VS Code 打开的是子包根目录，请用：image_folder: assets/images\n含点号的输出文件名建议加引号：output_file: \"asset_paths.dart\"\n（output_file 为目录时写 ./ 或 lib/gen/，将自动生成 asset_paths.dart）",
    };
  }
  const image_folder = block.image_folder?.trim();
  const output_file = block.output_file?.trim();
  if (!image_folder || !output_file) {
    return {
      error:
        "flutter_image_static_generator 中必须同时包含 image_folder 与 output_file。",
    };
  }
  return { image_folder, output_file };
}
