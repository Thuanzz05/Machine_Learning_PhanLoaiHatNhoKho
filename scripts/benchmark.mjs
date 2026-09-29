import fs from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:3001';
const row = { Area:80000, MajorAxisLength:400, MinorAxisLength:260, Eccentricity:.76, ConvexArea:82000, Extent:.7, Perimeter:1100 };
const metadata = await (await fetch(`${base}/api/model`)).json();
if (metadata.status !== 'ready') throw new Error('Model unavailable.');
const report = { modelVersion:metadata.modelVersion, platform:process.platform, architecture:process.arch, cpu:os.cpus()[0].model, node:process.version, method:'Sequential local HTTP roundtrip; 3 warmups then 30 requests per batch size; nearest-rank p95; synthetic valid row repeated, not accuracy data.', results:[] };
for (const n of [1,1000]) {
  const body=JSON.stringify({rows:Array(n).fill(row)}), times=[];
  for (let i=0;i<33;i++) {
    const start=performance.now();
    const response=await fetch(`${base}/api/raisin-classify`,{method:'POST',headers:{'Content-Type':'application/json'},body});
    const result=await response.json();
    if (!response.ok || result.count!==n || result.modelVersion!==metadata.modelVersion) throw new Error('Benchmark response differs.');
    if (i>=3) times.push(performance.now()-start);
  }
  const sorted=[...times].sort((a,b)=>a-b);
  report.results.push({batch_size:n,requests:times.length,p95_ms:sorted[Math.ceil(.95*sorted.length)-1],min_ms:sorted[0],max_ms:sorted.at(-1),times_ms:times});
}
fs.writeFileSync(`${root}/reports/performance.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.results.map(({times_ms,...r})=>r),null,2));
