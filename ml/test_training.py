"""Verify model candidates, selection policy, metrics and exported inference artifacts."""
import unittest
import numpy as np
from common import CLASSES, FEATURES, protocol, scores
from train import candidates, complexity, export_model, make_model, rank


class TrainingLogicTests(unittest.TestCase):
    def test_candidate_grid_covers_every_declared_experiment(self):
        cfg = protocol()
        definitions = candidates(cfg)
        self.assertEqual(len(definitions), 23)
        self.assertEqual(len({candidate["id"] for candidate in definitions}), len(definitions))
        self.assertEqual([candidate["id"] for candidate in definitions[:2]], ["majority", "stump"])
        self.assertEqual([candidate["params"]["n_estimators"] for candidate in definitions if candidate["kind"] == "forest"],
                         cfg["forest_grid"])
        self.assertTrue(any(candidate["params"].get("ccp_alpha") == 0.01 for candidate in definitions))

    def test_selection_rank_prefers_score_then_simpler_model(self):
        cfg = {"score_tie_decimal_places": 3}
        complex_model = {"id": "complex", "f1_macro_mean": .8384, "mean_leaves": 10, "n_trees": 1}
        simple_model = {"id": "simple", "f1_macro_mean": .8383, "mean_leaves": 6, "n_trees": 1}
        better_model = {"id": "better", "f1_macro_mean": .8400, "mean_leaves": 20, "n_trees": 300}
        self.assertEqual(min([complex_model, simple_model], key=lambda item: rank(item, cfg))["id"], "simple")
        self.assertEqual(min([simple_model, better_model], key=lambda item: rank(item, cfg))["id"], "better")

    def test_tree_training_is_deterministic_and_exports_node_probabilities(self):
        x = np.array([[value + offset for offset in range(len(FEATURES))] for value in range(8)], dtype=float)
        y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
        candidate = {"id": "tree_test", "kind": "tree", "params": {"max_depth": 2, "min_samples_leaf": 1, "ccp_alpha": 0.0}}
        first, second = make_model(candidate, 42), make_model(candidate, 42)
        first.fit(x, y); second.fit(x, y)
        np.testing.assert_array_equal(first.predict_proba(x), second.predict_proba(x))
        leaves, tree_count = complexity(first)
        self.assertGreaterEqual(leaves, 2)
        self.assertEqual(tree_count, 1)
        artifact = export_model(first, candidate)
        self.assertEqual(artifact["features"], FEATURES)
        self.assertEqual(artifact["classes"], CLASSES)
        self.assertEqual(artifact["inputDtype"], "float32")
        self.assertTrue(all(0 <= value <= 1 for value in artifact["trees"][0]["pBesni"]))

    def test_random_forest_honors_tree_count_and_seed(self):
        x = np.array([[value + offset for offset in range(len(FEATURES))] for value in range(12)], dtype=float)
        y = np.array([0] * 6 + [1] * 6)
        candidate = {"id": "forest_test", "kind": "forest", "params": {"n_estimators": 5, "max_depth": 3,
                     "min_samples_leaf": 1, "max_features": "sqrt", "bootstrap": True, "n_jobs": 1}}
        first, second = make_model(candidate, 23), make_model(candidate, 23)
        first.fit(x, y); second.fit(x, y)
        np.testing.assert_array_equal(first.predict_proba(x), second.predict_proba(x))
        self.assertEqual(complexity(first)[1], 5)
        self.assertEqual(len(export_model(first, candidate)["trees"]), 5)

    def test_scores_apply_declared_threshold_and_report_both_classes(self):
        result = scores(np.array([0, 0, 1, 1]), np.array([.1, .6, .4, .9]))
        self.assertEqual(result["accuracy"], .5)
        self.assertEqual(result["f1_macro"], .5)
        self.assertEqual(result["roc_auc"], .75)
        self.assertEqual(result["confusion_matrix"], [[1, 1], [1, 1]])
        self.assertEqual(set(result["per_class"]), set(CLASSES))


if __name__ == "__main__":
    unittest.main()
