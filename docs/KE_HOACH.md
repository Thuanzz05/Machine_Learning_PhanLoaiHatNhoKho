# Checklist bài tập lớn

## Tiến độ thực hiện từng bước

- [x] **Bước 1 — W01:** Lập [bản chốt bài toán, phạm vi và tiêu chí hoàn thành](BUOC_01_CHOT_YEU_CAU.md). Các lựa chọn đánh giá là phương án ban đầu; chưa chia tập hoặc huấn luyện.
- [x] **Bước 2 — W02:** Tải dữ liệu thật, ghi hồ sơ nguồn/checksum/giấy phép và lập từ điển dữ liệu.
- [x] **Bước 3–4:** Kiểm tra chất lượng, khóa protocol/split, chạy thí nghiệm, chọn mô hình bằng CV và đánh giá test độc lập.
- [x] **Bước 5:** Tích hợp mô hình vào Node.js, hoàn thiện giao diện dự đoán/dashboard và kiểm tra parity.
- [ ] **Bước 6:** Hoàn thiện báo cáo, slide, nhật ký/phân công và kiểm tra trên máy sạch khác.

Xem [kế hoạch phân tích nghiệp vụ và yêu cầu](KE_HOACH_PHAN_TICH_NGHIEP_VU_VA_YEU_CAU.md) để tra W01–W13, thí nghiệm và điều kiện nghiệm thu. Tên thành viên và hạn nộp vẫn chờ thông tin thực tế.

## Đã có trong khung project
- [x] React + TypeScript, backend Node.js, lệnh chạy chung.
- [x] Ba trang: tổng quan; nhập mẫu/CSV; đánh giá/model card.
- [x] API POST /api/raisin-classify, validation, xử lý lỗi, kiểm thử.
- [x] CSV minh họa và biểu đồ phân bố từ CSV tải lên.

## Dữ liệu và mô hình
- [x] Script tải, checksum, license, data dictionary, báo cáo chất lượng.
- [x] Protocol stratified split; thống nhất 5 seed trước thí nghiệm.
- [x] Giữ test độc lập; chọn tham số bằng CV trên tập phát triển.
- [x] Baseline lớp phổ biến và decision stump.
- [x] Cây có cắt tỉa và Random Forest giới hạn độ sâu/lá.
- [x] Đồ thị train/validation theo độ sâu.
- [x] Pruning path, lựa chọn `ccp_alpha`.
- [x] Rừng 50/100/300 cây trên cùng split.
- [x] Mean ± std qua 5 seed; giữ toàn bộ kết quả.
- [x] Khóa mô hình/protocol rồi đánh giá test cuối; test không dùng để tuning.
- [x] Accuracy, F1, ROC-AUC, train–test gap, confusion matrix và phân tích lỗi.

## Tích hợp và bàn giao
- [x] Nạp model đã lưu trong Node, trả nhãn và xác suất thật.
- [x] Đối chiếu kết quả suy luận Node với pipeline Python.
- [x] Dashboard kết quả thật; model card gồm phiên bản, split, metrics và giới hạn.
- [x] Chạy lại trong thư mục cô lập trên cùng máy; script train/evaluate tách biệt.
- [ ] Chạy lại trên một máy sạch khác và ghi môi trường/kết quả.
- [ ] Báo cáo 15–25 trang (PDF + DOCX/LaTeX), đúng đề cương giao nhiệm vụ.
- [ ] 10–12 slide; demo 5–7 phút; tổng trình bày 12–15 phút và vấn đáp.
- [ ] Nhật ký 6 tuần, bảng phân công 2 người, Git history, tự đánh giá.
- [ ] Cả hai thành viên có đóng góp dữ liệu/mô hình và web/báo cáo.
- [ ] Ghi nguồn hình/bảng, sử dụng AI và cách kiểm chứng.

## Phần mở rộng tùy chọn

Chỉ thực hiện sau khi phần bắt buộc hoàn chỉnh:

- [ ] Cảnh báo ngoài miền dựa trên train; không tự sửa input.
- [ ] So sánh permutation importance với độ quan trọng theo cây.

Không bắt buộc cloud, mobile, deep learning hay database.
