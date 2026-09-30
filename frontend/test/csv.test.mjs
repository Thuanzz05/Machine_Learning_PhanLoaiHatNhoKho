import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/csv.ts';

const names = ['Area','MajorAxisLength','MinorAxisLength','Eccentricity','ConvexArea','Extent','Perimeter'];
const values = [80000,400,260,.76,82000,.7,1100];
const csv = (rows=[values], headers=names) => [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');

test('CSV accepts BOM, quotes, blank lines and reordered headers without shifting values', () => {
  const reordered = csv([[...values].reverse()], [...names].reverse());
  assert.deepEqual(parseCsv(reordered)[0],Object.fromEntries(names.map((name,i)=>[name,values[i]])));
  assert.deepEqual(parseCsv('\uFEFF'+csv([values],names.map(n=>`"${n}"`))+'\r\n\r\n'),parseCsv(csv()));
});
test('CSV rejects empty data, label leakage, duplicate/missing columns and malformed records', () => {
  for (const input of ['', names.join(','), csv([values],names.slice(1)), csv([[...values,'Besni']],[...names,'Class']),
    csv([values],names.map((n,i)=>i===1?'Area':n)), csv([[...values,7]]), csv([values.slice(1)])]) {
    assert.throws(()=>parseCsv(input));
  }
});
test('CSV refuses the whole batch and identifies numeric or geometric errors by row and feature', () => {
  for (const bad of ['', 'NaN', 'Infinity', '1e100', '-2', '0']) {
    assert.throws(()=>parseCsv(csv([values,[bad,...values.slice(1)]])),/Dòng 2: Area/);
  }
  assert.throws(()=>parseCsv(csv([[80000,100,...values.slice(2)]])),/Dòng 1: MajorAxisLength/);
  assert.throws(()=>parseCsv(csv([[...values.slice(0,4),79999,...values.slice(5)]])),/Dòng 1: ConvexArea/);
  assert.throws(()=>parseCsv(csv([[...values.slice(0,3),1.1,...values.slice(4)]])),/Eccentricity/);
});
test('CSV preserves row order and enforces the 1000 row batch boundary', () => {
  assert.equal(parseCsv(csv(Array(1000).fill(values))).length,1000);
  assert.throws(()=>parseCsv(csv(Array(1001).fill(values))),/1000/);
  const second=[95000,460,270,.81,98000,.73,1230];
  assert.deepEqual(parseCsv(csv([values,second])).map(r=>r.Area),[80000,95000]);
});
