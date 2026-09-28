# Hồ sơ dữ liệu Raisin

- Nguồn theo đề: https://archive.ics.uci.edu/dataset/850/raisin
- DOI: https://doi.org/10.24432/C5660T
- Giấy phép theo đề: CC BY 4.0.
- Quy mô theo đề: 900 mẫu, 7 đặc trưng, 2 lớp cân bằng.
- Trạng thái: **chưa tải dữ liệu**. Ngày tải, tên tệp và SHA-256 cần ghi sau khi tải thật.

| Biến | Kiểu | Đơn vị dự kiến | Vai trò |
|---|---|---|---|
| Area | Số | pixel² | Feature |
| MajorAxisLength | Số | pixel | Feature |
| MinorAxisLength | Số | pixel | Feature |
| Eccentricity | Số | Không đơn vị | Feature |
| ConvexArea | Số | pixel² | Feature |
| Extent | Số | Không đơn vị | Feature |
| Perimeter | Số | pixel | Feature |
| Class | Chuỗi Kecimen/Besni | Không áp dụng | Target |

Cần đối chiếu đơn vị với tài liệu nguồn. Các feature có sẵn sau bước trích hình học của ảnh, trước dự đoán giống; không dùng target làm đầu vào.

Khi triển khai: bổ sung script tải/làm sạch, báo cáo missing, trùng lặp, ngoại lệ, phân bố lớp, dòng bị loại và lý do; quy tắc chia tập, seed và EDA chỉ trên train. Không loại mẫu dựa vào việc kết quả test tăng hay giảm.

`frontend/public/sample.csv` chỉ chứa 3 mẫu giả lập kiểm tra giao diện, không phải mẫu UCI và không dùng cho huấn luyện/đánh giá.
