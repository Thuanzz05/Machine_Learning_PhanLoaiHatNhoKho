# Phần học máy offline

Python dùng pandas/scikit-learn cho thí nghiệm. Backend web vẫn là Node.js.

## Chuẩn bị

Python 3.11 hoặc 3.12, chạy từ thư mục gốc:

```sh
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\python -m pip install -r requirements.txt
```

## Các phần cần triển khai

1. `ml/data.py`: tải Raisin từ UCI, kiểm tra schema/chất lượng, ghi checksum và split stratified. Giữ test độc lập.
2. `ml/train.py`: baseline lớp phổ biến, decision stump, cây cắt tỉa, rừng ngẫu nhiên. Tuning chỉ trên train/CV; lưu Pipeline và cấu hình.
3. `ml/evaluate.py`: chỉ đánh giá test khi đã chốt protocol/model, xuất Accuracy/F1/ROC-AUC, confusion matrix, train–test gap và kết quả nhiều seed theo protocol định trước.
4. Lưu mô hình vào `models/`, kết quả thực vào `reports/`. Các thư mục này được tạo khi có artifact thật.

Đây là danh sách cần làm, các script trên chưa được tạo. Không đặt script rỗng giả vờ đã hoàn thành thí nghiệm.

## Kết nối Node.js với mô hình

Sau khi chọn được pipeline, có thể xuất ONNX để Node nạp bằng `onnxruntime-node`; kiểm tra hỗ trợ toàn bộ preprocessing và đối chiếu xác suất với scikit-learn trên các mẫu kiểm thử trước khi dùng. Chỉ cài dependency này khi có artifact tương thích. Không cần thêm Python web server.

Khi tích hợp: nạp model một lần lúc khởi động, thay nhánh `MODEL_NOT_READY` trong `backend/src/app.js`, giữ nguyên validation và thứ tự đặc trưng trong `shared/features.json`. Bổ sung kết quả nhãn/xác suất ở frontend, cập nhật `/api/health`, `/api/model` và test. Xác định rõ thứ tự lớp của xác suất theo artifact; không tự giả định Besni/Kecimen.

Không train mỗi request. Không lấy CSV người dùng tải lên làm tập đánh giá hoặc tự động huấn luyện lại.
