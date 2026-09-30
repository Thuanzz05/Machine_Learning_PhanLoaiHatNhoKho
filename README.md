# Raisin Lab — Project 18

Khung bài tập lớn phân loại Kecimen/Besni: **React + TypeScript (TSX)** cho giao diện, **Node.js + Express** cho backend. Python chỉ dùng cho học máy offline; không dùng Flask.

## Tiến độ và yêu cầu

- Dữ liệu UCI đã được lập hồ sơ, kiểm checksum và kiểm tra chất lượng; tập test 20% được khóa độc lập.
- Đã chạy hai baseline, cây cắt tỉa, Random Forest và bốn thí nghiệm bắt buộc qua 5 seed.
- Cây cắt tỉa `ccp_alpha=0.01` đã được chọn bằng CV trên tập phát triển, đánh giá một lần trên test và tích hợp vào Node.js.
- Web đã trả nhãn/xác suất thật cho form và CSV; dashboard hiển thị metric, ma trận nhầm lẫn, biểu đồ thí nghiệm và model card.
- Còn phải hoàn thiện báo cáo, slide, nhật ký/phân công nhóm và kiểm tra trên một máy sạch khác.

Tài liệu theo dõi:

- [Bản chốt bài toán và phạm vi](docs/BUOC_01_CHOT_YEU_CAU.md).
- [Kế hoạch phân tích nghiệp vụ và yêu cầu đầy đủ](docs/KE_HOACH_PHAN_TICH_NGHIEP_VU_VA_YEU_CAU.md).
- [Checklist thực hiện](docs/KE_HOACH.md).

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
backend/src/app.js      API, validation và suy luận bằng mô hình đã nạp
backend/src/model.js    Kiểm artifact và suy luận cây bằng Node.js
backend/src/server.js   Khởi động server Node.js
backend/test/           Kiểm thử với node:test
shared/features.json    Tên, đơn vị và miền hợp lệ của 7 đặc trưng
ml/README.md            Hướng dẫn chạy pipeline học máy
data/README.md          Hồ sơ nguồn, giấy phép và cách tái tạo dữ liệu
models/                 Artifact phục vụ và metadata đã khóa checksum
reports/                Kết quả đánh giá, parity, tái lập và biểu đồ
docs/KE_HOACH.md        Checklist theo đề bài
requirements-lock.txt   Môi trường Python dùng tạo artifact chính thức
```

## Trạng thái mô hình

Mô hình đang phục vụ: `raisin-1-fe3677bd45ef`, cây quyết định cắt tỉa với `ccp_alpha=0.01`.

| Chỉ số test độc lập (180 mẫu) | Kết quả |
|---|---:|
| Accuracy | 83,89% |
| F1-macro | 0,8389 |
| ROC-AUC | 0,8741 |

Ma trận nhầm lẫn là `[[75, 15], [14, 76]]`, theo thứ tự lớp Kecimen/Besni. Mô hình được chọn bằng F1-macro CV trên 720 mẫu phát triển trước khi mở test. Kết quả đầy đủ ở `reports/evaluation.json`; thông tin phục vụ ở `models/metadata.json`.

Python và Node.js đã được đối chiếu trên 3.192 trường hợp của bốn mô hình, không khác nhãn hoặc xác suất trong sai số cho phép. Quy trình cũng đã được chạy lại trong một thư mục cô lập trên cùng máy và cho artifact, split, metric và dự đoán giống nhau.

Project chưa phải bộ hồ sơ nộp hoàn chỉnh: còn thiếu báo cáo 15–25 trang, slide, nhật ký/phân công nhóm và xác nhận tái lập trên một máy khác. Cảnh báo ngoài phân phối và hiệu chuẩn xác suất chưa triển khai.

## API

`GET /api/health`: trạng thái backend và `modelReady`.

`GET /api/model`: schema đặc trưng, phiên bản, metric, kết quả thí nghiệm, giới hạn và bằng chứng parity.

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

Phản hồi cho request hợp lệ, HTTP 200:

```json
{
  "modelVersion": "raisin-1-fe3677bd45ef",
  "count": 1,
  "predictions": [{
    "rowIndex": 0,
    "label": "Kecimen",
    "probabilities": {
      "Kecimen": 0.8870056497175142,
      "Besni": 0.11299435028248588
    }
  }]
}
```

Ví dụ trên chỉ mô tả cấu trúc phản hồi; nhãn và xác suất thực tế phụ thuộc đầu vào. Mã lỗi: 400 JSON sai; 413 vượt 1 MB; 415 sai Content-Type; 422 thiếu/sai đặc trưng, cột lạ hoặc hơn 1000 mẫu; 503 khi model thiếu/hỏng. API lạ trả 404. `errors` trong phản hồi 422 mô tả dòng/cột cần sửa.

## Công nghệ và tài liệu

- [Vite](https://vite.dev/guide/): React TSX, dev proxy đến Node; không cần cấu hình CORS khi dùng giao diện này.
- [Express](https://expressjs.com/): backend Node.js.
- [Dữ liệu Raisin tại UCI](https://archive.ics.uci.edu/dataset/850/raisin): nguồn đã dùng; ngày tải, checksum, giấy phép và trích dẫn nằm trong `data/`.

Tài liệu bài giảng và file giao đề trong thư mục gốc được giữ nguyên. Công cụ AI đã hỗ trợ xây dựng và kiểm tra project; nhóm phải ghi rõ phạm vi sử dụng AI và cách kiểm chứng trong báo cáo.
