"""Audit source data and create frozen stratified development/test/CV indices."""
from collections import Counter
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold
from common import ROOT, FEATURES, protocol, save_json, read_json, digest
from download_data import acquire

def main():
    acquire(ROOT / "data", offline=True)
    cfg = protocol()
    if cfg["dataset_sha256"] != digest(ROOT / "data/raw/raisin.zip"):
        raise ValueError("Source differs from locked protocol.")
    df = pd.read_excel(ROOT / "data/raw/Raisin_Dataset/Raisin_Dataset.xlsx", sheet_name="Raisin_Grains_Dataset")
    x = df[FEATURES]
    invalid = (~np.isfinite(x).all(axis=1) | (df.Area <= 0) | (df.MinorAxisLength <= 0)
               | (df.MajorAxisLength < df.MinorAxisLength) | (df.ConvexArea < df.Area)
               | ~df.Eccentricity.between(0, 1) | (df.Extent <= 0) | (df.Extent > 1) | (df.Perimeter <= 0))
    duplicate_features = df.duplicated(FEATURES, keep=False)
    conflicts = df.groupby(FEATURES, dropna=False)["Class"].nunique().gt(1).sum()
    quality = {
        "source_sha256": cfg["dataset_sha256"], "rows": len(df), "features": FEATURES,
        "class_counts": {str(k): int(v) for k, v in df.Class.value_counts().items()},
        "missing": {str(k): int(v) for k, v in df.isna().sum().items()},
        "duplicate_rows_surplus": int(df.duplicated().sum()),
        "duplicate_feature_rows": int(duplicate_features.sum()), "conflicting_label_groups": int(conflicts),
        "invalid_geometry_excel_rows": (np.flatnonzero(invalid) + 2).tolist(),
        "removed_rows": [], "changes": "No rows removed or values modified.",
        "limitations": ["No original fruit/batch IDs; dependence beyond identical feature vectors cannot be ruled out.", "No statistical outlier removal; EDA and thresholds use development data only."],
    }
    save_json(ROOT / "reports/data_quality.json", quality)
    if invalid.any() or duplicate_features.any() or df.isna().any().any():
        raise ValueError("Review quality issues and grouping policy before creating splits.")
    df.insert(0, "row_id", [f"r{i+1:04d}" for i in range(len(df))])
    output = ROOT / "data/processed/raisin.csv"
    output.parent.mkdir(parents=True, exist_ok=True)
    csv = df.to_csv(index=False, lineterminator="\n")
    if output.exists() and output.read_text(encoding="utf-8") != csv:
        raise ValueError("Existing prepared data differs; refusing to overwrite.")
    output.write_text(csv, encoding="utf-8")
    dev, test = train_test_split(df.row_id.to_numpy(), test_size=cfg["test_fraction"], random_state=cfg["split_seed"], stratify=df.Class)
    indexed = df.set_index("row_id")
    folds = []
    for seed in cfg["cv_seeds"]:
        cv = StratifiedKFold(n_splits=cfg["cv_folds"], shuffle=True, random_state=seed)
        for fold, (train, val) in enumerate(cv.split(dev, indexed.loc[dev, "Class"]), start=1):
            folds.append({"seed": seed, "fold": fold, "train": dev[train].tolist(), "validation": dev[val].tolist()})
    split = {"protocol_sha256": digest(ROOT / "ml/protocol.json"), "processed_sha256": digest(output),
             "development": dev.tolist(), "test": test.tolist(), "folds": folds,
             "counts": {"development": len(dev), "test": len(test)},
             "class_counts": {part: dict(Counter(indexed.loc[ids, "Class"])) for part, ids in [("development", dev), ("test", test)]}}
    path = ROOT / "data/splits.json"
    if path.exists() and read_json(path) != split:
        raise ValueError("Existing split differs. Review protocol before changing held-out data.")
    save_json(path, split)
    assert not set(dev) & set(test)
    for f in folds:
        assert not set(f["train"]) & set(f["validation"])
        assert set(f["train"]) | set(f["validation"]) == set(dev)
    print(f"Data audit passed: {len(df)} rows, {len(dev)} development, {len(test)} test, {len(folds)} folds. No rows removed.")

if __name__ == "__main__":
    main()
