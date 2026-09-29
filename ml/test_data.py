"""Verify source, row preservation and the held-out boundary before scoring test."""
import unittest
import numpy as np
import pandas as pd
from common import ROOT, FEATURES, frame, protocol, verify_split_inputs

class SplitTests(unittest.TestCase):
    def test_no_rows_changed_or_dropped(self):
        original = pd.read_excel(ROOT / "data/raw/Raisin_Dataset/Raisin_Dataset.xlsx", sheet_name="Raisin_Grains_Dataset")
        actual = frame()
        self.assertEqual(len(actual), 900)
        np.testing.assert_array_equal(actual[FEATURES].to_numpy(), original[FEATURES].to_numpy())
        self.assertEqual(actual.Class.tolist(), original.Class.tolist())
        self.assertTrue(actual.index.is_unique)
        self.assertNotIn("Class", FEATURES)
        self.assertNotIn("row_id", FEATURES)

    def test_every_fold_excludes_test_and_covers_development(self):
        split = verify_split_inputs()
        dev, test = set(split["development"]), set(split["test"])
        self.assertEqual((len(dev), len(test)), (720, 180))
        self.assertFalse(dev & test)
        self.assertEqual(dev | test, set(frame().index))
        self.assertEqual(len(split["folds"]), 25)
        for seed in protocol()["cv_seeds"]:
            seen = []
            for fold in [f for f in split["folds"] if f["seed"] == seed]:
                train, val = set(fold["train"]), set(fold["validation"])
                self.assertFalse(train & val)
                self.assertFalse((train | val) & test)
                self.assertEqual(train | val, dev)
                self.assertEqual((len(train), len(val)), (576, 144))
                self.assertEqual(frame().loc[list(val)].Class.value_counts().to_dict(), {"Kecimen": 72, "Besni": 72})
                seen.extend(val)
            self.assertEqual(len(seen), len(set(seen)))
            self.assertEqual(set(seen), dev)

if __name__ == "__main__":
    unittest.main()
