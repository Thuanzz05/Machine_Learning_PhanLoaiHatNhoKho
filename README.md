# Raisin Lab — Project 18

Khung bài tập lớn phân loại Kecimen/Besni: **React + TypeScript (TSX)** cho giao diện, **Node.js + Express** cho backend. Python chỉ dùng cho học máy offline; không dùng Flask.

## Chạy project

Cài Node.js 22.12+ (đã kiểm tra trên 22.20). Tại thư mục gốc:

```sh
npm ci
npm run dev
```

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:3001/api/health
- Dừng cả hai bằng Ctrl+C. Hai cổng 5173 và 3001 cần còn trống.

Build và chạy bản đóng gói (Node phục vụ cả web và API):

```sh
npm run build
npm start
```

Mở http://127.0.0.1:3001. `npm test` chạy kiểm thử API và validation.

## Cấu trúc

```text
frontend/src/main.tsx    Ba trang: tổng quan, phân loại, đánh giá
frontend/src/styles.css  Giao diện responsive
frontend/public/        CSV minh họa giả lập, không phải dữ liệu UCI
backend/src/app.js      API, validation và vị trí tích hợp mô hình
backend/src/server.js   Khởi động server Node.js
backend/test/           Kiểm thử với node:test
shared/features.json    Tên, đơn vị và miền hợp lệ của 7 đặc trưng
ml/README.md            Hướng dẫn triển khai phần học máy
data/README.md          Hồ sơ dữ liệu cần hoàn thiện
docs/KE_HOACH.md        Checklist theo đề bài
requirements.txt        Thư viện Python cho học máy offline
```

## Đã có / chưa có

Đã có giao diện tiếng Việt, nhập 7 đặc trưng, đọc CSV và xem phân bố dữ liệu tải lên, API JSON, kiểm tra dữ liệu, trang đánh giá/model card ở trạng thái chưa huấn luyện, build và test.

**Đây là project khởi đầu, chưa phải bài nộp hoàn chỉnh.** Chưa tải dữ liệu UCI, chia tập, huấn luyện, làm thí nghiệm, tích hợp suy luận, ghi kết quả đánh giá hay viết báo cáo. API dự đoán hiện trả `503 MODEL_NOT_READY` cho dữ liệu hợp lệ. Không có nhãn, xác suất hoặc metric giả.

Giới hạn đầu vào hiện là miền hình học lý thuyết; chưa có giới hạn ngoài phân phối học từ train. Không tự điền missing hay chuyển chuỗi JSON thành số. CSV được đọc thành số có kiểm tra trước khi gửi.

## API

`GET /api/health`: trạng thái backend và `modelReady`.

`GET /api/model`: schema đặc trưng, lớp, trạng thái, giới hạn; `metrics: null` khi chưa đánh giá.

`POST /api/raisin-classify`, header `Content-Type: application/json`:

```json
{
  "rows": [{
    "Area": 80000,
    "MajorAxisLength": 400,
    "MinorAxisLength": 260,
    "Eccentricity": 0.76,
    "ConvexArea": 82000,
    "Extent": 0.7,
    "Perimeter": 1100
  }]
}
```

Phản hồi hiện tại cho request hợp lệ, HTTP 503:

```json
{"code":"MODEL_NOT_READY","message":"Dữ liệu hợp lệ. Chưa có mô hình đã huấn luyện để dự đoán."}
```

Mã lỗi: 400 JSON sai; 413 vượt 1 MB; 415 sai Content-Type; 422 thiếu/sai đặc trưng, cột lạ hoặc hơn 1000 mẫu; 503 chưa có model. API lạ trả 404. `errors` trong phản hồi 422 mô tả dòng/cột cần sửa.

## Công nghệ và tài liệu

- [Vite](https://vite.dev/guide/): React TSX, dev proxy đến Node; không cần cấu hình CORS khi dùng giao diện này.
- [Express](https://expressjs.com/): backend Node.js.
- [Dữ liệu Raisin tại UCI](https://archive.ics.uci.edu/dataset/850/raisin): cần ghi ngày tải, checksum và trích dẫn khi tải thật.

Tài liệu bài giảng và file giao đề trong thư mục gốc được giữ nguyên. Công cụ AI hỗ trợ tạo khung project; nhóm cần ghi rõ đóng góp AI và kiểm chứng trong báo cáo.
