import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
import re
import sys
from typing import Dict, Iterable, List, Set

INCLUDE_EXTENSIONS: Set[str] = {
    ".ts", ".tsx", ".js", ".jsx", ".kt", ".kts", ".swift",
    ".env", ".py", ".rb", ".php", ".json", ".java", ".cs",
}

EXCLUDE_DIRECTORIES: Set[str] = {
    "node_modules", ".git", "dist", "build", ".next", "coverage",
    ".turbo", ".idea", ".vscode", ".gradle", "DerivedData",
    ".audit_tmp", ".audit-reports",
}

PATTERN = re.compile(r"(password|secret|api[_-]?key|token|bearer)\s*[:=]\s*[\"']?[^\"';\s]+", re.IGNORECASE)


def get_staged_files(root: str) -> Set[str]:
    import subprocess
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True
        )
        return {os.path.join(root, f.strip()) for f in result.stdout.splitlines() if f.strip()}
    except subprocess.CalledProcessError:
        return set()


def iter_candidate_files(root: str, ignored_files: Set[str], staged_only: bool = True) -> Iterable[str]:
    staged_files = get_staged_files(root) if staged_only else set()

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            name for name in dirnames
            if name not in EXCLUDE_DIRECTORIES and not name.startswith(".git")
        ]
        for filename in filenames:
            extension = os.path.splitext(filename)[1].lower()
            if extension not in INCLUDE_EXTENSIONS:
                continue
            path = os.path.join(dirpath, filename)
            if os.path.abspath(path) in ignored_files:
                continue
            if staged_only and path not in staged_files:
                continue
            yield path


def collect_matches(path: str) -> Iterable[Dict[str, str]]:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as handle:
            for index, line in enumerate(handle, start=1):
                if PATTERN.search(line):
                    snippet = line.rstrip()
                    yield {
                        "path": path,
                        "line": index,
                        "snippet": snippet,
                    }
    except (OSError, UnicodeDecodeError):
        return


def gather_matches(root: str, ignored_files: Set[str], staged_only: bool = True) -> List[Dict[str, str]]:
    collected: List[Dict[str, str]] = []
    for candidate in iter_candidate_files(root, ignored_files, staged_only):
        for match in collect_matches(candidate):
            collected.append(match)
    return collected


def fingerprint(item: Dict[str, str]) -> str:
    base = f"{item['path']}:{item['line']}:{item['snippet'].strip()}"
    return hashlib.sha256(base.encode()).hexdigest()


def load_baseline(path: str) -> Dict[str, Dict[str, str]]:
    import subprocess

    try:
        result = subprocess.run(
            ["git", "show", f":scripts/hooks-system/config/detect-secrets-baseline.json"],
            capture_output=True,
            text=True,
            check=True
        )
        payload = json.loads(result.stdout)
        return {entry["fingerprint"]: entry for entry in payload.get("matches", [])}
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        pass

    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return {entry["fingerprint"]: entry for entry in payload.get("matches", [])}


def write_baseline(path: str, matches: List[Dict[str, str]]) -> None:
    data = []
    for item in matches:
        rel_path = os.path.relpath(item["path"])
        normalized_item = {
            "path": rel_path,
            "line": item["line"],
            "snippet": item["snippet"],
        }
        data.append(
            {
                "path": rel_path,
                "line": item["line"],
                "fingerprint": fingerprint(normalized_item),
            }
        )
    data.sort(key=lambda entry: (entry["path"], entry["line"], entry["fingerprint"]))
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "matches": data,
    }
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
    print(f"Baseline actualizado con {len(data)} coincidencias -> {path}")


def run_scan(root: str, baseline_path: str, ignored_files: Set[str]) -> int:
    baseline = load_baseline(baseline_path)
    findings = gather_matches(root, ignored_files, staged_only=True)

    if not findings:
        return 0

    missing = []
    for item in findings:
        rel_path = os.path.relpath(item["path"], root)
        normalized_item = {
            "path": rel_path,
            "line": item["line"],
            "snippet": item["snippet"],
        }
        if fingerprint(normalized_item) not in baseline:
            missing.append(normalized_item)

    if not missing:
        return 0

    print("Nuevos posibles secretos detectados en archivos staged:")
    for item in missing:
        print(f" - {item['path']}:{item['line']} -> {item['snippet'].strip()}")
    print("Actualiza el baseline si se trata de falsos positivos.")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Detector simple de secretos con baseline")
    parser.add_argument("mode", choices=["scan", "baseline"], help="Modo de ejecución")
    parser.add_argument("root", help="Ruta del repositorio")
    parser.add_argument("baseline", help="Ruta del archivo baseline")
    args = parser.parse_args()

    ignored_files = {os.path.abspath(args.baseline)}

    if args.mode == "baseline":
        collected = gather_matches(args.root, ignored_files, staged_only=False)
        write_baseline(args.baseline, collected)
        return 0

    return run_scan(args.root, args.baseline, ignored_files)


if __name__ == "__main__":
    sys.exit(main())
