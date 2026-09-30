import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, ApiFailure } from '../src/api.ts';

test('API errors retain HTTP status and only readable row details', async () => {
  const mock = async () => Response.json({message:'Dữ liệu sai',errors:['Dòng 2: Area',{},null]}, {status:422});
  await assert.rejects(requestJson('/api/raisin-classify',{},mock), error =>
    error instanceof ApiFailure && error.status===422 && error.message==='Dữ liệu sai\nDòng 2: Area');
});
test('API handles HTML outages and preserves abort/network failures for retry', async () => {
  await assert.rejects(requestJson('/api/model',{},async()=>new Response('<html>Unavailable</html>',{status:503})),
    error => error instanceof ApiFailure && error.status===503 && error.message.includes('503'));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(requestJson('/api/model',{signal:controller.signal},async(_url,options)=>{
    options.signal.throwIfAborted();
  }), error => error.name==='AbortError');
  const data = {status:'ready'};
  assert.deepEqual(await requestJson('/api/model',{},async()=>Response.json(data)),data);
});
