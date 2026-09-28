import express from 'express';
import { fileURLToPath } from 'node:url';
import features from '../../shared/features.json' with { type: 'json' };

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
      if (typeof value !== 'number' || !Number.isFinite(value) ||
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

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', modelReady: false }));
app.get('/api/model', (_req, res) => res.json({
  status: 'not_trained', features, classes: ['Kecimen', 'Besni'], metrics: null,
  limitations: ['Chưa huấn luyện và đánh giá mô hình.', 'Chỉ hỗ trợ sàng lọc; không tự động loại sản phẩm.', 'Đầu vào là đặc trưng hình học đã trích xuất, không phải ảnh.'],
}));
app.post('/api/raisin-classify', (req, res) => {
  if (!req.is('application/json')) return res.status(415).json({ code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Gửi Content-Type: application/json.' });
  const errors = validateRows(req.body?.rows);
  if (errors.length) return res.status(422).json({ code: 'INVALID_INPUT', message: 'Dữ liệu đầu vào chưa hợp lệ.', errors });
  // Integrate the saved model here after offline training; never train per request.
  return res.status(503).json({ code: 'MODEL_NOT_READY', message: 'Dữ liệu hợp lệ. Chưa có mô hình đã huấn luyện để dự đoán.' });
});
app.use('/api', (_req, res) => res.status(404).json({ code: 'NOT_FOUND', message: 'API không tồn tại.' }));
const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(dist));
app.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ code: status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR', message: status === 413 ? 'Dữ liệu vượt quá 1 MB.' : status === 400 ? 'JSON không hợp lệ.' : 'Lỗi máy chủ.' });
});
