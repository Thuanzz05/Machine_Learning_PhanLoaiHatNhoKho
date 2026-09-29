"""Compare Node inference with Python on development rows and synthetic boundaries."""
import subprocess
import joblib
import numpy as np
from common import ROOT, FEATURES, frame, xy, read_json, save_json, positive_probability, verify_split_inputs, digest

def main():
    split = verify_split_inputs()
    lock = read_json(ROOT / "models/selection_lock.json")
    dev = frame().loc[split["development"]]
    x, _ = xy(dev)
    bundles = []
    for role in lock["models"]:
        model = joblib.load(ROOT / f"models/{role}.joblib")
        artifact = read_json(ROOT / f"models/{role}.json")
        edge = []
        for tree in artifact["trees"]:
            for feature, threshold in zip(tree["feature"], tree["threshold"]):
                if feature < 0: continue
                t = np.float32(threshold)
                for value in [np.nextafter(t, np.float32(-np.inf)), t, np.nextafter(t, np.float32(np.inf))]:
                    sample = x[0].copy(); sample[feature] = float(value); edge.append(sample)
                if len(edge) >= 300: break
            if len(edge) >= 300: break
        probes = np.vstack([x, np.asarray(edge)]) if edge else x.copy()
        probs = positive_probability(model, probes)
        bundles.append({"role": role, "model_sha256": digest(ROOT / f"models/{role}.json"), "development_count": len(x), "synthetic_count": len(edge),
                        "cases": [{"row": dict(zip(FEATURES, row.tolist())), "pBesni": float(p), "label": "Besni" if p >= .5 else "Kecimen"} for row, p in zip(probes, probs)]})
    save_json(ROOT / "reports/parity_cases.json", {"source": "Only development data and synthetic threshold probes; no test samples", "models": bundles})
    subprocess.run(["node", "scripts/check-parity.mjs"], cwd=ROOT, check=True)

if __name__ == "__main__":
    main()
