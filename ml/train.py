"""Development-only experiments and selection. This script never scores test rows."""
from datetime import datetime, timezone
import importlib.metadata
import os
import time
import joblib
from pathlib import Path
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[1] / ".cache/matplotlib"))
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier, plot_tree
from common import ROOT, FEATURES, CLASSES, protocol, frame, xy, scores, positive_probability, save_json, digest, verify_split_inputs

FIG = ROOT / "reports/figures"

def candidates(cfg):
    result = [dict(id="majority", experiment="baseline", kind="majority", params={}),
              dict(id="stump", experiment="baseline", kind="tree", params={"max_depth": 1})]
    for depth in cfg["depth_grid"]:
        result.append(dict(id=f"depth_{depth}", experiment="depth", kind="tree", params={"max_depth": depth, "min_samples_leaf": 1, "ccp_alpha": 0.0}))
    for alpha in cfg["alpha_grid"]:
        result.append(dict(id=f"alpha_{alpha:g}", experiment="pruning", kind="tree", params={"max_depth": None, "min_samples_leaf": 1, "ccp_alpha": alpha}))
    for trees in cfg["forest_grid"]:
        result.append(dict(id=f"forest_{trees}", experiment="forest", kind="forest", params={"n_estimators": trees, "max_depth": cfg["forest_max_depth"], "min_samples_leaf": cfg["forest_min_samples_leaf"], "max_features": cfg["forest_max_features"], "bootstrap": True, "n_jobs": 1}))
    return result

def make_model(candidate, seed):
    if candidate["kind"] == "majority":
        model = DummyClassifier(strategy="most_frequent")
    elif candidate["kind"] == "tree":
        model = DecisionTreeClassifier(criterion="gini", random_state=seed, **candidate["params"])
    else:
        model = RandomForestClassifier(criterion="gini", random_state=seed, **candidate["params"])
    return Pipeline([("model", model)])

def complexity(model):
    estimator = model.named_steps["model"]
    trees = estimator.estimators_ if isinstance(estimator, RandomForestClassifier) else [estimator]
    return float(np.mean([t.get_n_leaves() if hasattr(t, "tree_") else 1 for t in trees])), len(trees)

def export_model(model, candidate):
    estimator = model.named_steps["model"]
    if isinstance(estimator, DummyClassifier):
        p = float(estimator.predict_proba(np.zeros((1, len(FEATURES))))[0, 1])
        trees = [{"left": [-1], "right": [-1], "feature": [-2], "threshold": [-2.0], "pBesni": [p]}]
    else:
        trees = []
        for tree in (estimator.estimators_ if isinstance(estimator, RandomForestClassifier) else [estimator]):
            t = tree.tree_
            values = t.value[:, 0, :]
            trees.append({"left": t.children_left.tolist(), "right": t.children_right.tolist(), "feature": t.feature.tolist(),
                          "threshold": t.threshold.tolist(), "pBesni": (values[:, 1] / values.sum(axis=1)).tolist()})
    return {"schemaVersion": 1, "candidateId": candidate["id"], "kind": candidate["kind"], "features": FEATURES,
            "classes": CLASSES, "inputDtype": "float32", "threshold": protocol()["threshold"], "tieClass": "Besni", "trees": trees}

def figure(name):
    plt.tight_layout()
    plt.savefig(FIG / f"{name}.png", dpi=170, bbox_inches="tight")
    plt.close()

