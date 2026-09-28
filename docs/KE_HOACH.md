# Checklist bài tập lớn

## Đã có trong khung project
- [x] React + TypeScript, backend Node.js, lệnh chạy chung.
- [x] Ba trang: tổng quan; nhập mẫu/CSV; đánh giá/model card.
- [x] API POST /api/raisin-classify, validation, xử lý lỗi, kiểm thử.
- [x] CSV minh họa và biểu đồ phân bố từ CSV tải lên.

## Dữ liệu và mô hình
- [ ] Script tải, checksum, license, data dictionary, báo cáo chất lượng.
- [ ] Protocol stratified split; thống nhất ít nhất 5 seed trước thí nghiệm.
- [ ] Giữ test độc lập; chọn tham số bằng CV trên train, fit preprocessing trong từng fold.
- [ ] Baseline lớp phổ biến và decision stump.
- [ ] Cây có cắt tỉa và Random Forest giới hạn độ sâu/lá.
- [ ] Đồ thị train/validation theo độ sâu.
- [ ] Pruning path, lựa chọn ccp_alpha.
- [ ] Rừng 50/100/300 cây trên cùng split.
- [ ] Mean ± std ít nhất 5 seed; không chọn seed đẹp nhất.
- [ ] Chốt mô hình/protocol rồi đánh giá test cuối; không tuning từ test.
- [ ] Accuracy, F1, ROC-AUC, train–test gap, confusion matrix và phân tích lỗi.

## Tích hợp và bàn giao
- [ ] Nạp model đã lưu trong Node, trả nhãn và xác suất thật.
- [ ] Đối chiếu kết quả suy luận Node với pipeline Python.
- [ ] Dashboard kết quả thật; model card gồm phiên bản, split, metrics và giới hạn.
- [ ] Cảnh báo ngoài miền dựa trên train; không tự sửa input.
- [ ] Chạy lại trên máy sạch; script train/evaluate tách biệt.
- [ ] Báo cáo 15–25 trang (PDF + DOCX/LaTeX), đúng đề cương giao nhiệm vụ.
- [ ] 10–12 slide; demo 5–7 phút; tổng trình bày 12–15 phút và vấn đáp.
- [ ] Nhật ký 6 tuần, bảng phân công 2 người, Git history, tự đánh giá.
- [ ] Cả hai thành viên có đóng góp dữ liệu/mô hình và web/báo cáo.
- [ ] Ghi nguồn hình/bảng, sử dụng AI và cách kiểm chứng.

Phần mở rộng chỉ làm khi phần bắt buộc hoàn chỉnh: phát hiện ngoài miền hoặc so permutation importance. Không bắt buộc cloud, mobile, deep learning hay database.
