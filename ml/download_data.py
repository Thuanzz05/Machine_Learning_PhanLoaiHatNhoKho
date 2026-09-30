"""Fetch and inspect the pinned UCI Raisin source without changing its data."""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
import math
from pathlib import Path
import platform
import sys
from urllib.request import Request, urlopen
from zipfile import ZipFile

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
URL = "https://archive.ics.uci.edu/static/public/850/raisin.zip"
EXPECTED_SHA256 = "5d516c040923fd154ecf85e31b6e1b5a096724fa0e68d588c33fb5a2f0c3e5db"
DATA_SHEET = "Raisin_Grains_Dataset"
FEATURES = (
    "Area", "MajorAxisLength", "MinorAxisLength", "Eccentricity",
    "ConvexArea", "Extent", "Perimeter",
)
MEMBERS = (
    "Raisin_Dataset/Raisin_Dataset.xlsx",
    "Raisin_Dataset/Raisin_Dataset.arff",
    "Raisin_Dataset/Raisin_Dataset.txt",
)


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def verify_archive(payload: bytes) -> None:
    actual = sha256(payload)
    if actual != EXPECTED_SHA256:
        raise ValueError(
            f"Source checksum differs: expected {EXPECTED_SHA256}, got {actual}. "
            "Keep the existing source and review the change before proceeding."
        )


def preserve_file(path: Path, payload: bytes) -> None:
    """Never overwrite a locally modified source file."""
    if path.exists():
        if path.read_bytes() != payload:
            raise ValueError(f"Existing file differs; leaving it unchanged: {path}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as stream:
        stream.write(payload)


def inspect_workbook(payload: bytes) -> dict:
    book = openpyxl.load_workbook(BytesIO(payload), read_only=True, data_only=False)
    try:
        sheet = book[DATA_SHEET]
        rows = sheet.iter_rows(values_only=True)
        columns = next(rows)
        if columns != FEATURES + ("Class",):
            raise ValueError(f"Unexpected workbook header: {columns}")
        values = list(rows)
        if len(values) != 900:
            raise ValueError(f"Expected 900 source records; found {len(values)}")
        missing = {name: 0 for name in columns}
        types = {name: Counter() for name in columns}
        classes = Counter()
        for excel_row, row in enumerate(values, start=2):
            for name, value in zip(columns, row):
                types[name][type(value).__name__] += 1
                if value is None or value == "":
                    missing[name] += 1
                if name != "Class":
                    if type(value) not in (int, float) or not math.isfinite(value):
                        raise ValueError(f"Non-finite/non-numeric cell: {name}, Excel row {excel_row}")
                elif value not in ("Kecimen", "Besni"):
                    raise ValueError(f"Unknown label at Excel row {excel_row}: {value!r}")
            classes[row[-1]] += 1
        return {
            "sheet_names": book.sheetnames,
            "data_sheet": DATA_SHEET,
            "header_excel_row": 1,
            "first_data_excel_row": 2,
            "last_data_excel_row": 901,
            "row_count": len(values),
            "feature_count": len(FEATURES),
            "columns": list(columns),
            "class_counts": dict(classes),
            "missing_by_column": missing,
            "cell_types_by_column": {name: dict(counts) for name, counts in types.items()},
            "scope": "Source structure only; no cleaning, duplicate audit, EDA, split or training.",
        }
    finally:
        book.close()


def acquire(data_dir: Path, *, offline: bool = False) -> dict:
    raw = data_dir / "raw"
    archive_path = raw / "raisin.zip"
    downloaded_at = None
    if archive_path.exists():
        payload = archive_path.read_bytes()
    else:
        if offline:
            raise FileNotFoundError(f"Offline source missing: {archive_path}")
        request = Request(URL, headers={"User-Agent": "Raisin-Project18/1.0"})
        with urlopen(request, timeout=30) as response:
            payload = response.read(5_000_001)
        if len(payload) > 5_000_000:
            raise ValueError("Download exceeds the expected source archive size limit.")
        downloaded_at = datetime.now(timezone.utc).isoformat()
    verify_archive(payload)

    # Read named entries only. Do not extract arbitrary archive paths.
    with ZipFile(BytesIO(payload)) as outer:
        nested = outer.read("Raisin_Dataset.zip")
    with ZipFile(BytesIO(nested)) as inner:
        members = {name: inner.read(name) for name in MEMBERS}
    inspection = inspect_workbook(members[MEMBERS[0]])
    files = {"raw/raisin.zip": payload, "raw/Raisin_Dataset.zip": nested}
    files.update({f"raw/{name}": content for name, content in members.items()})
    # Detect conflicts before writing any extracted files.
    for relative, content in files.items():
        destination = data_dir / relative
        if destination.exists() and destination.read_bytes() != content:
            raise ValueError(f"Existing file differs; leaving it unchanged: {destination}")
    for relative, content in files.items():
        preserve_file(data_dir / relative, content)

    manifest_path = data_dir / "source_manifest.json"
    previous = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    same_source = previous.get("archive_sha256") == EXPECTED_SHA256
    if same_source:
        downloaded_at = previous.get("downloaded_at_utc", downloaded_at)
    timestamp_basis = "script_download_completion_utc"
    if downloaded_at is None:
        # An existing archive may have been obtained before the script was added.
        downloaded_at = datetime.fromtimestamp(archive_path.stat().st_mtime, timezone.utc).isoformat()
        timestamp_basis = "existing_archive_last_modified_utc"
    elif same_source:
        timestamp_basis = previous.get("download_time_basis", timestamp_basis)
    manifest = {
        "manifest_version": 1,
        "dataset": "Raisin",
        "uci_id": 850,
        "source_page": "https://archive.ics.uci.edu/dataset/850/raisin",
        "download_url": URL,
        "doi": "https://doi.org/10.24432/C5660T",
        "license": {"name": "CC BY 4.0", "url": "https://creativecommons.org/licenses/by/4.0/"},
        "citation": "Çinar, İ., Koklu, M., & Tasdemir, S. (2020). Raisin [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5660T.",
        "paper_doi": "https://doi.org/10.30855/gmbd.2020.03.03",
        "downloaded_at_utc": downloaded_at,
        "download_time_basis": timestamp_basis,
        "verified_at_utc": datetime.now(timezone.utc).isoformat(),
        "archive_sha256": EXPECTED_SHA256,
        "checksum_basis": "SHA-256 of the official UCI download first acquired on 2026-09-29; pinned by this project, not a UCI-published checksum.",
        "files": [
            {"path": relative, "bytes": len(content), "sha256": sha256(content)}
            for relative, content in files.items()
        ],
        "inspection": inspection,
        "data_changes": "None. Original ZIP, XLSX, ARFF and TXT bytes are preserved.",
        "inspection_environment": {"python": platform.python_version(), "openpyxl": openpyxl.__version__},
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\r\n")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Verify/extract the local archive without network access.")
    args = parser.parse_args()
    try:
        manifest = acquire(ROOT / "data", offline=args.offline)
    except (OSError, ValueError, KeyError) as error:
        print(f"Data acquisition failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps({
        "manifest": "data/source_manifest.json",
        "rows": manifest["inspection"]["row_count"],
        "class_counts": manifest["inspection"]["class_counts"],
        "archive_sha256": manifest["archive_sha256"],
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
