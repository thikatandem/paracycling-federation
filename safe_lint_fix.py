from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Iterable

# -----------------------------------------------------------------------------
# SAFE LINT FIXER
# -----------------------------------------------------------------------------
# Design goal:
#   * Never rename files, functions, variables, DOM IDs, DB columns, tables,
#     relationships, or imports/exports.
#   * Never rewrite business logic.
#   * Only apply byte-safe BOM/final-newline cleanup plus an allow-list of
#     ESLint fixes that are formatting-only.
#   * Verify every ESLint-modified JS/MJS file has the same Babel AST and the
#     same comments before accepting the change. If verification fails, revert.
#   * Never auto-fix structural/style rules that may alter behavior or CSS
#     cascade. Those remain in the report for manual review.
#   * Default mode is DRY RUN. Use --apply only after reviewing the plan.
# -----------------------------------------------------------------------------

SAFE_ESLINT_RULES = {
    "indent",
    "@stylistic/indent",
    "@stylistic/padded-blocks",
    "@stylistic/no-multiple-empty-lines",
    "@stylistic/padding-line-between-statements",
    "@stylistic/brace-style",
    "operator-linebreak",
    "@stylistic/operator-linebreak",
    "object-curly-spacing",
    "@stylistic/object-curly-spacing",
    "@stylistic/comma-spacing",
    "@stylistic/key-spacing",
    "@stylistic/keyword-spacing",
    "@stylistic/space-before-blocks",
    "@stylistic/space-in-parens",
    "@stylistic/array-bracket-spacing",
    "@stylistic/computed-property-spacing",
    "@stylistic/function-call-spacing",
    "@stylistic/no-trailing-spaces",
    "no-trailing-spaces",
    "@stylistic/eol-last",
    "eol-last",
    "import/newline-after-import",
    "multiline-ternary",
}

JS_SUFFIXES = {".js", ".mjs", ".cjs"}
STYLE_SUFFIXES = {".css", ".scss", ".sass"}
TEXT_SUFFIXES = JS_SUFFIXES | STYLE_SUFFIXES | {".ts", ".mts", ".cts"}

BOM = b"\xef\xbb\xbf"

BABEL_SIGNATURE_SCRIPT = r"""
const crypto = require('crypto');
const parser = require('@babel/parser');
let src = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { src += chunk; });
process.stdin.on('end', () => {
  if (src.charCodeAt(0) === 0xFEFF) src = src.slice(1);
  const ast = parser.parse(src, {
    sourceType: 'unambiguous',
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
    errorRecovery: false,
    plugins: ['importMeta', 'topLevelAwait']
  });

  function clean(value) {
    if (Array.isArray(value)) return value.map(clean);
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if ([
        'start', 'end', 'loc', 'extra', 'errors', 'tokens',
        'leadingComments', 'innerComments', 'trailingComments'
      ].includes(key)) continue;
      if (key === 'comments') continue;
      out[key] = clean(val);
    }
    return out;
  }

  const payload = {
    program: clean(ast.program),
    comments: (ast.comments || []).map(c => ({ type: c.type, value: c.value }))
  };
  const json = JSON.stringify(payload);
  process.stdout.write(crypto.createHash('sha256').update(json).digest('hex'));
});
"""


@dataclass
class ChangeRecord:
    path: str
    before_sha256: str
    after_sha256: str
    changes: list[str]
    ast_verified: bool | None = None
    reverted: bool = False
    note: str = ""


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def find_executable(*names: str) -> str | None:
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    return None


def run_command(
    command: list[str],
    *,
    cwd: Path,
    input_text: str | None = None,
    timeout: int = 300,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=str(cwd),
        input=input_text,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=False,
    )


