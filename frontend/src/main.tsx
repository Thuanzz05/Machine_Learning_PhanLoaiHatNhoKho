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
    <aside>
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('Tổng quan'); }}><span className="brand-mark">R</span> Raisin Lab</a>
      <p className="sidebar-caption">HỌC MÁY CƠ BẢN / PROJECT 18</p>
      <nav aria-label="Điều hướng chính">{pages.map((item, index) => <button key={item} className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => { setPage(item); setMessage(''); }}><span>0{index + 1}</span>{item}</button>)}</nav>
      <div className="sidebar-bottom"><strong>Hai giống. Bảy đặc trưng.</strong><p>Cây quyết định và rừng ngẫu nhiên cho bài toán phân loại nho khô.</p></div>
    </aside>
    <main>
      <header><span>Không gian thực nghiệm</span><span className="status">{connection}</span></header>
      {page === 'Tổng quan' && <>
        <section className="intro"><p className="eyebrow">TỪ HÌNH DẠNG ĐẾN DỰ ĐOÁN</p><h1>Hiểu dữ liệu.<br />Giải thích từng quyết định.</h1><p>Phân biệt Kecimen và Besni từ các đặc trưng hình học. Theo dõi thí nghiệm, kiểm tra đầu vào và đánh giá khả năng tổng quát của mô hình.</p><button className="primary" onClick={() => setPage('Phân loại')}>Mở công cụ phân loại <span aria-hidden="true">→</span></button></section>
        <div className="facts"><div><strong>900</strong><span>Mẫu trong bộ Raisin</span></div><div><strong>07</strong><span>Đặc trưng hình học</span></div><div><strong>02</strong><span>Giống nho khô</span></div></div>
        <section className="panel scope"><div><h2>Phạm vi của project</h2><p>Đầu vào là số đo đã trích xuất từ ảnh. Ứng dụng hỗ trợ sàng lọc, không tự động quyết định loại sản phẩm.</p></div><div><h3>Trạng thái hiện tại</h3><p>{model?.status === 'ready' ? `Mô hình ${model.candidateId} đã được chọn bằng validation, đánh giá trên ${model.metrics?.n} mẫu test và tích hợp dự đoán. Xem phương pháp và giới hạn tại trang Đánh giá.` : 'Đang chờ thông tin mô hình đã xác minh từ API.'}</p><a href="https://archive.ics.uci.edu/dataset/850/raisin" target="_blank" rel="noreferrer">Xem nguồn dữ liệu UCI ↗</a></div></section>
      </>}
      {page === 'Phân loại' && <>
        <div className="page-title"><p className="eyebrow">CÔNG CỤ</p><h1>Phân loại nho khô</h1><p>Nhập đủ 7 số đo hoặc tải CSV để kiểm tra nhiều mẫu.</p></div>
        <div className="notice">{model?.status === 'ready' ? 'Nhập số đo cùng đơn vị với dữ liệu nguồn. Xác suất chưa hiệu chuẩn; kết quả chỉ hỗ trợ tham khảo.' : 'Mô hình chưa sẵn sàng. Kiểm tra kết nối và tệp mô hình.'}</div>
        <section className="panel"><div className="section-heading"><h2>Một mẫu</h2><button className="secondary" type="button" disabled={busy} onClick={() => { setResult(null); setValues(Object.fromEntries(Object.entries(sample).map(([key, value]) => [key, String(value)]))); setMessage('Đã điền số liệu giả lập để kiểm tra form, không phải mẫu UCI.'); }}>Điền mẫu minh họa</button></div>
          <form onSubmit={event => { event.preventDefault(); void classify(Object.keys(values).length ? [Object.fromEntries(features.map(f => [f.name, Number(values[f.name])]))] : []); }}>
            <div className="form-grid">{features.map(f => <label key={f.name} htmlFor={f.name}><span>{f.label}</span><small>{f.name} · {f.unit}</small><input disabled={busy} id={f.name} type="number" step="any" min={f.min} max={f.max ?? undefined} required value={values[f.name] ?? ''} placeholder={f.max !== null ? `${f.exclusiveMin ? '>' : '≥'} ${f.min}, ≤ ${f.max}` : `> ${f.min}`} onChange={event => { setResult(null); setValues({ ...values, [f.name]: event.target.value }); }} /></label>)}</div>
            <button className="primary" disabled={busy}>{busy ? 'Đang xử lý…' : 'Gửi mẫu'}</button>
          </form>
        </section>
        <section className="panel"><div className="section-heading"><h2>Nhiều mẫu từ CSV</h2><a href="/sample.csv" download>Tải CSV minh họa ↓</a></div><p>Đúng 7 cột đặc trưng, tối đa 1.000 dòng và 1 MB. Tệp minh họa chứa số liệu giả lập để kiểm tra giao diện.</p><label className="upload">Chọn tệp CSV<input disabled={busy} type="file" accept=".csv,text/csv" onChange={event => { void readCsv(event.target.files?.[0]); event.target.value = ''; }} /></label>
          {rows.length > 0 && <><p><strong>{fileName}</strong> · {rows.length} mẫu hợp lệ về định dạng</p><div className="table-scroll"><table><caption>Xem trước tối đa 5 mẫu</caption><thead><tr>{features.map(f => <th key={f.name}>{f.name}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, i) => <tr key={i}>{features.map(f => <td key={f.name}>{row[f.name]}</td>)}</tr>)}</tbody></table></div>
            <label className="chart-select">Phân bố đặc trưng<select value={selectedFeature} onChange={event => setSelectedFeature(event.target.value)}>{features.map(f => <option key={f.name}>{f.name}</option>)}</select></label>
            <div className="histogram" role="img" aria-label={`Phân bố ${selectedFeature}: ${counts.join(', ')} mẫu trong 6 khoảng từ ${min} đến ${max}.`}>{counts.map((count, i) => <div className="bin" key={i}><span>{count}</span><div style={{ height: `${count / Math.max(...counts, 1) * 100}px` }} /><small>{(min + (max - min) * i / 6).toFixed(2)}</small></div>)}</div><p className="muted">6 khoảng từ {min} đến {max}; biểu đồ chỉ mô tả tệp vừa tải, không phải dữ liệu đánh giá.</p>
            <button className="primary" disabled={busy} onClick={() => void classify(rows)}>Gửi {rows.length} mẫu</button></>}
        </section>
        {result && <Predictions result={result} />}
        <div className="feedback" role="status" aria-live="polite">{message}</div>
      </>}
      {page === 'Đánh giá' && <>
        <div className="page-title"><p className="eyebrow">THÍ NGHIỆM & GIỚI HẠN</p><h1>Đánh giá mô hình</h1><p>Kết quả cần đến từ các thí nghiệm có thể chạy lại.</p></div>
        <Dashboard model={model} />
      </>}
      <footer>Raisin Lab · Bài tập lớn Học máy cơ bản <span>React + TypeScript / Node.js</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
