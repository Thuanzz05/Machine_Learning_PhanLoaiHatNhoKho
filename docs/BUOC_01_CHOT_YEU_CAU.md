# Bước 1 — Chốt bài toán, phạm vi và tiêu chí hoàn thành

**Dự án:** Project 18 — Phân loại giống nho khô.  
**Ngày lập:** 29/09/2026 · **Phiên bản yêu cầu:** 1.0.  
**Trạng thái:** Đã lập bản yêu cầu để triển khai; chưa có dữ liệu tải về, mô hình hoặc kết quả đánh giá trong bước này.

> **Cập nhật tiến độ 30/09/2026:** Đây là ảnh chụp quyết định tại Bước 1. Các bước dữ liệu, thí nghiệm, đánh giá và tích hợp sau đó đã hoàn thành; trạng thái hiện tại được theo dõi tại [KE_HOACH.md](KE_HOACH.md) và [README dự án](../README.md).

Đây là bản tóm tắt làm việc cho W01 trong [kế hoạch chi tiết](KE_HOACH_PHAN_TICH_NGHIEP_VU_VA_YEU_CAU.md). Yêu cầu bắt buộc lấy từ đề Project 18; các lựa chọn triển khai bên dưới là phương án ban đầu của dự án, không phải xác nhận của giảng viên.

## 1. Bài toán cần giải quyết

Xây dựng ứng dụng hỗ trợ phân biệt hai giống nho khô **Kecimen** và **Besni** dựa trên bảy đặc trưng hình học đã được trích xuất. Một dòng dữ liệu tương ứng một quả nho; dự đoán được thực hiện sau khi có đủ số đo và trước khi biết nhãn thật.

Đầu vào gồm `Area`, `MajorAxisLength`, `MinorAxisLength`, `Eccentricity`, `ConvexArea`, `Extent`, `Perimeter`. Đầu ra là nhãn dự đoán và xác suất do mô hình ước lượng cho từng lớp. `Class` là nhãn thật chỉ dùng khi học và đánh giá, không phải đầu vào dự đoán.

Người thao tác nhập một mẫu hoặc tải CSV để tham khảo kết quả. Giảng viên/người đánh giá xem kết quả thí nghiệm và khả năng tái lập. Hai thành viên dự án chuẩn bị dữ liệu, huấn luyện và bàn giao mô hình. Người thao tác giữ quyết định cuối cùng; ứng dụng không tự loại sản phẩm.

**Câu hỏi nghiên cứu:** Cây quyết định dự đoán trên dữ liệu chưa học tốt đến đâu? Độ sâu và cắt tỉa ảnh hưởng thế nào? Random Forest có cải thiện so với cây và baseline, và kết quả có ổn định qua các seed không?

## 2. Phạm vi thực hiện

**Bắt buộc theo đề:**

- Dữ liệu Raisin, hồ sơ nguồn/giấy phép, kiểm tra chất lượng và từ điển dữ liệu.
- Baseline lớp phổ biến, decision stump, cây quyết định có cắt tỉa và Random Forest có kiểm soát độ phức tạp.
- Bốn thí nghiệm: thay đổi độ sâu; pruning path và `ccp_alpha`; rừng 50/100/300 cây; độ ổn định với ít nhất 5 seed.
- Accuracy, F1, ROC-AUC, chênh lệch train–test, ma trận nhầm lẫn và phân tích lỗi.
- Web có tổng quan, phân loại và đánh giá; nhập form/CSV, biểu đồ phân bố, API JSON, kiểm tra đầu vào và hồ sơ mô hình.
- Mã nguồn tái lập, mô hình/cấu hình, báo cáo 15–25 trang, slide, demo và hồ sơ làm việc nhóm.

**Tùy chọn:** Cảnh báo ngoài miền dữ liệu đã học, permutation importance hoặc xuất kết quả CSV sau khi hoàn tất phần bắt buộc.

**Ngoài phạm vi tối thiểu:** Nhận ảnh/camera, trích đặc trưng từ ảnh, tài khoản, quản lý kho, cơ sở dữ liệu, triển khai cloud và tự huấn luyện lại từ CSV người dùng.

## 3. Luồng sử dụng và quy tắc xử lý

1. Người dùng nhập đủ bảy số đo hoặc chọn CSV có đúng bảy cột đặc trưng.
2. Giao diện và API kiểm tra dữ liệu. Nếu có lỗi, chỉ rõ trường/dòng cần sửa.
3. Dữ liệu hợp lệ được đưa vào mô hình đã huấn luyện và lưu sẵn.
4. Trả nhãn, xác suất hai lớp và phiên bản mô hình; giữ đúng thứ tự các dòng.
5. Người dùng xem kết quả và giới hạn; có thể mở trang đánh giá để kiểm chứng chất lượng chung.

Giữ quy tắc của khung hiện tại: CSV từ 1 đến 1.000 dòng; giới hạn riêng 1 MB cho tệp và 1 MB cho JSON gửi đến API. Có dòng sai thì từ chối cả lô, không âm thầm bỏ dòng hoặc điền số 0. Model thiếu/hỏng phải báo chưa sẵn sàng. Dữ liệu người dùng nhập không tự được dùng để huấn luyện. Xác suất một mẫu không được gọi là độ chính xác của toàn hệ thống.

