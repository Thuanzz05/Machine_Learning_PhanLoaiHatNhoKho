"""One final batch of held-out evaluation for the four previously frozen models."""
from datetime import datetime, timezone
import os
from pathlib import Path
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[1] / ".cache/matplotlib"))
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import roc_curve
from common import ROOT, FEATURES, CLASSES, read_json, save_json, digest, frame, xy, scores, positive_probability, verify_split_inputs

def main():
    split = verify_split_inputs()
    lock = read_json(ROOT / "models/selection_lock.json")
    for relative, key in [("ml/protocol.json", "protocol_sha256"), ("data/splits.json", "split_sha256"), ("models/serving.json", "serving_sha256"), ("reports/error_group_boundaries.json", "error_groups_sha256")]:
        if digest(ROOT / relative) != lock[key]: raise ValueError(f"Frozen file changed: {relative}")
    parity = read_json(ROOT / "reports/parity.json")
    if not parity["passed"]: raise ValueError("Python/Node parity has not passed.")
    for role, entry in lock["models"].items():
        for suffix, key in [("json", "json_sha256"), ("joblib", "joblib_sha256")]:
            if digest(ROOT / f"models/{role}.{suffix}") != entry[key]: raise ValueError(f"Frozen model changed: {role}")
        if not any(p["role"] == role and p["passed"] and p["modelSha256"] == entry["json_sha256"] for p in parity["models"]): raise ValueError("Stale parity evidence.")
    lock_hash = digest(ROOT / "models/selection_lock.json")
    output = ROOT / "reports/evaluation.json"
    if output.exists():
        if read_json(output)["selection_lock_sha256"] != lock_hash: raise ValueError("An evaluation exists for a different frozen selection. Do not tune against test.")
        print("Final evaluation already exists for this lock; reused without another test run.")
        return
    df = frame(); dev, test = df.loc[split["development"]], df.loc[split["test"]]
    xdev, ydev = xy(dev); xtest, ytest = xy(test)
    cv = read_json(ROOT / "reports/cv_summary.json")
    result = {"evaluated_at_utc": datetime.now(timezone.utc).isoformat(), "selection_lock_sha256": lock_hash,
              "serving_role": lock["serving_role"], "class_order": CLASSES, "test_used_for_selection": False, "models": {}}
    predictions = pd.DataFrame({"row_id": test.index, "actual": test.Class.to_numpy()})
    curves = {}
    models = {}
    for role in lock["models"]:
        model = joblib.load(ROOT / f"models/{role}.joblib"); models[role] = model
        pdev, ptest = positive_probability(model, xdev), positive_probability(model, xtest)
        train_score, test_score = scores(ydev, pdev), scores(ytest, ptest)
        curves[role] = (ytest, ptest)
        result["models"][role] = {"candidateId": lock["selected_candidates"][role], "train": train_score, "test": test_score,
                                  "gap": {metric: train_score[metric] - test_score[metric] for metric in ["accuracy", "f1_macro", "roc_auc"]},
                                  "cv": next(s for s in cv if s["id"] == lock["selected_candidates"][role])}
        predictions[f"{role}_pBesni"] = ptest
        predictions[f"{role}_label"] = [CLASSES[int(p >= .5)] for p in ptest]
    selected = lock["serving_role"]
    selected_p = curves[selected][1]; selected_pred = (selected_p >= .5).astype(int)
    boundaries = read_json(ROOT / "reports/error_group_boundaries.json")
    groups = []
    for feature, cutoffs in boundaries.items():
        assignment = np.searchsorted(cutoffs, test[feature].to_numpy(), side="right")
        for group in range(4):
            mask = assignment == group; n = int(mask.sum()); errors = int((selected_pred[mask] != ytest[mask]).sum())
            groups.append({"feature": feature, "group": group + 1, "lower": None if group == 0 else cutoffs[group-1], "upper": None if group == 3 else cutoffs[group], "interval": "lower inclusive, upper exclusive", "n": n, "errors": errors, "error_rate": errors/n if n else None})
    result["error_groups"] = groups
    errors = []
    for i in np.flatnonzero(selected_pred != ytest):
        errors.append({"row_id": str(test.index[i]), "actual": CLASSES[ytest[i]], "predicted": CLASSES[selected_pred[i]], "pBesni": float(selected_p[i]), "features": {f: float(test.iloc[i][f]) for f in FEATURES}})
    result["errors"] = errors
    result["paired_forest_vs_tree"] = {
        "tree_wrong_forest_right": int(((predictions.tree_label != predictions.actual) & (predictions.forest_label == predictions.actual)).sum()),
        "tree_right_forest_wrong": int(((predictions.tree_label == predictions.actual) & (predictions.forest_label != predictions.actual)).sum()),
        "note": "Descriptive paired comparison only; serving model was selected before test.",
    }
    result["feature_importance"] = {role: dict(zip(FEATURES, models[role].named_steps["model"].feature_importances_.tolist())) for role in ["tree", "forest"]}
    predictions.to_csv(ROOT / "reports/test_predictions.csv", index=False, lineterminator="\r\n")
    result["predictions_sha256"] = digest(ROOT / "reports/test_predictions.csv")
    save_json(output, result)
    figs = ROOT / "reports/figures"
    def finish(name):
        plt.tight_layout(); plt.savefig(figs / f"{name}.png", dpi=170, bbox_inches="tight"); plt.close()
    fig, axes = plt.subplots(1, 4, figsize=(13, 3.5))
    for ax, (role, values) in zip(axes, result["models"].items()):
        matrix = values["test"]["confusion_matrix"]
        ax.imshow(matrix, cmap="Greens", vmin=0, vmax=90)
        for i in range(2):
            for j in range(2): ax.text(j, i, str(matrix[i][j]), ha="center", va="center", color="white" if matrix[i][j]>50 else "black")
        ax.set_xticks([0,1], CLASSES); ax.set_yticks([0,1], CLASSES); ax.set_xlabel("Nhãn dự đoán"); ax.set_title(role)
    axes[0].set_ylabel("Nhãn thật"); finish("confusion_matrices")
    plt.figure(figsize=(6, 5))
    for role, (actual, p) in curves.items():
        fpr, tpr, _ = roc_curve(actual, p)
        plt.plot(fpr, tpr, label=f"{role}: AUC={result['models'][role]['test']['roc_auc']:.3f}")
    plt.plot([0,1],[0,1],"k--", alpha=.4); plt.xlabel("False positive rate (Besni)"); plt.ylabel("True positive rate (Besni)"); plt.legend(); plt.title("ROC — 180 mẫu test cuối"); finish("roc_test")
    plt.figure(figsize=(8,4)); idx=np.arange(4)
    plt.bar(idx-.18,[s["train"]["f1_macro"] for s in result["models"].values()],.36,label="Train cuối (720)",color="#729362")
    plt.bar(idx+.18,[s["test"]["f1_macro"] for s in result["models"].values()],.36,label="Test (180)",color="#2b6248")
    plt.xticks(idx,list(result["models"])); plt.ylim(0,1.05); plt.ylabel("F1-macro"); plt.legend(); finish("train_test_gap")
    plt.figure(figsize=(10,4)); labels=[f"{g['feature']} Q{g['group']}\nn={g['n']}" for g in groups]
    plt.bar(labels,[g["error_rate"] or 0 for g in groups],color="#a47637"); plt.ylabel("Tỷ lệ lỗi"); plt.title("Nhóm theo ngưỡng tứ phân vị từ tập phát triển"); finish("error_groups")
    limitations = ["Chỉ phân biệt Kecimen/Besni bằng bảy số đo; không nhận ảnh trực tiếp.", "900 mẫu từ một nguồn; chưa có xác nhận trên dây chuyền hoặc dữ liệu ngoài nguồn.", "Xác suất từ tỷ lệ lớp tại lá, chưa hiệu chuẩn; không phải bảo đảm đúng cho từng mẫu.", "Không có ID lô/quả gốc để loại trừ mọi dạng phụ thuộc; đã kiểm không trùng đặc trưng.", "Chỉ hỗ trợ tham khảo; không tự động loại sản phẩm. Chưa triển khai cảnh báo ngoài phân phối."]
    metadata = {"status": "ready", "modelVersion": f"raisin-1-{lock['serving_sha256'][:12]}", "modelSha256": lock["serving_sha256"], "selectedRole": selected, "candidateId": lock["selected_candidates"][selected],
                "metrics": result["models"][selected]["test"], "trainMetrics": result["models"][selected]["train"], "comparison": result["models"], "experiments": cv,
                "errorGroups": groups, "featureImportance": result["feature_importance"], "split": split["counts"], "splitClassCounts": split["class_counts"],
                "cvSeeds": [11,23,42,67,101], "selectionMetric": "F1-macro validation, mean of 5 seed averages", "finalSeed": 42, "threshold": .5, "tieClass": "Besni", "calibrated": False,
                "trainedAt": lock["created_at_utc"], "evaluatedAt": result["evaluated_at_utc"], "source": "https://archive.ics.uci.edu/dataset/850/raisin", "sourceSha256": read_json(ROOT / "ml/protocol.json")["dataset_sha256"],
                "versions": lock["versions"], "parity": parity, "limitations": limitations,
                "figures": ["depth_curve", "pruning_path", "alpha_curve", "forest_curve", "seed_stability", "confusion_matrices", "roc_test", "train_test_gap", "error_groups", "final_tree", "eda_distributions", "eda_correlation"]}
    save_json(ROOT / "models/metadata.json", metadata)
    print({role: {m: round(values["test"][m],6) for m in ["accuracy", "f1_macro", "roc_auc"]} for role, values in result["models"].items()})

if __name__ == "__main__":
    main()
