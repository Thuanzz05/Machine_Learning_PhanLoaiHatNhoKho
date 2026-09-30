import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Papa from 'papaparse';
import features from '../../shared/features.json';
import './styles.css';
import { Dashboard, Predictions, type ModelInfo, type PredictionResult } from './Results';

type Row = Record<string, number>;
const sample: Row = { Area: 80000, MajorAxisLength: 400, MinorAxisLength: 260, Eccentricity: 0.76, ConvexArea: 82000, Extent: 0.7, Perimeter: 1100 };
const pages = ['Tổng quan', 'Phân loại', 'Đánh giá'] as const;

function App() {
  const [page, setPage] = useState<(typeof pages)[number]>('Tổng quan');
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [connection, setConnection] = useState('Đang kết nối API…');
  const [values, setValues] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('Area');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/model', { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<ModelInfo>; })
      .then(data => { setModel(data); setConnection(data.status === 'ready' ? 'API đã kết nối · Mô hình sẵn sàng' : 'API đã kết nối · Mô hình chưa sẵn sàng'); })
      .catch(error => { if (error.name !== 'AbortError') setConnection('Không kết nối được API'); });
    return () => controller.abort();
  }, []);

  async function classify(input: Row[]) {
    setResult(null); setBusy(true); setMessage('Đang gửi dữ liệu…');
    try {
      const response = await fetch('/api/raisin-classify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: input }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      if (response.ok) { setResult(body as PredictionResult); setMessage(`Đã phân loại ${body.count} mẫu.`); }
      else setMessage([body.message, ...(body.errors ?? []).slice(0, 5)].filter(Boolean).join('\n') || 'API chưa cung cấp kết quả.');
    } catch { setMessage('Không gửi được dữ liệu. Kiểm tra backend và thử lại.'); }
    finally { setBusy(false); }
  }

  async function readCsv(file?: File) {
    setResult(null); setRows([]); setFileName(''); setMessage('');
    if (!file) return;
    if (file.size > 1024 * 1024) { setMessage('CSV tối đa 1 MB.'); return; }
    setBusy(true);
    try {
      const parsed = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: 'greedy', transformHeader: header => header.trim() });
      const headers = parsed.meta.fields ?? [];
      if (parsed.errors.length || headers.length !== features.length || features.some(f => !headers.includes(f.name))) throw new Error('CSV cần đúng 7 cột như tệp mẫu; không kèm cột Class.');
      if (!parsed.data.length || parsed.data.length > 1000) throw new Error('CSV cần từ 1 đến 1000 dòng.');
      const numericRows = parsed.data.map((row, index) => Object.fromEntries(features.map(f => {
        const text = row[f.name]?.trim();
        const value = Number(text);
        if (!text || !Number.isFinite(value) || (f.exclusiveMin ? value <= f.min : value < f.min) || (f.max !== null && value > f.max)) throw new Error(`Dòng ${index + 1}: ${f.name} thiếu hoặc ngoài miền hợp lệ.`);
        return [f.name, value];
      })));
      if (numericRows.some(row => row.MajorAxisLength < row.MinorAxisLength || row.ConvexArea < row.Area)) throw new Error('Trục lớn phải ≥ trục nhỏ; ConvexArea phải ≥ Area.');
      setRows(numericRows); setFileName(file.name); setMessage(`Đã đọc ${numericRows.length} mẫu. Chưa thực hiện dự đoán.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không đọc được CSV.'); }
    finally { setBusy(false); }
  }

  const measurements = rows.map(row => row[selectedFeature]);
  const min = measurements.length ? Math.min(...measurements) : 0;
  const max = measurements.length ? Math.max(...measurements) : 0;
  const counts = Array.from({ length: 6 }, () => 0);
  measurements.forEach(value => counts[max === min ? 0 : Math.min(5, Math.floor((value - min) / (max - min) * 6))]++);

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('Tổng quan'); }}>
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>Raisin Lab<small>Project 18 · Học máy cơ bản</small></span>
      </a>
      <nav aria-label="Điều hướng chính">{pages.map(item => <button key={item} className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => { setPage(item); setMessage(''); }}>{item}</button>)}</nav>
      <span className={`status ${model?.status === 'ready' ? 'ready' : ''}`}><i />{connection}</span>
    </header>
    <main>
      {page === 'Tổng quan' && <>
        <section className="hero">
          <div className="hero-copy"><p className="kicker">Phân loại từ đặc trưng hình học</p><h1>Mỗi hạt nho<br />để lại một hình dạng.</h1><p>Raisin Lab dùng cây quyết định đã cắt tỉa để phân biệt Kecimen và Besni, đồng thời công khai cách mô hình được chọn và kiểm chứng.</p><div className="hero-actions"><button className="primary" onClick={() => setPage('Phân loại')}>Phân loại một mẫu</button><button className="text-action" onClick={() => setPage('Đánh giá')}>Xem bằng chứng đánh giá</button></div></div>
          <div className="specimen" aria-label="Minh họa hai mẫu nho khô cùng các đường đo hình học">
            <span className="specimen-index">Mẫu hình học</span>
            <div className="measure measure-x"><span>Trục lớn</span></div><div className="measure measure-y"><span>Trục nhỏ</span></div>
            <div className="raisin raisin-a"><i /><i /><i /></div><div className="raisin raisin-b"><i /><i /></div>
            <span className="specimen-note note-a">Kecimen</span><span className="specimen-note note-b">Besni</span>
          </div>
        </section>
        <section className="facts" aria-label="Tóm tắt dữ liệu"><div><span>Dữ liệu gốc</span><strong>900</strong><p>mẫu cân bằng</p></div><div><span>Không gian đo</span><strong>07</strong><p>đặc trưng hình học</p></div><div><span>Bài toán</span><strong>02</strong><p>giống cần phân biệt</p></div><div className="fact-result"><span>Kết quả test</span><strong>{model?.metrics ? `${(model.metrics.f1_macro * 100).toFixed(2)}%` : '—'}</strong><p>F1-macro · 180 mẫu</p></div></section>
        <section className="brief"><div><p className="section-label">Phạm vi</p><h2>Đo hình dạng, không nhận ảnh trực tiếp.</h2></div><p>Ứng dụng nhận bảy số đo đã trích xuất, kiểm tra dữ liệu rồi trả nhãn và xác suất. Kết quả hỗ trợ sàng lọc; người vận hành giữ quyết định cuối cùng.</p><div className="brief-meta"><span>Mô hình</span><strong>{model?.candidateId ?? 'Đang tải'}</strong><span>Nguồn dữ liệu</span><a href="https://archive.ics.uci.edu/dataset/850/raisin" target="_blank" rel="noreferrer">UCI Raisin</a></div></section>
      </>}
      {page === 'Phân loại' && <>
        <div className="page-title"><p className="kicker">Bàn đo</p><h1>Phân loại nho khô</h1><p>Chọn một trong hai cách nhập. Tất cả bảy số đo phải dùng cùng đơn vị với dữ liệu nguồn.</p></div>
        <div className="notice">{model?.status === 'ready' ? 'Nhập số đo cùng đơn vị với dữ liệu nguồn. Xác suất chưa hiệu chuẩn; kết quả chỉ hỗ trợ tham khảo.' : 'Mô hình chưa sẵn sàng. Kiểm tra kết nối và tệp mô hình.'}</div>
        <section className="panel measure-panel"><div className="section-heading"><div><span className="step">01</span><h2>Nhập một mẫu</h2></div><button className="secondary" type="button" disabled={busy} onClick={() => { setResult(null); setValues(Object.fromEntries(Object.entries(sample).map(([key, value]) => [key, String(value)]))); setMessage('Đã điền số liệu giả lập để kiểm tra form, không phải mẫu UCI.'); }}>Dùng số đo minh họa</button></div>
          <form onSubmit={event => { event.preventDefault(); void classify(Object.keys(values).length ? [Object.fromEntries(features.map(f => [f.name, Number(values[f.name])]))] : []); }}>
            <div className="form-grid">{features.map(f => <label key={f.name} htmlFor={f.name}><span>{f.label}</span><small>{f.name} · {f.unit}</small><input disabled={busy} id={f.name} type="number" step="any" min={f.min} max={f.max ?? undefined} required value={values[f.name] ?? ''} placeholder={f.max !== null ? `${f.exclusiveMin ? '>' : '≥'} ${f.min}, ≤ ${f.max}` : `> ${f.min}`} onChange={event => { setResult(null); setValues({ ...values, [f.name]: event.target.value }); }} /></label>)}</div>
            <button className="primary" disabled={busy}>{busy ? 'Đang xử lý…' : 'Phân loại mẫu này'}</button>
          </form>
        </section>
        <section className="panel batch-panel"><div className="section-heading"><div><span className="step">02</span><h2>Hoặc đọc một lô CSV</h2></div><a href="/sample.csv" download>Tải tệp mẫu</a></div><p>Đúng 7 cột đặc trưng, tối đa 1.000 dòng và 1 MB. Tệp mẫu chỉ dùng để thử giao diện.</p><label className="upload"><span>Thả hoặc chọn tệp CSV</span><small>Hệ thống kiểm tra toàn bộ lô trước khi phân loại.</small><input disabled={busy} type="file" accept=".csv,text/csv" onChange={event => { void readCsv(event.target.files?.[0]); event.target.value = ''; }} /></label>
          {rows.length > 0 && <><p><strong>{fileName}</strong> · {rows.length} mẫu hợp lệ về định dạng</p><div className="table-scroll"><table><caption>Xem trước tối đa 5 mẫu</caption><thead><tr>{features.map(f => <th key={f.name}>{f.name}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, i) => <tr key={i}>{features.map(f => <td key={f.name}>{row[f.name]}</td>)}</tr>)}</tbody></table></div>
            <label className="chart-select">Phân bố đặc trưng<select value={selectedFeature} onChange={event => setSelectedFeature(event.target.value)}>{features.map(f => <option key={f.name}>{f.name}</option>)}</select></label>
            <div className="histogram" role="img" aria-label={`Phân bố ${selectedFeature}: ${counts.join(', ')} mẫu trong 6 khoảng từ ${min} đến ${max}.`}>{counts.map((count, i) => <div className="bin" key={i}><span>{count}</span><div style={{ height: `${count / Math.max(...counts, 1) * 100}px` }} /><small>{(min + (max - min) * i / 6).toFixed(2)}</small></div>)}</div><p className="muted">6 khoảng từ {min} đến {max}; biểu đồ chỉ mô tả tệp vừa tải, không phải dữ liệu đánh giá.</p>
            <button className="primary" disabled={busy} onClick={() => void classify(rows)}>Phân loại {rows.length} mẫu</button></>}
        </section>
        {result && <Predictions result={result} />}
        <div className="feedback" role="status" aria-live="polite">{message}</div>
      </>}
      {page === 'Đánh giá' && <>
        <div className="page-title"><p className="kicker">Hồ sơ kiểm chứng</p><h1>Đánh giá mô hình</h1><p>Mọi con số bên dưới đến từ thí nghiệm đã lưu và tập test độc lập.</p></div>
        <Dashboard model={model} />
      </>}
      <footer><span>Raisin Lab · Project 18</span><span>Dữ liệu UCI · CC BY 4.0</span><span>React + TypeScript / Node.js</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
