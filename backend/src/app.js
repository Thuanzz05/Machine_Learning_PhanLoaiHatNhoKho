import express from 'express';
import { fileURLToPath } from 'node:url';
import features from '../../shared/features.json' with { type: 'json' };
import { loadModel, predictRows } from './model.js';

export function validateRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 1000) {
    return ['rows phải là mảng từ 1 đến 1000 mẫu.'];
  }
  const errors = [];
  rows.forEach((row, i) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      errors.push(`Dòng ${i + 1}: phải là một object.`);
      return;
    }
    for (const f of features) {
      const value = row[f.name];
      if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isFinite(Math.fround(value)) ||
          (f.exclusiveMin ? value <= f.min : value < f.min) ||
          (f.max !== null && value > f.max)) {
        errors.push(`Dòng ${i + 1}: ${f.name} phải là số ${f.exclusiveMin ? '>' : '≥'} ${f.min}${f.max !== null ? ` và ≤ ${f.max}` : ''}.`);
      }
    }
    if (Object.keys(row).some(key => !features.some(f => f.name === key))) errors.push(`Dòng ${i + 1}: có cột không thuộc 7 đặc trưng.`);
    if (row.MajorAxisLength < row.MinorAxisLength) errors.push(`Dòng ${i + 1}: trục lớn phải ≥ trục nhỏ.`);
    if (row.ConvexArea < row.Area) errors.push(`Dòng ${i + 1}: ConvexArea phải ≥ Area.`);
  });
  return errors;
}

export function createApp({ modelState = loadModel() } = {}) {
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', modelReady: modelState.ready }));
app.get('/api/model', (_req, res) => res.json({
  ...(modelState.ready ? modelState.metadata : { status: 'unavailable', metrics: null, limitations: ['Mô hình thiếu hoặc chưa vượt qua xác minh.', 'Chỉ hỗ trợ hai giống, không tự động loại sản phẩm.', 'Đầu vào là số đo đã trích xuất, không phải ảnh.'] }),
  features, classes: ['Kecimen', 'Besni'],
}));
app.post('/api/raisin-classify', (req, res) => {
  if (!req.is('application/json')) return res.status(415).json({ code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Gửi Content-Type: application/json.' });
  const errors = validateRows(req.body?.rows);
  if (errors.length) return res.status(422).json({ code: 'INVALID_INPUT', message: 'Dữ liệu đầu vào chưa hợp lệ.', errors });
  if (!modelState.ready) return res.status(503).json({ code: 'MODEL_NOT_READY', message: 'Mô hình chưa sẵn sàng. Kiểm tra tệp mô hình và kết quả đánh giá.' });
  const predictions = predictRows(modelState.artifact, req.body.rows);
  return res.json({ modelVersion: modelState.metadata.modelVersion, count: predictions.length, predictions });
});
app.use('/api', (_req, res) => res.status(404).json({ code: 'NOT_FOUND', message: 'API không tồn tại.' }));
const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use('/figures', express.static(fileURLToPath(new URL('../../reports/figures/', import.meta.url))));
app.use(express.static(dist));
app.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ code: status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR', message: status === 413 ? 'Dữ liệu vượt quá 1 MB.' : status === 400 ? 'JSON không hợp lệ.' : 'Lỗi máy chủ.' });
});
return app;
}

export const app = createApp();
