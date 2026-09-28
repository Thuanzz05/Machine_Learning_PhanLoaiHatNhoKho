import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app, validateRows } from '../src/app.js';

const row = { Area: 80000, MajorAxisLength: 400, MinorAxisLength: 260, Eccentricity: 0.76, ConvexArea: 82000, Extent: 0.7, Perimeter: 1100 };
test('schema rejects missing, nonnumeric, extra and impossible values', () => {
  assert.deepEqual(validateRows([row]), []);
  for (const rows of [[], null, [{}], [null], [{ ...row, Area: '80000' }], [{ ...row, Area: Infinity }], [{ ...row, Extent: 2 }], [{ ...row, Class: 'Besni' }], [{ ...row, MajorAxisLength: 100 }], [{ ...row, ConvexArea: 1 }], Array(1001).fill(row)]) {
    assert.ok(validateRows(rows).length);
  }
});
test('HTTP contract: health, validation, unavailable model and JSON errors', async t => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(`${base}/api/health`)).json()).modelReady, false);
  assert.equal((await (await fetch(`${base}/api/model`)).json()).metrics, null);
  const post = body => fetch(`${base}/api/raisin-classify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  assert.equal((await post(JSON.stringify({ rows: [{}] }))).status, 422);
  const result = await post(JSON.stringify({ rows: [row] }));
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, 'MODEL_NOT_READY');
  assert.equal((await post('{broken')).status, 400);
  assert.equal((await post(JSON.stringify({ padding: 'x'.repeat(1024 * 1024) }))).status, 413);
  assert.equal((await fetch(`${base}/api/raisin-classify`, { method: 'POST', body: 'text' })).status, 415);
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
});
