import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateArtifact, predictRows } from '../backend/src/model.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const input = JSON.parse(fs.readFileSync(`${root}/reports/parity_cases.json`, 'utf8'));
const cfg = JSON.parse(fs.readFileSync(`${root}/ml/protocol.json`, 'utf8'));
const output = { source: input.source, tolerance: cfg.parity_absolute_tolerance, models: [], passed: true };
for (const bundle of input.models) {
  const bytes = fs.readFileSync(`${root}/models/${bundle.role}.json`);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha !== bundle.model_sha256) throw new Error('Parity fixture/model mismatch.');
  const model = validateArtifact(JSON.parse(bytes));
  const predictions = predictRows(model, bundle.cases.map(c => c.row));
  let maxError = 0, mismatches = 0;
  predictions.forEach((p, i) => {
    maxError = Math.max(maxError, Math.abs(p.probabilities.Besni - bundle.cases[i].pBesni));
    if (p.label !== bundle.cases[i].label) mismatches++;
  });
  const passed = mismatches === 0 && maxError <= output.tolerance;
  output.models.push({ role: bundle.role, modelSha256: sha, cases: predictions.length, developmentCount: bundle.development_count, syntheticCount: bundle.synthetic_count, labelMismatches: mismatches, maxProbabilityError: maxError, passed });
  output.passed &&= passed;
}
fs.writeFileSync(`${root}/reports/parity.json`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (!output.passed) process.exitCode = 1;
