# Phần học máy offline

Python dùng pandas/scikit-learn cho thí nghiệm. Backend web vẫn là Node.js.

## Chuẩn bị

Python **3.12** (đã chạy trên 3.12.14), tại thư mục gốc. Bộ khóa hiện có SciPy 1.18.1 yêu cầu Python ≥ 3.12; không dùng Python 3.11 với `requirements-lock.txt`:

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

## Tái lập từ bản checkout hiện tại

```sh
.venv\Scripts\python scripts/reproduce.py
.venv\Scripts\python -m unittest discover -s ml -p "test_*.py" -v
node scripts/check-parity.mjs
```

Script tái lập tự tải hoặc kiểm checksum ZIP nguồn, chuẩn bị dữ liệu và kiểm split gốc, tạo thư mục riêng trong `.cache/`, chạy lại toàn bộ pipeline rồi so sánh split, ứng viên, JSON mô hình, metric và dự đoán. Bản gốc đã có test nên `ml/train.py` chủ động từ chối huấn luyện tại gốc. Không xóa khóa/test để chạy lại; dùng script tái lập.

Lấy mã bằng `git clone`/`git pull` để Git áp dụng `.gitattributes`. Protocol dùng LF; artifact đã khóa dùng CRLF theo bản thực nghiệm đầu tiên. Python ghi kiểu xuống dòng tường minh để không phụ thuộc hệ điều hành. Không tự định dạng lại các JSON model/split hoặc cập nhật checksum để bỏ qua lỗi kiểm tra.

## Thứ tự các bước trong một thư mục thí nghiệm mới

`download_data.py` → `data.py` → `train.py` → `check_parity.py` → `evaluate.py`.

Chỉ dùng chuỗi này trong thư mục mới chưa có test. `check_parity.py` tự gọi Node để đối chiếu. Thay đổi protocol sau khi xem test cần một thiết kế đánh giá mới, không được báo kết quả đó là test độc lập ban đầu.

## Kết nối Node.js với mô hình

Mô hình cây scikit-learn được xuất thành JSON tối giản và nạp một lần khi backend Node.js khởi động. Backend kiểm schema, thứ tự feature và SHA-256 trước khi nhận request. `scripts/check-parity.mjs` đối chiếu nhãn/xác suất với ca do Python sinh; báo cáo hiện tại đạt trên 3.192 trường hợp của bốn mô hình.

Không cần ONNX hoặc Python web server cho pipeline hiện tại. Chỉ đổi định dạng khi JSON không còn đáp ứng mô hình được chọn.

Không train mỗi request. Không lấy CSV người dùng tải lên làm tập đánh giá hoặc tự động huấn luyện lại.
