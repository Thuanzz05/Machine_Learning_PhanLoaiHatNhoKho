import { test } from 'node:test';
import assert from 'node:assert/strict';
import { histogram } from '../src/histogram.ts';

test('histogram represents constant and empty batches without zero-width duplicate intervals', () => {
  assert.deepEqual(histogram([]),[]);
  assert.deepEqual(histogram([80000,80000,80000]),[{lower:80000,upper:80000,count:3}]);
});
test('histogram counts boundary values once and includes the maximum in the final bin', () => {
  const bins=histogram([0,1,2,3,4,5,6]);
  assert.deepEqual(bins.map(b=>b.count),[1,1,1,1,1,2]);
  assert.equal(bins.reduce((sum,b)=>sum+b.count,0),7);
  assert.equal(bins[0].lower,0);
  assert.equal(bins.at(-1).upper,6);
});
