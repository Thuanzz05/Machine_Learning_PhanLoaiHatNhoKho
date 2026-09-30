# Phần học máy offline

Python dùng pandas/scikit-learn cho thí nghiệm. Backend web vẫn là Node.js.

## Chuẩn bị

Python 3.11 hoặc 3.12, chạy từ thư mục gốc:

```sh
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\python -m pip install -r requirements-lock.txt
```

`requirements-lock.txt` là môi trường đã dùng để tạo artifact chính thức. `requirements.txt` giữ danh sách dependency trực tiếp, thuận tiện cho phát triển.

## Pipeline hiện có

1. `ml/download_data.py`: tải/kiểm bộ Raisin chính thức bằng checksum, giữ nguyên tệp nguồn.
2. `ml/data.py`: kiểm schema/chất lượng và tạo split stratified 720 mẫu phát triển / 180 mẫu test.
3. `ml/train.py`: chạy baseline lớp phổ biến, decision stump, cây cắt tỉa và Random Forest; lựa chọn chỉ bằng CV 5 fold qua các seed `11, 23, 42, 67, 101`.
4. `ml/check_parity.py`: tạo ca kiểm tra để so sánh suy luận Python và Node.js.
5. `ml/evaluate.py`: sau khi khóa lựa chọn, đánh giá test một lần và xuất metric, ma trận nhầm lẫn, phân tích lỗi cùng biểu đồ.

Mô hình đang phục vụ là cây cắt tỉa `alpha_0.01`. Artifact JSON ở `models/`; kết quả và hình ở `reports/`. Không sửa artifact thủ công: chạy lại pipeline nếu protocol hoặc dữ liệu thay đổi.

## Chạy từng bước

```sh
.venv\Scripts\python ml/download_data.py
.venv\Scripts\python ml/data.py
.venv\Scripts\python ml/train.py
.venv\Scripts\python ml/check_parity.py
node scripts/check-parity.mjs
.venv\Scripts\python ml/evaluate.py
```

Chạy kiểm thử Python:

```sh
.venv\Scripts\python -m unittest discover -s ml -p "test_*.py" -v
```

Chạy tái lập trong thư mục cô lập trên cùng máy:

```sh
.venv\Scripts\python scripts/reproduce.py
```

## Kết nối Node.js với mô hình

Mô hình cây scikit-learn được xuất thành JSON tối giản và nạp một lần khi backend Node.js khởi động. Backend kiểm schema, thứ tự feature và SHA-256 trước khi nhận request. `scripts/check-parity.mjs` đối chiếu nhãn/xác suất với ca do Python sinh; báo cáo hiện tại đạt trên 3.192 trường hợp của bốn mô hình.

Không cần ONNX hoặc Python web server cho pipeline hiện tại. Chỉ đổi định dạng khi JSON không còn đáp ứng mô hình được chọn.

Không train mỗi request. Không lấy CSV người dùng tải lên làm tập đánh giá hoặc tự động huấn luyện lại.
