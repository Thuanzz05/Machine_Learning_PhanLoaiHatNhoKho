"""Checks for reproducible acquisition and preservation of the UCI source."""
from io import BytesIO
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import download_data as data

SOURCE = data.ROOT / "data/raw/raisin.zip"

class IntegrityTests(unittest.TestCase):
    def test_bad_checksum(self):
        with self.assertRaisesRegex(ValueError, "checksum differs"):
            data.verify_archive(b"wrong source")

    def test_missing_offline_source(self):
        with tempfile.TemporaryDirectory(dir=data.ROOT / "data") as folder, patch.object(data, "urlopen") as network:
            with self.assertRaises(FileNotFoundError):
                data.acquire(Path(folder), offline=True)
            network.assert_not_called()

    def test_bad_download_is_not_saved(self):
        with tempfile.TemporaryDirectory(dir=data.ROOT / "data") as folder, patch.object(data, "urlopen", return_value=BytesIO(b"wrong source")):
            with self.assertRaises(ValueError):
                data.acquire(Path(folder))
            self.assertFalse((Path(folder) / "raw/raisin.zip").exists())

@unittest.skipUnless(SOURCE.exists(), "Download the source first.")
class SourceTests(unittest.TestCase):
    def test_download_then_offline_repeat(self):
        with tempfile.TemporaryDirectory(dir=data.ROOT / "data") as folder:
            target = Path(folder)
            with patch.object(data, "urlopen", return_value=BytesIO(SOURCE.read_bytes())) as network:
                first = data.acquire(target)
                network.assert_called_once()
            self.assertEqual(first["inspection"]["row_count"], 900)
            self.assertEqual(first["inspection"]["class_counts"], {"Kecimen": 450, "Besni": 450})
            with patch.object(data, "urlopen") as network:
                second = data.acquire(target, offline=True)
                network.assert_not_called()
            self.assertEqual(first["files"], second["files"])
            self.assertEqual(first["downloaded_at_utc"], second["downloaded_at_utc"])
            for item in first["files"]:
                self.assertEqual(data.sha256((target / item["path"]).read_bytes()), item["sha256"])

    def test_modified_file_is_preserved(self):
        with tempfile.TemporaryDirectory(dir=data.ROOT / "data") as folder:
            target = Path(folder)
            data.preserve_file(target / "raw/raisin.zip", SOURCE.read_bytes())
            data.acquire(target, offline=True)
            edited = target / "raw/Raisin_Dataset/Raisin_Dataset.txt"
            edited.write_text("local edit", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Existing file differs"):
                data.acquire(target, offline=True)
            self.assertEqual(edited.read_text(encoding="utf-8"), "local edit")

if __name__ == "__main__":
    unittest.main()