## 4. Tiêu chí hoàn thành dự án

- **Đầu vào/đầu ra:** Mẫu hợp lệ nhận được nhãn và xác suất thật; CSV có đủ kết quả đúng thứ tự. Mẫu sai nhận thông báo sửa rõ ràng. Đối chiếu FR02–FR05 và KT01–KT08 trong kế hoạch.
- **Dữ liệu:** Tái tạo được dữ liệu từ nguồn đã ghi; có kiểm đếm, checksum, từ điển và giải thích dòng bị loại. Ba dòng CSV minh họa giao diện không được tính là dữ liệu Raisin thật.
- **Thí nghiệm:** Đủ hai baseline và E01–E04, lưu cấu hình và kết quả từng lượt, báo mean ± std. Không bỏ seed có điểm thấp.
- **Đánh giá:** Chọn tham số bằng dữ liệu phát triển; giữ test độc lập đến đợt đánh giá cuối. Báo đủ metric và giải thích nếu mô hình không vượt baseline. Đề không bắt buộc Accuracy 90% hoặc 95%.
- **Tích hợp:** Web và Python cho cùng nhãn theo cùng chính sách; kiểm xác suất, thứ tự feature và trường hợp hòa. Mô hình phục vụ phải đúng phiên bản đã đánh giá.
- **Bàn giao:** Chạy lại được theo README; có báo cáo PDF và nguồn DOCX/LaTeX, 10–12 slide, demo 5–7 phút trong tổng trình bày 12–15 phút và vấn đáp; đủ nhật ký và đóng góp của hai người.

Các tiêu chí trên là điều kiện nghiệm thu tương lai, **chưa được đánh dấu đạt** chỉ vì bản yêu cầu đã hoàn thành.

## 5. Lựa chọn ban đầu cho các bước tiếp theo

- **Công nghệ:** Tiếp tục React + TypeScript, Node.js + Express; Python huấn luyện offline. Cách xuất mô hình sang Node sẽ được thử tương thích trước khi tích hợp bản cuối.
- **Đánh giá dự kiến:** Test cố định 20%, chia phân tầng với seed `2026`; phần 80% còn lại dùng CV 5 fold, lặp các seed `[11, 23, 42, 67, 101]`. Nếu có mẫu trùng/phụ thuộc, xử lý nhóm trước khi khóa split để giữ tính độc lập.
- **Chọn mô hình:** Theo F1-macro validation trung bình; báo kèm Accuracy và ROC-AUC. Cấu hình, cách xử lý hòa điểm và split phải được ghi vào cấu hình thực thi trước khi chạy thí nghiệm.
- **Chính sách nhãn cây/rừng:** `Kecimen = 0`, `Besni = 1`; `p(Besni) >= 0,5` trả Besni. Baseline lớp phổ biến có quy tắc riêng: nếu số lượng hai lớp bằng nhau thì chọn Kecimen. Cùng quy tắc phải được áp dụng khi đánh giá và phục vụ web.
- **Nhiều seed:** Dự kiến báo mean ± std trên năm trung bình CV theo seed; test dùng một đợt cuối cho các mô hình đã khóa. Cần đối chiếu cách hiểu này ở checkpoint đầu với giảng viên, trước khi xem test; không ghi nhận là đã được giảng viên xác nhận.

Thiết kế đầy đủ nằm ở mục 8 của kế hoạch chi tiết. Chưa chạy chia tập hoặc huấn luyện trong bước 1. Mọi thay đổi sau này phải ghi lý do và thời điểm, đặc biệt không đổi phương pháp để chạy theo điểm test.

## 6. Thông tin còn để trống

- Thành viên A và B: chưa có họ tên/mã sinh viên.
- Ngày bắt đầu, hạn nộp chính thức: chưa được cung cấp; tiếp tục dùng lịch tương đối sáu tuần.
- Máy demo và quyết định xử lý chất lượng dữ liệu: xác định khi có máy và tệp thật.

Các thông tin này không ngăn việc bắt đầu thu thập dữ liệu ở bước 2. Không tự điền thông tin cá nhân, lịch hoặc kết quả học máy.

## 7. Kết quả bước 1 và bước kế tiếp

- [x] Xác định bài toán, người sử dụng, thời điểm dự đoán và bảy đặc trưng đầu vào.
- [x] Phân biệt yêu cầu bắt buộc, tùy chọn và ngoài phạm vi.
- [x] Ghi luồng nghiệp vụ, tiêu chí nghiệm thu và lựa chọn ban đầu.
- [x] Đối chiếu với schema hiện có và sửa checklist để phần ngoài miền dữ liệu đúng là tùy chọn.
- [ ] **Bước 2 — W02:** Tải Raisin từ nguồn UCI, giữ bản gốc, ghi nguồn/ngày tải/checksum/giấy phép và lập từ điển dữ liệu.

Nguồn chính: [đề Project 18](../Project_18_phan_loai_hat_nho_kho.docx), [kế hoạch phân tích đầy đủ](KE_HOACH_PHAN_TICH_NGHIEP_VU_VA_YEU_CAU.md), [schema đầu vào](../shared/features.json). Bài giảng GitHub Bài 6 v3 và những khác biệt so với PDF cục bộ đã được đối chiếu tại mục 2 của kế hoạch.