def is_within(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def ensure_project_root(root: Path) -> None:
    if not root.exists() or not root.is_dir():
        raise RuntimeError(f"Project root does not exist: {root}")
    package_json = root / "package.json"
    if not package_json.is_file():
        raise RuntimeError(
            f"Refusing to run: package.json was not found in project root: {root}"
        )


def detect_newline(data: bytes) -> bytes:
    crlf = data.count(b"\r\n")
    lf = data.count(b"\n") - crlf
    if crlf > lf:
        return b"\r\n"
    return b"\n"


def mechanical_cleanup_bytes(data: bytes) -> tuple[bytes, list[str]]:
    """Only transformations that are byte-level and behavior-neutral."""
    changes: list[str] = []
    out = data

    if out.startswith(BOM):
        out = out[len(BOM):]
        changes.append("removed UTF-8 BOM")

    # Add a final newline only when missing. Do not strip trailing spaces,
    # blank lines, template-literal content, or any other bytes.
    if out and not (out.endswith(b"\n") or out.endswith(b"\r")):
        out += detect_newline(out)
        changes.append("added final newline")

    return out, changes


def babel_available(root: Path, node: str | None) -> bool:
    if not node:
        return False
    probe = run_command(
        [node, "-e", "require.resolve('@babel/parser'); process.stdout.write('ok')"],
        cwd=root,
        timeout=30,
    )
    return probe.returncode == 0 and probe.stdout.strip() == "ok"


def babel_ast_signature(root: Path, node: str, data: bytes) -> str:
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise RuntimeError(f"Source is not valid UTF-8: {exc}") from exc

    result = run_command(
        [node, "-e", BABEL_SIGNATURE_SCRIPT],
        cwd=root,
        input_text=text,
        timeout=60,
    )
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip()
        raise RuntimeError(f"Babel parse failed: {message}")
    signature = result.stdout.strip()
    if not re.fullmatch(r"[0-9a-f]{64}", signature):
        raise RuntimeError("Babel signature returned an unexpected result")
    return signature


def node_check(root: Path, node: str, path: Path) -> tuple[bool, str]:
    result = run_command([node, "--check", str(path)], cwd=root, timeout=60)
    if result.returncode == 0:
        return True, ""
    return False, (result.stderr or result.stdout).strip()


def create_filtered_eslint_config(root: Path, base_config: Path) -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="safe-eslint-config-"))
    config_path = temp_dir / "eslint.safe.config.mjs"
    base_uri = base_config.resolve().as_uri()
    allowed_json = json.dumps(sorted(SAFE_ESLINT_RULES), ensure_ascii=False)
    content = f"""import base from {json.dumps(base_uri)}\n\nconst allowed = new Set({allowed_json})\n\nexport default base.map(entry => {{\n  if (!entry || typeof entry !== 'object' || !entry.rules) return entry\n  return {{\n    ...entry,\n    rules: Object.fromEntries(\n      Object.entries(entry.rules).map(([name, value]) => [\n        name,\n        allowed.has(name) ? value : 'off'\n      ])\n    )\n  }}\n}})\n"""
    config_path.write_text(content, encoding="utf-8", newline="\n")
    return config_path


def parse_eslint_json(stdout: str, root: Path) -> dict[Path, list[dict]]:
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return {}

    results: dict[Path, list[dict]] = {}
    if not isinstance(payload, list):
        return results

    for entry in payload:
        file_path = entry.get("filePath")
        messages = entry.get("messages") or []
        if not file_path or not messages:
            continue
        path = Path(file_path)
        if not path.is_absolute():
            path = root / path
        path = path.resolve()
        if is_within(path, root):
            results[path] = messages
    return results


def collect_eslint_results(root: Path, npx: str) -> tuple[dict[Path, list[dict]], str]:
    result = run_command(
        [npx, "eslint", ".", "--format", "json", "--no-cache"],
        cwd=root,
        timeout=600,
    )
    parsed = parse_eslint_json(result.stdout, root)
    diagnostic = result.stderr.strip()
    if not parsed and result.stdout.strip() and not result.stdout.lstrip().startswith("["):
        diagnostic = (diagnostic + "\n" + result.stdout.strip()).strip()
    return parsed, diagnostic


def parse_stylelint_json(stdout: str, root: Path) -> dict[Path, list[dict]]:
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return {}

    results: dict[Path, list[dict]] = {}
    if not isinstance(payload, list):
        return results

    for entry in payload:
        source = entry.get("source")
        warnings = entry.get("warnings") or []
        if not source or not warnings:
            continue
        path = Path(source)
        if not path.is_absolute():
            path = root / path
        path = path.resolve()
        if is_within(path, root):
            results[path] = warnings
    return results


def collect_stylelint_results(root: Path, npx: str) -> tuple[dict[Path, list[dict]], str]:
    result = run_command(
        [
            npx,
            "stylelint",
            "**/*.{css,scss,sass}",
            "--formatter",
            "json",
            "--no-cache",
        ],
        cwd=root,
        timeout=600,
    )
    parsed = parse_stylelint_json(result.stdout, root)
    diagnostic = result.stderr.strip()
    if not parsed and result.stdout.strip() and not result.stdout.lstrip().startswith("["):
        diagnostic = (diagnostic + "\n" + result.stdout.strip()).strip()
    return parsed, diagnostic


