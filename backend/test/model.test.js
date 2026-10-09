import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { explainRow, loadModel, validateArtifact, predictRows } from '../src/model.js';
import features from '../../shared/features.json' with { type: 'json' };

const schema = { schemaVersion: 1, inputDtype: 'float32', threshold: .5, tieClass: 'Besni', features: features.map(f=>f.name), classes: ['Kecimen','Besni'] };
const row = Object.fromEntries(features.map(f=>[f.name,1]));
const leaf = (pBesni=.5) => ({...schema,trees:[{left:[-1],right:[-1],feature:[-2],threshold:[-2],pBesni:[pBesni]}]});
test('probability ties follow declared policy',()=>{
  const model=validateArtifact({...schema,trees:[{left:[-1],right:[-1],feature:[-2],threshold:[-2],pBesni:[.5]}]});
  assert.equal(predictRows(model,[row])[0].label,'Besni');
});
test('float32 conversion and full threshold use match tree inference',()=>{
  const model=validateArtifact({...schema,trees:[{left:[1,-1,-1],right:[2,-1,-1],feature:[0,-2,-2],threshold:[1,-2,-2],pBesni:[.5,.2,.8]}]});
  const predictions=predictRows(model,[{...row,Area:1+2e-8},{...row,Area:1+2e-7}]);
  assert.deepEqual(predictions.map(p=>p.label),['Kecimen','Besni']);
  assert.deepEqual(explainRow(model,{...row,Area:1+2e-8}),[{feature:'Area',value:1,operator:'≤',threshold:1}]);
  assert.equal(explainRow({...model,trees:[...model.trees,...model.trees]},row),null);
});
test('invalid graphs and missing model fail closed',()=>{
  assert.equal(loadModel('missing-model-directory').ready,false);
  assert.throws(()=>validateArtifact(null),/schema/);
  assert.throws(()=>validateArtifact({...schema,trees:[{left:[0],right:[0],feature:[0],threshold:[1],pBesni:[.5]}]}),/cyclic/);
  assert.throws(()=>validateArtifact({...schema,trees:[{left:[1,-1],right:[2],feature:[0,-2],threshold:[1,-2],pBesni:[.5,.2]}]}),/arrays/);
  assert.throws(()=>validateArtifact({...schema,trees:[{left:[1,-1,-1],right:[2,-1,-1],feature:[0,-2,-2],threshold:[1,-2,-2],pBesni:[.5,.2,2]}]}),/value/);
  assert.throws(()=>validateArtifact({...schema,trees:[{left:[1,-1,-1,-1],right:[2,-1,-1,-1],feature:[0,-2,-2,-2],threshold:[1,-2,-2,-2],pBesni:[.5,.2,.8,.4]}]}),/Unreachable/);
  assert.throws(()=>validateArtifact({...schema,classes:['Besni','Kecimen'],trees:[]}),/schema/);
});

test('model loader accepts a matching bundle and rejects checksum changes', t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'raisin-model-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const bytes=Buffer.from(JSON.stringify(leaf(.75)));
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(directory,'serving.json'),bytes);
  fs.writeFileSync(path.join(directory,'selection_lock.json'),JSON.stringify({serving_sha256:sha}));
  fs.writeFileSync(path.join(directory,'metadata.json'),JSON.stringify({modelSha256:sha,modelVersion:'test-model'}));
  const loaded=loadModel(directory);
  assert.equal(loaded.ready,true);
  assert.equal(predictRows(loaded.artifact,[row])[0].label,'Besni');

  fs.writeFileSync(path.join(directory,'metadata.json'),JSON.stringify({modelSha256:'changed'}));
  const rejected=loadModel(directory);
  assert.equal(rejected.ready,false);
  assert.match(rejected.error,/checksum/);
});
