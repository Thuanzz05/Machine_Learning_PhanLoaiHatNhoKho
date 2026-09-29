import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import features from '../../shared/features.json' with { type: 'json' };

const modelsDir = fileURLToPath(new URL('../../models/', import.meta.url));

export function validateArtifact(model) {
  if (model.schemaVersion !== 1 || model.inputDtype !== 'float32' || model.threshold !== 0.5 || model.tieClass !== 'Besni' ||
      JSON.stringify(model.features) !== JSON.stringify(features.map(f => f.name)) ||
      JSON.stringify(model.classes) !== JSON.stringify(['Kecimen', 'Besni']) ||
      !Array.isArray(model.trees) || model.trees.length < 1 || model.trees.length > 300) throw new Error('Invalid model schema.');
  for (const tree of model.trees) {
    const n = tree.left?.length;
    if (!Number.isInteger(n) || n < 1 || n > 2000 || !['left', 'right', 'feature', 'threshold', 'pBesni'].every(key => Array.isArray(tree[key]) && tree[key].length === n)) throw new Error('Invalid tree arrays.');
    const visited = new Set();
    function visit(i) {
      if (!Number.isInteger(i) || i < 0 || i >= n || visited.has(i)) throw new Error('Invalid/cyclic tree.');
      visited.add(i);
      if (!Number.isFinite(tree.pBesni[i]) || tree.pBesni[i] < 0 || tree.pBesni[i] > 1 || !Number.isFinite(tree.threshold[i])) throw new Error('Invalid tree value.');
      if (tree.left[i] === -1 && tree.right[i] === -1) return;
      if (!Number.isInteger(tree.feature[i]) || tree.feature[i] < 0 || tree.feature[i] >= features.length) throw new Error('Invalid tree feature.');
      visit(tree.left[i]); visit(tree.right[i]);
    }
    visit(0);
    if (visited.size !== n) throw new Error('Unreachable tree node.');
  }
  return model;
}

export function predictRows(model, rows) {
  return rows.map((row, rowIndex) => {
    // scikit-learn casts tree inputs to float32 before comparing full-precision thresholds.
    const x = model.features.map(name => Math.fround(row[name]));
    let pBesni = 0;
    for (const tree of model.trees) {
      let i = 0;
      while (tree.left[i] !== -1) i = x[tree.feature[i]] <= tree.threshold[i] ? tree.left[i] : tree.right[i];
      pBesni += tree.pBesni[i];
    }
    pBesni = Math.min(1, Math.max(0, pBesni / model.trees.length));
    return { rowIndex, label: pBesni >= model.threshold ? 'Besni' : 'Kecimen', probabilities: { Kecimen: 1 - pBesni, Besni: pBesni } };
  });
}

export function loadModel(directory = modelsDir) {
  try {
    const bytes = fs.readFileSync(`${directory}/serving.json`);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    const lock = JSON.parse(fs.readFileSync(`${directory}/selection_lock.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`${directory}/metadata.json`, 'utf8'));
    if (sha !== lock.serving_sha256 || sha !== metadata.modelSha256) throw new Error('Model checksum mismatch.');
    const artifact = validateArtifact(JSON.parse(bytes));
    return { ready: true, artifact, metadata };
  } catch (error) {
    return { ready: false, error: error.message };
  }
}
