import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictionCsv } from '../src/predictionCsv.ts';

test('prediction CSV preserves source row order, probabilities and model version', () => {
  const result = {
    modelVersion: 'raisin-test',
    predictions: [
      { rowIndex: 2, label: 'Besni', probabilities: { Kecimen: 0.25, Besni: 0.75 } },
      { rowIndex: 0, label: 'Kecimen', probabilities: { Kecimen: 0.8, Besni: 0.2 } },
    ],
  };
  assert.equal(predictionCsv(result), [
    'row,label,p_Kecimen,p_Besni,model_version',
    '3,Besni,0.25,0.75,raisin-test',
    '1,Kecimen,0.8,0.2,raisin-test',
  ].join('\r\n'));
});

test('prediction CSV emits a valid header for an empty result', () => {
  assert.equal(predictionCsv({ modelVersion: 'raisin-test', predictions: [] }),
    'row,label,p_Kecimen,p_Besni,model_version');
});