def plots(dev, cv, summaries, path, fitted):
    fig, axes = plt.subplots(2, 4, figsize=(13, 6))
    for feature, ax in zip(FEATURES, axes.flat):
        for cls, color in zip(CLASSES, ["#246b50", "#a46627"]):
            ax.hist(dev.loc[dev.Class == cls, feature], bins=18, alpha=.5, label=cls, color=color)
        ax.set_title(feature)
        ax.set_ylabel("Số mẫu phát triển")
    axes.flat[-1].axis("off")
    axes.flat[0].legend()
    figure("eda_distributions")
    corr = dev[FEATURES].corr()
    plt.figure(figsize=(8, 6)); plt.imshow(corr, vmin=-1, vmax=1, cmap="RdYlGn"); plt.colorbar(label="Pearson r")
    plt.xticks(range(7), FEATURES, rotation=45, ha="right"); plt.yticks(range(7), FEATURES)
    for i in range(7):
        for j in range(7): plt.text(j, i, f"{corr.iloc[i,j]:.2f}", ha="center", va="center", fontsize=8)
    plt.title("Tương quan trên 720 mẫu phát triển"); figure("eda_correlation")
    for exp, filename, title in [("depth", "depth_curve", "E01 — Độ sâu"), ("pruning", "alpha_curve", "E02 — Cắt tỉa"), ("forest", "forest_curve", "E03 — Số cây")]:
        selected = [s for s in summaries if s["experiment"] == exp]
        axis = np.arange(len(selected))
        labels = [str(s["params"].get("max_depth") if exp == "depth" else s["params"].get("ccp_alpha") if exp == "pruning" else s["params"]["n_estimators"]) for s in selected]
        plt.figure(figsize=(9, 4))
        plt.plot(axis, [s["train_f1_macro_mean"] for s in selected], "o-", label="Train CV")
        plt.errorbar(axis, [s["f1_macro_mean"] for s in selected], yerr=[s["f1_macro_std"] for s in selected], fmt="o-", capsize=4, label="Validation, mean ± std 5 seed")
        plt.xticks(axis, labels); plt.xlabel("max_depth" if exp == "depth" else "ccp_alpha" if exp == "pruning" else "Số cây")
        plt.ylabel("F1-macro"); plt.ylim(0, 1.02); plt.legend(); plt.title(title); figure(filename)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].step(path["ccp_alphas"], path["impurities"], where="post"); axes[0].set_ylabel("Tổng impurity có trọng số")
    axes[1].step(path["ccp_alphas"], path["leaves"], where="post"); axes[1].set_ylabel("Số lá")
    for ax in axes: ax.set_xlabel("ccp_alpha")
    fig.suptitle("Pruning path: train của seed 11, fold 1"); figure("pruning_path")
    plt.figure(figsize=(8, 4))
    for role, (_, candidate) in fitted.items():
        means = cv[cv.candidate == candidate["id"]].groupby("seed").validation_f1_macro.mean()
        plt.plot(means.index.astype(str), means.values, "o-", label=role)
    plt.ylabel("F1-macro validation trung bình 5 fold"); plt.xlabel("Seed CV và mô hình"); plt.title("E04 — Độ ổn định"); plt.legend(); figure("seed_stability")
    estimator = fitted["tree"][0].named_steps["model"]
    plt.figure(figsize=(max(14, estimator.get_n_leaves() * .7), max(7, estimator.get_depth() * 1.4)))
    plot_tree(estimator, feature_names=FEATURES, class_names=CLASSES, filled=True, rounded=True, proportion=True, precision=3, fontsize=7)
    plt.title("Cây cắt tỉa cuối — hiển thị toàn bộ cây"); figure("final_tree")

