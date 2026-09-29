"""Re-run the frozen pipeline in an isolated folder; do not modify original test results."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def main():
    target = ROOT / ".cache" / f"reproduction-{uuid.uuid4().hex[:8]}"
    target.mkdir(parents=True)
    for relative in ["ml", "shared"]:
        shutil.copytree(ROOT / relative, target / relative, ignore=shutil.ignore_patterns("__pycache__"))
    for relative in ["package.json", "backend/src/model.js", "scripts/check-parity.mjs", "data/raw/raisin.zip"]:
        output = target / relative; output.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(ROOT / relative, output)
    for script in ["data.py", "train.py", "check_parity.py", "evaluate.py"]:
        print(f"Reproduction: {script}", flush=True)
        subprocess.run([sys.executable, str(target / "ml" / script)], cwd=target, check=True)
    original = read(ROOT / "reports/evaluation.json")
    repeated = read(target / "reports/evaluation.json")
    original_lock = read(ROOT / "models/selection_lock.json")
    repeated_lock = read(target / "models/selection_lock.json")
    checks = {
        "split_identical": read(ROOT / "data/splits.json") == read(target / "data/splits.json"),
        "selected_candidates_identical": original_lock["selected_candidates"] == repeated_lock["selected_candidates"],
        "serving_model_identical": original_lock["serving_sha256"] == repeated_lock["serving_sha256"],
        "all_json_models_identical": all(original_lock["models"][role]["json_sha256"] == repeated_lock["models"][role]["json_sha256"] for role in original_lock["models"]),
        "test_metrics_identical": all(original["models"][role]["test"] == repeated["models"][role]["test"] for role in original["models"]),
        "test_predictions_identical": original["predictions_sha256"] == repeated["predictions_sha256"],
    }
    report = {"passed": all(checks.values()), "scope": "Fresh isolated project directory on the same host and installed environment; not a second physical computer.", "checks": checks, "versions": original_lock["versions"]}
    (ROOT / "reports/reproduction.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(report, indent=2), flush=True)
    if not report["passed"]: raise SystemExit(1)

if __name__ == "__main__":
    main()
