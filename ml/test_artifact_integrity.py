"""Check the frozen byte contract, including Git checkout line endings."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import common
from common import ROOT, digest, read_json, save_json


class ArtifactIntegrityTests(unittest.TestCase):
    def test_frozen_files_still_match_historical_lock(self):
        lock = read_json(ROOT / "models/selection_lock.json")
        for relative, key in [("ml/protocol.json", "protocol_sha256"),
                              ("data/splits.json", "split_sha256"),
                              ("models/serving.json", "serving_sha256"),
                              ("reports/error_group_boundaries.json", "error_groups_sha256")]:
            with self.subTest(file=relative):
                self.assertEqual(digest(ROOT / relative), lock[key])
        evaluation = read_json(ROOT / "reports/evaluation.json")
        self.assertEqual(digest(ROOT / "models/selection_lock.json"), evaluation["selection_lock_sha256"])
        self.assertEqual(digest(ROOT / "reports/test_predictions.csv"), evaluation["predictions_sha256"])

    def test_json_serialization_preserves_original_model_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "model.json"
            for role in ["majority", "stump", "tree", "forest"]:
                original = ROOT / f"models/{role}.json"
                save_json(target, read_json(original))
                self.assertEqual(target.read_bytes(), original.read_bytes())
                self.assertNotIn(b"\r\r\n", target.read_bytes())

    def test_real_protocol_change_is_still_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "ml").mkdir(); (root / "data").mkdir()
            original = (ROOT / "ml/protocol.json").read_text(encoding="utf-8")
            seed = read_json(ROOT / "ml/protocol.json")["split_seed"]
            changed = original.replace(f'"split_seed": {seed}', f'"split_seed": {seed + 1}')
            self.assertNotEqual(original, changed)
            (root / "ml/protocol.json").write_text(changed, encoding="utf-8", newline="\n")
            shutil.copy2(ROOT / "data/splits.json", root / "data/splits.json")
            with patch.object(common, "ROOT", root), self.assertRaisesRegex(ValueError, "Protocol changed"):
                common.verify_split_inputs()

    @unittest.skipUnless(shutil.which("git"), "Git is required to verify checkout behavior.")
    def test_git_checkout_preserves_hashes_with_both_autocrlf_settings(self):
        files = ["ml/protocol.json", "data/splits.json", "models/serving.json",
                 "models/selection_lock.json", "reports/test_predictions.csv",
                 "reports/error_group_boundaries.json"]
        with tempfile.TemporaryDirectory() as folder:
            repo = Path(folder) / "repo"; repo.mkdir()
            for name in [".gitattributes", *files]:
                dst = repo / name; dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(ROOT / name, dst)
            subprocess.run(["git", "init", "-q", str(repo)], check=True, capture_output=True)
            subprocess.run(["git", "-C", str(repo), "-c", "core.autocrlf=true", "add", "."], check=True, capture_output=True)
            for setting in ["false", "true"]:
                checkout = Path(folder) / setting
                subprocess.run(["git", "-C", str(repo), "-c", f"core.autocrlf={setting}",
                                "checkout-index", "--all", f"--prefix={checkout.as_posix()}/"],
                               check=True, capture_output=True)
                for name in files:
                    with self.subTest(autocrlf=setting, file=name):
                        self.assertEqual(digest(checkout / name), digest(ROOT / name))


if __name__ == "__main__":
    unittest.main()
