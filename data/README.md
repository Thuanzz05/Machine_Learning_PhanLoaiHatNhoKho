# Hồ sơ dữ liệu Raisin

**Bước 2 hoàn thành ngày 29/09/2026:** Đã tải từ UCI, giữ nguyên tệp nguồn, xác minh checksum và đọc cấu trúc Excel.

## Nguồn và giấy phép

- Nguồn: [Raisin tại UCI](https://archive.ics.uci.edu/dataset/850/raisin), ID 850.
- Gói tải: [raisin.zip](https://archive.ics.uci.edu/static/public/850/raisin.zip).
- DOI: [10.24432/C5660T](https://doi.org/10.24432/C5660T).
- Giấy phép UCI công bố: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); ghi công, liên kết giấy phép và nêu thay đổi khi chia sẻ/chỉnh sửa.
- Ngày tải: **29/09/2026, khoảng 08:37 giờ Việt Nam**. Thời điểm UTC và cách xác định nằm trong [manifest](source_manifest.json).

Trích dẫn dữ liệu: Çinar, İ., Koklu, M., & Tasdemir, S. (2020). *Raisin [Dataset].* UCI Machine Learning Repository. https://doi.org/10.24432/C5660T.

Tệp tác giả yêu cầu trích dẫn thêm: Cinar, I., Koklu, M., & Tasdemir, S. (2020). *Classification of Raisin Grains Using Machine Vision and Artificial Intelligence Methods.* Gazi Journal of Engineering Sciences, 6(3), 200–209. [DOI bài báo](https://doi.org/10.30855/gmbd.2020.03.03).

## Tệp nguồn và kết quả kiểm đếm

Giữ nguyên ZIP ngoài `raw/raisin.zip`, ZIP bên trong `raw/Raisin_Dataset.zip` và ba tệp gốc:

- [Excel](raw/Raisin_Dataset/Raisin_Dataset.xlsx): chọn làm nguồn xử lý.
- [ARFF](raw/Raisin_Dataset/Raisin_Dataset.arff): bản định dạng khác; không ghép vào Excel để tránh nhân đôi mẫu.
- [TXT](raw/Raisin_Dataset/Raisin_Dataset.txt): mô tả biến và trích dẫn.

Excel có sheet `Raisin_Grains_Dataset` (dữ liệu) và `Citation_Request` (trích dẫn). Header ở dòng 1, dữ liệu ở dòng 2–901, cột A:H. Đọc trực tiếp được **900 mẫu, bảy đặc trưng, 450 Kecimen và 450 Besni**, không có ô thiếu, mọi feature là số hữu hạn. `Area`/`ConvexArea` là số nguyên, năm feature khác là số thực.

Xem [từ điển dữ liệu](DATA_DICTIONARY.md). Kiểm cấu trúc ban đầu không thay thế kiểm trùng/nhóm/quan hệ hình học và báo cáo chất lượng ở bước 3. Bước 2 không sửa, loại, làm tròn hay chuyển đơn vị bất kỳ dòng nào.

## Tải lại và xác minh

SHA-256 của ZIP chính thức đã tải:

```text
5d516c040923fd154ecf85e31b6e1b5a096724fa0e68d588c33fb5a2f0c3e5db
```

Đây là checksum dự án tính từ lần tải, không phải checksum UCI công bố riêng. Manifest ghi checksum/dung lượng cả năm tệp và môi trường kiểm tra. Lần tải ban đầu được ghi theo thời gian ghi ZIP vừa tải, không dùng thời gian bên trong ZIP.

Từ thư mục gốc, với Python có `openpyxl==3.1.5` theo `requirements.txt`:

```sh
python ml/download_data.py
python ml/download_data.py --offline
```

Lệnh đầu tải nếu chưa có; nếu có thì kiểm bản cục bộ. Lệnh thứ hai chỉ kiểm/giải nén bản cục bộ, không dùng mạng. Chương trình từ chối checksum khác và không ghi đè tệp gốc bị sửa. `data/raw/` được Git bỏ qua; máy mới tái tạo bằng script, còn manifest và hồ sơ được lưu cùng mã nguồn.

`frontend/public/sample.csv` chỉ chứa ba mẫu giả lập thử giao diện, không đưa vào huấn luyện hoặc đánh giá.