def main():
    cfg = protocol()
    split = verify_split_inputs()
    if (ROOT / "reports/evaluation.json").exists():
        raise ValueError("Final evaluation exists. Use the documented isolated reproduction workflow; do not tune after test.")
    all_data = frame()
    dev = all_data.loc[split["development"]]
    FIG.mkdir(parents=True, exist_ok=True)
    (ROOT / "models").mkdir(exist_ok=True)
    definitions = candidates(cfg)
    records = []
    for candidate in definitions:
        print(f"CV {candidate['id']} — 25 fits", flush=True)
        for f in split["folds"]:
            xtrain, ytrain = xy(dev.loc[f["train"]]); xval, yval = xy(dev.loc[f["validation"]])
            model = make_model(candidate, f["seed"])
            start = time.perf_counter(); model.fit(xtrain, ytrain); fit_ms = (time.perf_counter()-start)*1000
            start = time.perf_counter(); pval = positive_probability(model, xval); predict_ms = (time.perf_counter()-start)*1000
            train_score = scores(ytrain, positive_probability(model, xtrain)); val_score = scores(yval, pval)
            leaves, trees = complexity(model)
            row = {"candidate": candidate["id"], "seed": f["seed"], "fold": f["fold"], "fit_ms": fit_ms, "predict_ms": predict_ms, "leaves": leaves, "trees": trees}
            for key in ("accuracy", "f1_macro", "roc_auc"):
                row[f"train_{key}"] = train_score[key]; row[f"validation_{key}"] = val_score[key]
            records.append(row)
    cv = pd.DataFrame(records)
    cv.to_csv(ROOT / "reports/cv_results.csv", index=False)
    summaries = []
    for candidate in definitions:
        rows = cv[cv.candidate == candidate["id"]]
        seed_means = rows.groupby("seed").mean(numeric_only=True)
        summary = {**candidate, "seed_results": []}
        for metric in ("accuracy", "f1_macro", "roc_auc"):
            summary[f"{metric}_mean"] = float(seed_means[f"validation_{metric}"].mean())
            summary[f"{metric}_std"] = float(seed_means[f"validation_{metric}"].std(ddof=1))
            summary[f"train_{metric}_mean"] = float(seed_means[f"train_{metric}"].mean())
        for seed, row in seed_means.iterrows():
            summary["seed_results"].append({"seed": int(seed), **{m: float(row[f"validation_{m}"]) for m in ("accuracy", "f1_macro", "roc_auc")}})
        summary.update(mean_leaves=float(rows.leaves.mean()), n_trees=int(rows.trees.iloc[0]), fit_ms_mean=float(rows.fit_ms.mean()), predict_ms_mean=float(rows.predict_ms.mean()))
        summaries.append(summary)
    def rank(s):
        return (-round(s["f1_macro_mean"], cfg["score_tie_decimal_places"]), s["mean_leaves"], s["n_trees"], s["id"])
    tree = min([s for s in summaries if s["experiment"] == "pruning" and s["params"]["ccp_alpha"] > 0], key=rank)
    forest = min([s for s in summaries if s["experiment"] == "forest"], key=rank)
    final_choices = {"majority": summaries[0], "stump": summaries[1], "tree": tree, "forest": forest}
    serving_role = min(final_choices, key=lambda role: rank(final_choices[role]))
    fitted = {}
    xdev, ydev = xy(dev)
    for role, candidate in final_choices.items():
        model = make_model(candidate, cfg["final_seed"]); model.fit(xdev, ydev)
        joblib.dump(model, ROOT / f"models/{role}.joblib")
        save_json(ROOT / f"models/{role}.json", export_model(model, candidate))
        fitted[role] = (model, candidate)
    serving_path = ROOT / "models/serving.json"
    serving_path.write_bytes((ROOT / f"models/{serving_role}.json").read_bytes())
    f = split["folds"][0]; xp, yp = xy(dev.loc[f["train"]])
    pruning = DecisionTreeClassifier(random_state=f["seed"]).cost_complexity_pruning_path(xp, yp)
    path = {"seed": f["seed"], "fold": f["fold"], "training_ids": f["train"], "ccp_alphas": pruning.ccp_alphas.tolist(), "impurities": pruning.impurities.tolist(),
            "leaves": [int(DecisionTreeClassifier(random_state=f["seed"], ccp_alpha=float(a)).fit(xp, yp).get_n_leaves()) for a in pruning.ccp_alphas]}
    save_json(ROOT / "reports/pruning_path.json", path)
    save_json(ROOT / "reports/cv_summary.json", summaries)
    groups = {f: dev[f].quantile(cfg["error_group_quantiles"]).tolist() for f in cfg["error_group_features"]}
    save_json(ROOT / "reports/error_group_boundaries.json", groups)
    lock = {"created_at_utc": datetime.now(timezone.utc).isoformat(), "selection_basis": "Development CV only, before final test", "serving_role": serving_role,
            "protocol_sha256": digest(ROOT / "ml/protocol.json"), "split_sha256": digest(ROOT / "data/splits.json"), "processed_sha256": digest(ROOT / "data/processed/raisin.csv"),
            "serving_sha256": digest(serving_path), "error_groups_sha256": digest(ROOT / "reports/error_group_boundaries.json"),
            "selected_candidates": {role: c["id"] for role, c in final_choices.items()},
            "models": {role: {"joblib_sha256": digest(ROOT / f"models/{role}.joblib"), "json_sha256": digest(ROOT / f"models/{role}.json")} for role in final_choices},
            "versions": {name: importlib.metadata.version(name) for name in ["numpy", "pandas", "scikit-learn", "matplotlib", "openpyxl", "joblib"]}}
    save_json(ROOT / "models/selection_lock.json", lock)
    dev.describe(include="all").to_csv(ROOT / "reports/development_description.csv")
    plots(dev, cv, summaries, path, fitted)
    print(f"Frozen selected model: {serving_role} / {final_choices[serving_role]['id']}. Test not evaluated.", flush=True)

if __name__ == "__main__":
    main()
