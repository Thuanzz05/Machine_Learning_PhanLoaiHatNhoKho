# Từ điển dữ liệu Raisin

**Phiên bản 1.0 · 29/09/2026.** Bảng nguồn: `Raisin_Dataset.xlsx`, sheet `Raisin_Grains_Dataset`. Giải thích theo TXT đi kèm và phần “Additional Variable Information” trên [UCI](https://archive.ics.uci.edu/dataset/850/raisin), vì một số mô tả trong “Variables Table” của trang bị lệch dòng.

Một dòng là một quả nho. Bảy đặc trưng có sau xử lý ảnh, trước dự đoán nhãn. Nguồn không có ảnh thô, mã lô hoặc ID quả nho. Giữ đúng thứ tự dưới đây:

1. **Area**, cột A: số nguyên; diện tích vùng quả nho, tính bằng số pixel bên trong đối tượng. Schema ứng dụng ghi pixel²; số hữu hạn > 0.
2. **MajorAxisLength**, cột B: số thực; chiều dài trục lớn, đơn vị pixel; số hữu hạn > 0 và ≥ `MinorAxisLength`.
3. **MinorAxisLength**, cột C: số thực; chiều dài trục nhỏ, đơn vị pixel; số hữu hạn > 0.
4. **Eccentricity**, cột D: số thực; độ lệch tâm của ellipse có cùng mômen với đối tượng, không đơn vị; số hữu hạn trong [0, 1]. Gần 0 gợi dạng tròn hơn, gần 1 gợi dạng kéo dài hơn.
5. **ConvexArea**, cột E: số nguyên; diện tích bao lồi nhỏ nhất chứa đối tượng, pixel²; số hữu hạn > 0 và ≥ `Area`.
6. **Extent**, cột F: số thực; tỷ lệ diện tích đối tượng trên diện tích hộp bao, không đơn vị; số hữu hạn trong (0, 1]. Gửi tỷ lệ như 0,7, không gửi 70 theo phần trăm.
7. **Perimeter**, cột G: số thực; chu vi đường bao đối tượng trong tọa độ ảnh, pixel; số hữu hạn > 0.

**Class**, cột H: chuỗi `Kecimen` hoặc `Besni`, nhãn chỉ dùng học/đánh giá; mỗi lớp 450 mẫu trong bản nguồn. Không đưa vào feature, form hoặc CSV dự đoán. Quy ước dự án: Kecimen=0, Besni=1; nhãn gốc vẫn giữ chuỗi. Lớp 1 không mang nghĩa tốt/xấu.

## Miền nhập và cách sử dụng

- Bản đã đọc không có ô thiếu. Các ràng buộc nêu trên theo schema/validation hiện tại, không phải min/max quan sát hay giới hạn ngoài phân phối.
- Nguồn mô tả theo pixel, không cung cấp hiệu chuẩn vật lý. Không tự đổi sang mm. Dữ liệu nhập khác cần cùng cách trích đặc trưng và thang đo phù hợp.
- API hiện cho phép Area/ConvexArea là số thập phân hữu hạn hợp miền, dù tệp nguồn chứa số nguyên. Giữ nguyên hành vi này; không làm tròn dữ liệu nguồn.
- Giữ tên cột, phân biệt chữ hoa/thường. CSV dự đoán có đúng bảy feature; dữ liệu học thêm `Class`. Ô thiếu/sai kiểu phải báo lỗi, không tự điền 0.
- Nếu tạo `row_id`, đó là ID truy vết do dự án thêm, không dùng cho học và không tự chứng minh các mẫu độc lập.
- Không lấy thứ tự dòng làm đặc trưng hoặc chia theo một đoạn liên tiếp. Kiểm trùng/phụ thuộc rồi chia phân tầng ở bước 3.

Đối chiếu [schema ứng dụng](../shared/features.json), [hồ sơ nguồn](README.md) và [manifest kiểm đếm](source_manifest.json).
