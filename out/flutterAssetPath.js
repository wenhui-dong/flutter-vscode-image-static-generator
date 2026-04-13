"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFirstPubspecRoot = findFirstPubspecRoot;
exports.readPubspecPackageName = readPubspecPackageName;
exports.resolveFlutterAssetPathContext = resolveFlutterAssetPathContext;
const fs = require("fs");
const path = require("path");
function pathsEqual(a, b) {
    return path.normalize(a) === path.normalize(b);
}
/** 自目录向上查找第一个包含 pubspec.yaml 的目录，若无则返回 null */
function findFirstPubspecRoot(startDir) {
    let d = path.normalize(startDir);
    for (;;) {
        const pub = path.join(d, "pubspec.yaml");
        if (fs.existsSync(pub) && fs.statSync(pub).isFile()) {
            return d;
        }
        const parent = path.dirname(d);
        if (parent === d) {
            return null;
        }
        d = parent;
    }
}
/** 读取 pubspec 顶层 name 字段（供 AssetImage / packages/ 路径使用） */
function readPubspecPackageName(pubspecPath) {
    let text;
    try {
        text = fs.readFileSync(pubspecPath, "utf8");
    }
    catch {
        return null;
    }
    for (const line of text.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith("#")) {
            continue;
        }
        const m = t.match(/^name:\s*(.+)$/);
        if (!m) {
            continue;
        }
        let v = m[1].trim();
        const hash = v.indexOf(" #");
        if (hash !== -1) {
            v = v.slice(0, hash).trimEnd();
        }
        if ((v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
        }
        return v || null;
    }
    return null;
}
/**
 * 若图片目录位于「工作区根 pubspec 以外的子包」内（如 packages/foo/...），
 * 则使用 Flutter 资源路径：packages/<包名>/<相对包根路径>。
 */
function resolveFlutterAssetPathContext(workspaceRoot, imageRootAbs) {
    const ws = path.normalize(workspaceRoot);
    const pubRoot = findFirstPubspecRoot(imageRootAbs);
    if (!pubRoot) {
        return { mode: "workspace" };
    }
    if (pathsEqual(pubRoot, ws)) {
        return { mode: "workspace" };
    }
    const name = readPubspecPackageName(path.join(pubRoot, "pubspec.yaml"));
    if (!name) {
        return { mode: "workspace" };
    }
    return { mode: "package", packageRoot: pubRoot, packageName: name };
}
//# sourceMappingURL=flutterAssetPath.js.map