def locate_eslint_config(root: Path) -> Path | None:
    candidates = [
        root / "eslint.config.mjs",
        root / "eslint.config.js",
        root / "eslint.config.cjs",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def batch(items: list[Path], size: int = 30) -> Iterable[list[Path]]:
    for index in range(0, len(items), size):
        yield items[index:index + size]


def make_backup_root(root: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return root.parent / f"{root.name}_safe_lint_backup_{timestamp}"


def backup_file(root: Path, backup_root: Path, path: Path) -> Path:
    relative = path.resolve().relative_to(root.resolve())
    destination = backup_root / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)
    return destination


def format_message(message: dict) -> str:
    rule = message.get("ruleId") or "PARSING/FATAL"
    line = message.get("line") or "?"
    column = message.get("column") or "?"
    text = message.get("message") or ""
    return f"{line}:{column} [{rule}] {text}"


def build_remaining_report(
    root: Path,
    eslint_results: dict[Path, list[dict]],
    stylelint_results: dict[Path, list[dict]],
    diagnostics: list[str],
) -> str:
    lines: list[str] = []
    lines.append("SAFE LINT FIXER - REMAINING ISSUES")
    lines.append("Only non-structural formatting fixes were auto-applied.")
    lines.append("")

    if diagnostics:
        lines.append("LINTER DIAGNOSTICS")
        lines.extend(diagnostics)
        lines.append("")

    if eslint_results:
        lines.append("ESLINT")
        for path in sorted(eslint_results, key=lambda p: str(p).lower()):
            rel = path.relative_to(root)
            lines.append(str(rel))
            for message in eslint_results[path]:
                lines.append("  " + format_message(message))
            lines.append("")

    if stylelint_results:
        lines.append("STYLELINT")
        for path in sorted(stylelint_results, key=lambda p: str(p).lower()):
            rel = path.relative_to(root)
            lines.append(str(rel))
            for warning in stylelint_results[path]:
                rule = warning.get("rule") or "UNKNOWN"
                line = warning.get("line") or "?"
                column = warning.get("column") or "?"
                text = warning.get("text") or ""
                lines.append(f"  {line}:{column} [{rule}] {text}")
            lines.append("")

    if not eslint_results and not stylelint_results and not diagnostics:
        lines.append("No remaining lint issues were reported.")

    return "\n".join(lines).rstrip() + "\n"


def run_self_test(iterations: int) -> None:
    sample = (
        BOM
        + b"const x = `keep trailing spaces here   `\n"
        + b"const y = 1"
    )
    expected = (
        b"const x = `keep trailing spaces here   `\n"
        + b"const y = 1\n"
    )

    for _ in range(iterations):
        out, changes = mechanical_cleanup_bytes(sample)
        assert out == expected
        assert changes == ["removed UTF-8 BOM", "added final newline"]
        assert b"keep trailing spaces here   `" in out

        already_clean = b"const value = 1\n"
        out2, changes2 = mechanical_cleanup_bytes(already_clean)
        assert out2 == already_clean
        assert changes2 == []

        empty, empty_changes = mechanical_cleanup_bytes(b"")
        assert empty == b""
        assert empty_changes == []

        crlf = b"const value = 1\r\nconst next = 2"
        out3, _ = mechanical_cleanup_bytes(crlf)
        assert out3.endswith(b"\r\n")

        root = Path(os.getcwd()).resolve()
        assert is_within(root, root)

    print(f"SELF-TEST PASSED: {iterations:,} safety iterations")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Conservative lint fixer that preserves application structure and logic."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent,
        help="Project root. Defaults to the folder containing this script.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually modify files. Without this flag the script is dry-run only.",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run internal safety tests and exit.",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=1000,
        help="Self-test iteration count.",
    )
    parser.add_argument(
        "--skip-stylelint",
        action="store_true",
        help="Skip Stylelint discovery/reporting.",
    )
    parser.add_argument(
        "--skip-eslint",
        action="store_true",
        help="Skip ESLint discovery and safe ESLint formatting fixes.",
    )
    args = parser.parse_args()

    if args.self_test:
        run_self_test(max(1, args.iterations))
        return 0

    root = args.root.resolve()
    ensure_project_root(root)

    npx = find_executable("npx.cmd", "npx")
    node = find_executable("node.exe", "node")

    if not npx and (not args.skip_eslint or not args.skip_stylelint):
        raise RuntimeError("npx was not found in PATH")

    eslint_results: dict[Path, list[dict]] = {}
    stylelint_results: dict[Path, list[dict]] = {}
    diagnostics: list[str] = []

    if not args.skip_eslint:
        print("Scanning ESLint errors...")
        eslint_results, diagnostic = collect_eslint_results(root, npx)  # type: ignore[arg-type]
        if diagnostic:
            diagnostics.append("ESLint: " + diagnostic)

    if not args.skip_stylelint:
        print("Scanning Stylelint errors...")
        stylelint_results, diagnostic = collect_stylelint_results(root, npx)  # type: ignore[arg-type]
        if diagnostic:
            diagnostics.append("Stylelint: " + diagnostic)

    reported_files = set(eslint_results) | set(stylelint_results)
    reported_files = {
        path for path in reported_files
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES
    }

    print(f"Files currently reported by linters: {len(reported_files)}")

    planned_mechanical: dict[Path, tuple[bytes, list[str]]] = {}
    for path in sorted(reported_files, key=lambda p: str(p).lower()):
        before = path.read_bytes()
        after, changes = mechanical_cleanup_bytes(before)
        if after != before:
            planned_mechanical[path] = (after, changes)

    safe_eslint_targets: list[Path] = []
    for path, messages in eslint_results.items():
        if path.suffix.lower() not in JS_SUFFIXES:
            continue
        if any(
            (message.get("ruleId") in SAFE_ESLINT_RULES)
            and not message.get("fatal")
            for message in messages
        ):
            safe_eslint_targets.append(path)

    safe_eslint_targets = sorted(set(safe_eslint_targets), key=lambda p: str(p).lower())

    print(f"Byte-safe BOM/final-newline fixes planned: {len(planned_mechanical)}")
    print(f"Files eligible for AST-verified ESLint formatting: {len(safe_eslint_targets)}")

    if not args.apply:
        print("\nDRY RUN ONLY - no source file was changed.")
        for path, (_, changes) in planned_mechanical.items():
            print(f"  {path.relative_to(root)}: {', '.join(changes)}")
        if safe_eslint_targets:
            print("\nAST-verified formatting candidates:")
            for path in safe_eslint_targets:
                print(f"  {path.relative_to(root)}")
        print("\nRun again with --apply to perform only these guarded fixes.")
        return 0

    backup_root = make_backup_root(root)
    backup_root.mkdir(parents=True, exist_ok=False)
    print(f"Backup folder: {backup_root}")

    originals: dict[Path, bytes] = {}
    records: dict[Path, ChangeRecord] = {}

    def remember(path: Path) -> None:
        if path not in originals:
            data = path.read_bytes()
            originals[path] = data
            backup_file(root, backup_root, path)
            records[path] = ChangeRecord(
                path=str(path.relative_to(root)),
                before_sha256=sha256_bytes(data),
                after_sha256=sha256_bytes(data),
                changes=[],
            )

    try:
        # 1) Byte-safe cleanup.
        for path, (after, changes) in planned_mechanical.items():
            remember(path)
            path.write_bytes(after)
            records[path].changes.extend(changes)

        # Baseline after byte-safe cleanup; ESLint must preserve this AST.
        eslint_baselines: dict[Path, bytes] = {}
        for path in safe_eslint_targets:
            remember(path)
            eslint_baselines[path] = path.read_bytes()

        # 2) Formatting-only ESLint fix, guarded by AST equality.
        if safe_eslint_targets and not args.skip_eslint:
            eslint_config = locate_eslint_config(root)
            if not eslint_config:
                diagnostics.append("ESLint safe-fix skipped: eslint.config.* was not found.")
            elif not node:
                diagnostics.append("ESLint safe-fix skipped: node was not found.")
            elif not babel_available(root, node):
                diagnostics.append(
                    "ESLint safe-fix skipped: @babel/parser is unavailable, so AST verification cannot be guaranteed."
                )
            else:
                filtered_config = create_filtered_eslint_config(root, eslint_config)
                try:
                    before_signatures: dict[Path, str] = {}
                    eligible: list[Path] = []

                    for path in safe_eslint_targets:
                        try:
                            before_signatures[path] = babel_ast_signature(
                                root,
                                node,
                                eslint_baselines[path],
                            )
                            eligible.append(path)
                        except Exception as exc:
                            diagnostics.append(
                                f"Skipped AST-formatting {path.relative_to(root)}: {exc}"
                            )

                    for group in batch(eligible):
                        command = [
                            npx,  # type: ignore[list-item]
                            "eslint",
                            "--no-cache",
                            "--fix",
                            "--config",
                            str(filtered_config),
                            *[str(path) for path in group],
                        ]
                        result = run_command(command, cwd=root, timeout=600)
                        if result.stderr.strip():
                            diagnostics.append("Safe ESLint: " + result.stderr.strip())

                    for path in eligible:
                        baseline = eslint_baselines[path]
                        after = path.read_bytes()
                        if after == baseline:
                            records[path].ast_verified = True
                            continue

                        try:
                            after_signature = babel_ast_signature(root, node, after)
                            syntax_ok, syntax_message = node_check(root, node, path)
                            if not syntax_ok:
                                raise RuntimeError(syntax_message)

                            if after_signature != before_signatures[path]:
                                raise RuntimeError("AST changed")

                            records[path].changes.append(
                                "applied ESLint formatting-only fixes"
                            )
                            records[path].ast_verified = True
                        except Exception as exc:
                            path.write_bytes(baseline)
                            records[path].ast_verified = False
                            records[path].reverted = True
                            records[path].note = (
                                "ESLint changes were reverted automatically because "
                                f"verification failed: {exc}"
                            )
                finally:
                    shutil.rmtree(filtered_config.parent, ignore_errors=True)

        # 3) Final syntax check for every changed JS/MJS file.
        if node:
            for path, record in records.items():
                if path.suffix.lower() not in JS_SUFFIXES:
                    continue
                if path.read_bytes() == originals[path]:
                    continue
                syntax_ok, syntax_message = node_check(root, node, path)
                if not syntax_ok:
                    # Restore complete original, not only ESLint baseline.
                    path.write_bytes(originals[path])
                    record.reverted = True
                    record.ast_verified = False
                    record.note = (
                        "All changes reverted automatically because node --check failed: "
                        + syntax_message
                    )
                    record.changes = []

        # 4) Refresh hashes.
        for path, record in records.items():
            record.after_sha256 = sha256_bytes(path.read_bytes())

        # 5) Re-run linters only for reporting. No additional fixer is invoked.
        remaining_eslint: dict[Path, list[dict]] = {}
        remaining_stylelint: dict[Path, list[dict]] = {}

        if not args.skip_eslint:
            remaining_eslint, diagnostic = collect_eslint_results(root, npx)  # type: ignore[arg-type]
            if diagnostic:
                diagnostics.append("Post-fix ESLint: " + diagnostic)

        if not args.skip_stylelint:
            remaining_stylelint, diagnostic = collect_stylelint_results(root, npx)  # type: ignore[arg-type]
            if diagnostic:
                diagnostics.append("Post-fix Stylelint: " + diagnostic)

        manifest = {
            "project_root": str(root),
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "safety_policy": {
                "renames": False,
                "deletions": False,
                "structural_patches": False,
                "css_behavior_changes": False,
                "eslint_rules_allowed": sorted(SAFE_ESLINT_RULES),
                "ast_verification_required": True,
            },
            "changes": [asdict(record) for record in records.values()],
        }
        (backup_root / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        report = build_remaining_report(
            root,
            remaining_eslint,
            remaining_stylelint,
            diagnostics,
        )
        (backup_root / "remaining_lint_issues.txt").write_text(
            report,
            encoding="utf-8",
        )

        changed_count = sum(
            1
            for path in records
            if path.read_bytes() != originals[path]
        )
        reverted_count = sum(1 for record in records.values() if record.reverted)

        print(f"\nCompleted. Source files changed: {changed_count}")
        print(f"Automatically reverted by safety checks: {reverted_count}")
        print("No file was renamed or deleted.")
        print("No structural/logic/import/relationship fix was auto-applied.")
        print(f"Audit manifest: {backup_root / 'manifest.json'}")
        print(f"Remaining issues: {backup_root / 'remaining_lint_issues.txt'}")
        return 0

    except Exception:
        print("\nFATAL ERROR - rolling back every touched source file...", file=sys.stderr)
        for path, data in originals.items():
            try:
                path.write_bytes(data)
            except Exception as rollback_error:
                print(
                    f"ROLLBACK FAILURE for {path}: {rollback_error}",
                    file=sys.stderr,
                )
        raise


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        raise SystemExit(130)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
