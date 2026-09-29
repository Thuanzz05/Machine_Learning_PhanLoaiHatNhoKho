"""Shared paths, scoring and deterministic JSON serialization."""
from pathlib import Path
import hashlib
import json
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix, precision_recall_fscore_support

ROOT = Path(__file__).resolve().parents[1]
FEATURES = [f["name"] for f in json.loads((ROOT / "shared/features.json").read_text(encoding="utf-8"))]
CLASSES = ["Kecimen", "Besni"]

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def save_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def protocol():
    return read_json(ROOT / "ml/protocol.json")

def frame():
    return pd.read_csv(ROOT / "data/processed/raisin.csv", float_precision="round_trip").set_index("row_id")

def xy(df):
    return df[FEATURES].to_numpy(dtype=np.float64), df["Class"].map({"Kecimen": 0, "Besni": 1}).to_numpy(dtype=int)

def scores(y, probability):
    pred = (np.asarray(probability) >= protocol()["threshold"]).astype(int)
    precision, recall, f1, support = precision_recall_fscore_support(y, pred, labels=[0, 1], zero_division=0)
    return {
        "accuracy": float(accuracy_score(y, pred)),
        "f1_macro": float(f1_score(y, pred, average="macro", zero_division=0)),
        "roc_auc": float(roc_auc_score(y, probability)),
        "confusion_matrix": confusion_matrix(y, pred, labels=[0, 1]).tolist(),
        "per_class": {name: {"precision": float(precision[i]), "recall": float(recall[i]), "f1": float(f1[i]), "support": int(support[i])} for i, name in enumerate(CLASSES)},
        "n": len(y),
    }

def positive_probability(model, x):
    return model.predict_proba(x)[:, list(model.classes_).index(1)]

def verify_split_inputs():
    split = read_json(ROOT / "data/splits.json")
    if split["protocol_sha256"] != digest(ROOT / "ml/protocol.json"):
        raise ValueError("Protocol changed after split; do not train on a stale split.")
    if split["processed_sha256"] != digest(ROOT / "data/processed/raisin.csv"):
        raise ValueError("Prepared data changed after split.")
    return split
