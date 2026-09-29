import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, validateArtifact, predictRows } from '../src/model.js';
import features from '../../shared/features.json' with { type: 'json' };

const schema = { schemaVersion: 1, inputDtype: 'float32', threshold: .5, tieClass: 'Besni', features: features.map(f=>f.name), classes: ['Kecimen','Besni'] };
const row = Object.fromEntries(features.map(f=>[f.name,1]));
test('probability ties follow declared policy',()=>{
  const model=validateArtifact({...schema,trees:[{left:[-1],right:[-1],feature:[-2],threshold:[-2],pBesni:[.5]}]});
  assert.equal(predictRows(model,[row])[0].label,'Besni');
});
test('float32 conversion and full threshold use match tree inference',()=>{
  const model=validateArtifact({...schema,trees:[{left:[1,-1,-1],right:[2,-1,-1],feature:[0,-2,-2],threshold:[1,-2,-2],pBesni:[.5,.2,.8]}]});
  const predictions=predictRows(model,[{...row,Area:1+2e-8},{...row,Area:1+2e-7}]);
  assert.deepEqual(predictions.map(p=>p.label),['Kecimen','Besni']);
});
test('invalid graphs and missing model fail closed',()=>{
  assert.equal(loadModel('missing-model-directory').ready,false);
  assert.throws(()=>validateArtifact({...schema,trees:[{left:[0],right:[0],feature:[0],threshold:[1],pBesni:[.5]}]}),/cyclic/);
  assert.throws(()=>validateArtifact({...schema,classes:['Besni','Kecimen'],trees:[]}),/schema/);
});
