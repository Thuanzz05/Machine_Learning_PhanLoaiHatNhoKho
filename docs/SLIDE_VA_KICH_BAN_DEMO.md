# SLIDE VÀ KỊCH BẢN DEMO — RAISIN LAB

**Project 18: Phân loại giống nho khô từ các đặc trưng hình học**

> Thời lượng đề xuất: **7–8 phút trình bày slide + 5–7 phút demo = 12–15 phút**.  
> Điền tên thành viên, lớp và giảng viên trước khi làm PowerPoint.

## Quy cách trình bày

- Tỷ lệ slide 16:9, nền sáng, chữ tím đậm và điểm nhấn xanh lá/cam đất giống giao diện Raisin Lab.
- Mỗi slide chỉ giữ 3–5 ý chính; phần “Lời trình bày” dùng làm speaker notes, không đưa toàn bộ lên slide.
- Font tối thiểu 24 pt; số kết quả chính từ 32–44 pt.
- Dùng hình trong `reports/figures/`; không chụp lại biểu đồ từ Word.
- Ba ảnh giao diện nên chụp ở cùng kích thước trình duyệt trước buổi báo cáo.

---

# PHẦN I — NỘI DUNG 12 SLIDE

## Slide 1 — Trang bìa

### Nội dung trên slide

**RAISIN LAB**  
**Phân loại giống nho khô từ các đặc trưng hình học**

- Project 18 — Học máy cơ bản
- Thành viên: [Họ tên – MSSV] · [Họ tên – MSSV]
- Giảng viên: PGS.TS Nguyễn Văn Hậu

### Hình đề xuất

Logo Raisin Lab hoặc ảnh chụp phần đầu trang Tổng quan.

### Lời trình bày — 20 giây

“Nhóm em thực hiện Project 18, xây dựng hệ thống Raisin Lab để phân loại hai giống nho khô Kecimen và Besni từ bảy đặc trưng hình học. Sản phẩm gồm pipeline học máy có thể chạy lại, backend Node.js và giao diện React để dự đoán cũng như công khai kết quả đánh giá.”

---

## Slide 2 — Bài toán và câu hỏi nghiên cứu

### Nội dung trên slide

**Bài toán**

- Đầu vào: 7 số đo hình học đã trích xuất từ ảnh.
- Đầu ra: Kecimen/Besni và xác suất hai lớp.
- Vai trò: hỗ trợ sàng lọc, không tự động loại sản phẩm.

**Câu hỏi nghiên cứu**

1. Cây có tổng quát trên test không?
2. Độ sâu và cắt tỉa ảnh hưởng thế nào?
3. Random Forest cải thiện được bao nhiêu?

### Lời trình bày — 35 giây

“Một dòng dữ liệu tương ứng một quả nho khô. Hệ thống không nhận ảnh trực tiếp mà nhận bảy số đo đã được trích xuất. Nhóm tập trung trả lời ba câu hỏi: cây quyết định có vượt baseline trên dữ liệu chưa học hay không; độ sâu và cắt tỉa tác động thế nào đến quá khớp; và Random Forest có cải thiện kết quả hoặc độ ổn định hay không.”

---

## Slide 3 — Dữ liệu và chất lượng

### Nội dung trên slide

**UCI Raisin Dataset · CC BY 4.0**

| Quy mô | Phân bố lớp | Chất lượng |
|---:|---:|---|
| 900 mẫu | 450 Kecimen | Không missing |
| 7 đặc trưng | 450 Besni | Không trùng đặc trưng |
| 1 nhãn | Cân bằng 50/50 | Không sửa hoặc loại dòng |

Đặc trưng: `Area`, `MajorAxisLength`, `MinorAxisLength`, `Eccentricity`, `ConvexArea`, `Extent`, `Perimeter`.

### Hình đề xuất

`reports/figures/eda_distributions.png`

### Lời trình bày — 45 giây

“Dữ liệu được tải từ UCI và kiểm tra bằng checksum. Bộ dữ liệu có 900 mẫu cân bằng tuyệt đối giữa hai giống. Nhóm kiểm tra schema, missing, số hữu hạn, dòng trùng, nhãn xung đột và các quan hệ hình học như trục lớn không nhỏ hơn trục nhỏ. Không có dòng lỗi nên toàn bộ 900 mẫu được giữ nguyên. Dữ liệu chỉ có số đo theo pixel và không có ảnh thô hoặc ID lô.”

---

## Slide 4 — Chia dữ liệu và chống leakage

### Nội dung trên slide

```text
900 mẫu
├── 720 phát triển: 360 Kecimen + 360 Besni
│   └── 5-fold CV × 5 seed = 25 lượt/ứng viên
└── 180 test khóa: 90 Kecimen + 90 Besni
```

- Split phân tầng, seed `2026`.
- Seed CV: `11, 23, 42, 67, 101`.
- Chọn bằng **F1-macro validation**.
- Khóa mô hình trước khi mở test.

### Lời trình bày — 45 giây

“Nhóm chia phân tầng 80/20 ngay sau bước kiểm tra chất lượng. Tập phát triển gồm 720 mẫu và test gồm 180 mẫu, mỗi tập vẫn cân bằng hai lớp. Trên tập phát triển, mỗi ứng viên chạy 5-fold qua năm seed, tương đương 25 lượt train–validation. F1-macro là metric chọn chính. Split, cấu hình, ứng viên và checksum model được khóa trước khi chạy test cuối, nên test không tham gia lựa chọn.”

---

## Slide 5 — Mô hình và bốn thí nghiệm

### Nội dung trên slide

**Mô hình so sánh**

- Baseline lớp phổ biến.
- Decision stump.
- Decision Tree có cắt tỉa.
- Random Forest giới hạn độ sâu/lá.

**Thí nghiệm**

| E01 | E02 | E03 | E04 |
|---|---|---|---|
| Độ sâu | `ccp_alpha` | 50/100/300 cây | 5 seed |

### Lời trình bày — 40 giây

“Nhóm không chỉ huấn luyện một mô hình rồi báo điểm. Hai baseline tạo mốc so sánh. E01 khảo sát độ sâu để nhìn quá khớp; E02 khảo sát cost-complexity pruning; E03 so sánh 50, 100 và 300 cây; E04 đo độ ổn định qua năm seed. Tất cả ứng viên dùng cùng split và fold.”

---

## Slide 6 — E01 và E02: Vì sao phải cắt tỉa?

### Nội dung trên slide

**Cây tự do**

- F1 train: `1,0000`
- F1 validation: `0,8023`
- Khoảng 68 lá

**Cây `ccp_alpha = 0,01`**

- F1 train: `0,8806`
- F1 validation: `0,8638 ± 0,0050`
- Khoảng 4 lá

**Kết luận:** ít phức tạp hơn nhưng tổng quát tốt hơn.

### Hình đề xuất

Ghép `reports/figures/depth_curve.png` và `reports/figures/alpha_curve.png`.

### Lời trình bày — 55 giây

“Khi tăng độ sâu, điểm train tăng liên tục nhưng validation giảm. Cây tự do khớp hoàn toàn 720 mẫu phát triển nhưng F1 validation chỉ còn khoảng 0,8023 và có khoảng 68 lá. Với alpha 0,01, cây được rút xuống khoảng bốn lá, F1 train giảm còn 0,8806 nhưng F1 validation tăng lên 0,8638. Đây là bằng chứng rõ rằng cắt tỉa giúp giảm quá khớp trong bài toán này.”

---

## Slide 7 — E03 và E04: Random Forest và độ ổn định

### Nội dung trên slide

| Số cây | F1-macro CV | ROC-AUC CV | Thời gian fit TB |
|---:|---:|---:|---:|
| 50 | 0,8625 ± 0,0057 | 0,9278 | 166,57 ms |
| 100 | 0,8622 ± 0,0031 | 0,9296 | 332,02 ms |
| 300 | **0,8636 ± 0,0035** | **0,9300** | 1.011,77 ms |

- Tăng số cây làm AUC và độ ổn định tăng nhẹ.
- F1 không tăng đơn điệu; chi phí tính toán tăng gần tuyến tính.

### Hình đề xuất

`reports/figures/forest_curve.png` hoặc `reports/figures/seed_stability.png`.

### Lời trình bày — 50 giây

“Random Forest 300 cây có F1 cao nhất trong họ rừng và AUC khoảng 0,93 trên CV. Tuy nhiên F1 của 100 cây thấp hơn nhẹ 50 cây, nên tăng số cây không bảo đảm điểm phân loại tăng. Độ lệch chuẩn giảm và AUC tăng nhẹ, đổi lại thời gian fit tăng gần tuyến tính. Kết quả qua năm seed khá ổn định, nên kết luận không phụ thuộc một lần chia thuận lợi.”

---

## Slide 8 — Kết quả test độc lập

### Nội dung trên slide

| Mô hình | Accuracy | F1-macro | ROC-AUC | Gap F1 train–test |
|---|---:|---:|---:|---:|
| Lớp phổ biến | 50,00% | 0,3333 | 0,5000 | 0,00 đ.% |
| Stump | 82,78% | 0,8278 | 0,8278 | 4,44 đ.% |
| **Cây cắt tỉa** | **83,89%** | **0,8389** | 0,8741 | **4,17 đ.%** |
| RF 300 cây | **83,89%** | 0,8385 | **0,9136** | 10,17 đ.% |

**Mô hình phục vụ:** cây `ccp_alpha = 0,01`.

### Lời trình bày — 60 giây

“Trên 180 mẫu test độc lập, cây cắt tỉa đạt Accuracy 83,89%, F1-macro 0,8389 và AUC 0,8741. Random Forest có cùng Accuracy, F1 thấp hơn rất nhẹ nhưng AUC cao hơn. Nhóm không đổi sang rừng sau khi xem test vì tiêu chí chọn là F1 CV đã khóa từ trước. Cây cũng có gap train–test 4,17 điểm phần trăm, nhỏ hơn nhiều so với 10,17 điểm của rừng, đồng thời dễ giải thích hơn.”

---

## Slide 9 — Ma trận nhầm lẫn và phân tích lỗi

### Nội dung trên slide

```text
                 Dự đoán
              Kecimen  Besni
Thật Kecimen     75      15
Thật Besni       14      76
```

- Kecimen: F1 `0,8380`.
- Besni: F1 `0,8398`.
- Tổng lỗi: `29/180 = 16,11%`.
- Lỗi cao hơn ở vùng `Area` và `Eccentricity` trung gian.

### Hình đề xuất

Ghép `reports/figures/confusion_matrices.png` và `reports/figures/error_groups.png`.

### Lời trình bày — 50 giây

“Mô hình nhận đúng 75 mẫu Kecimen và 76 mẫu Besni. F1 của hai lớp gần như bằng nhau nên chưa thấy thiên lệch mạnh về một giống. Phân tích theo tứ phân vị cho thấy lỗi tập trung ở vùng diện tích và độ lệch tâm trung gian, là nơi hình dạng hai giống có thể chồng lấn. Đây là mô tả tương quan trong test, không phải kết luận nhân quả.”

---

## Slide 10 — Kiến trúc web và kiểm chứng mô hình

### Nội dung trên slide

```text
Python offline
data → train → evaluate → JSON model
                            ↓
React + TypeScript ↔ Node.js + Express
```

- 3 màn hình: Tổng quan, Phân loại, Đánh giá.
- Form một mẫu và CSV tối đa 1.000 dòng.
- API validation rõ lỗi theo dòng/cột.
- **3.192 ca Python–Node: 0 lệch nhãn, 0 lệch xác suất.**

### Lời trình bày — 50 giây

“Huấn luyện chạy offline bằng Python. Mô hình cây được xuất sang JSON và Node.js nạp một lần khi khởi động; ứng dụng không train lại theo request. Frontend React hỗ trợ form, CSV và dashboard. Để bảo đảm cách suy luận tự cài trong Node đúng với scikit-learn, nhóm đối chiếu 3.192 trường hợp của bốn mô hình, gồm dữ liệu phát triển và mẫu tổng hợp gần ngưỡng. Kết quả không có sai khác nhãn hoặc xác suất.”

---

## Slide 11 — Demo Raisin Lab

### Nội dung trên slide

**Luồng demo**

1. Kiểm tra trạng thái model.
2. Phân loại một mẫu.
3. Phân loại CSV nhiều dòng.
4. Xem metric, biểu đồ và model card.

**API:** `/api/raisin-classify`  
**Model:** `raisin-1-fe3677bd45ef`

### Lời trình bày — 15 giây

“Tiếp theo nhóm demo luồng sử dụng thật của Raisin Lab: từ kiểm tra model, dự đoán một mẫu, xử lý một lô CSV đến xem bằng chứng đánh giá và giới hạn của mô hình.”

Sau câu này chuyển sang trình duyệt và dùng kịch bản ở Phần II.

---

## Slide 12 — Kết luận và giới hạn

### Nội dung trên slide

**Kết luận**

- Pipeline chạy từ dữ liệu thô đến web.
- Cắt tỉa giảm quá khớp rõ rệt.
- Test: Accuracy `83,89%`, F1 `0,8389`.
- Cây nhỏ, giải thích được và đủ nhanh cho demo.

**Giới hạn**

- 900 mẫu từ một nguồn, không có ID lô/ảnh thô.
- Xác suất chưa hiệu chuẩn, chưa cảnh báo ngoài miền.
- Chưa xác nhận trên dây chuyền thực tế.

### Lời trình bày — 45 giây

“Nhóm đã hoàn thành pipeline từ dữ liệu thô đến ứng dụng web, giữ test độc lập và chứng minh cắt tỉa làm mô hình tổng quát tốt hơn cây tự do. Mô hình cuối đạt F1 0,8389 và có cấu trúc nhỏ, phù hợp mục tiêu giải thích. Tuy nhiên dữ liệu chỉ có 900 mẫu từ một nguồn, không có ID lô và xác suất chưa hiệu chuẩn. Vì vậy hệ thống chỉ hỗ trợ sàng lọc. Hướng tiếp theo là kiểm tra trên máy và dữ liệu ngoài nguồn, chia theo lô, hiệu chuẩn xác suất và phát hiện mẫu ngoài miền.”

---

# PHẦN II — KỊCH BẢN DEMO 5–7 PHÚT

## Chuẩn bị trước buổi demo

1. Checkout đúng commit dùng để nộp.
2. Chạy từ thư mục gốc:

```sh
npm ci
npm run build
npm test
npm run dev
```

3. Mở sẵn:
   - Web: `http://127.0.0.1:5173/`;
   - tùy chọn tab health: `http://127.0.0.1:3001/api/health`.
4. Đặt file `frontend/public/sample.csv` ở vị trí dễ chọn.
5. Tắt thông báo hệ điều hành, đóng tab thừa và đặt zoom trình duyệt 100%.
6. Thử lại toàn bộ luồng một lần; không sửa code hoặc train lại ngay trước khi trình bày.

## 0:00–0:35 — Tổng quan hệ thống

### Thao tác

- Mở trang **Tổng quan**.
- Chỉ vào trạng thái “API đã kết nối · Mô hình sẵn sàng”.
- Lướt nhanh qua số liệu 900 mẫu, 7 đặc trưng, 2 giống và F1 83,89%.

### Lời nói

“Đây là trang Tổng quan của Raisin Lab. Trạng thái phía trên cho biết backend đã kết nối và artifact mô hình đã được nạp. Ứng dụng dùng 7 đặc trưng hình học để phân biệt 2 giống trên bộ dữ liệu 900 mẫu. Con số 83,89% ở đây là F1-macro trên 180 mẫu test độc lập, không phải độ chắc chắn của từng dự đoán.”

## 0:35–2:10 — Phân loại một mẫu

### Thao tác

1. Chọn tab **Phân loại**.
2. Bấm **Dùng số đo minh họa**.
3. Dừng một nhịp để người xem thấy đủ bảy trường và đơn vị.
4. Bấm **Phân loại mẫu này**.
5. Chỉ vào nhãn, hai thanh xác suất và phiên bản mô hình.

### Lời nói

“Trang Phân loại yêu cầu đúng bảy số đo. Mỗi trường có tên, đơn vị và ràng buộc; ví dụ độ lệch tâm nằm trong khoảng từ 0 đến 1, trục lớn phải không nhỏ hơn trục nhỏ và diện tích bao lồi phải không nhỏ hơn diện tích. Em dùng bộ số minh họa để tiết kiệm thời gian. Sau khi gửi, frontend gọi API Node.js. Kết quả gồm nhãn, xác suất của cả Kecimen và Besni, cùng phiên bản model. Xác suất này chưa hiệu chuẩn nên chỉ được xem là điểm hỗ trợ.”

### Điểm cần nhấn mạnh

- Không nói “mô hình chính xác X% cho mẫu này”.
- Nói “xác suất mô hình trả về” hoặc “điểm của lớp”.
- Kết quả cụ thể có thể là Kecimen hoặc Besni tùy bộ số đang dùng; đọc đúng nội dung trên màn hình.

## 2:10–3:50 — Phân loại một lô CSV

### Thao tác

1. Tại phần “Hoặc đọc một lô CSV”, chọn `frontend/public/sample.csv`.
2. Chỉ vào biểu đồ phân bố và số dòng hợp lệ.
3. Bấm **Phân loại 3 mẫu**.
4. Cuộn bảng kết quả và chỉ vào thứ tự dòng/nhãn/xác suất.

### Lời nói

“Ngoài một mẫu, ứng dụng nhận CSV từ 1 đến 1.000 dòng. File phải có đúng bảy cột và không có cột nhãn. Trình duyệt đọc file, kiểm tra dữ liệu và vẽ phân bố để người dùng phát hiện nhanh giá trị bất thường. Khi gửi, API xử lý cả lô nhưng vẫn giữ nguyên thứ tự dòng. Nếu một ô sai, hệ thống từ chối toàn bộ lô và chỉ rõ dòng, cột cần sửa; không tự điền 0 hoặc bỏ dòng.”

### Nếu giảng viên hỏi giới hạn

“Giới hạn hiện tại là 1 MB và 1.000 dòng mỗi request. Đây là lựa chọn cho demo và tránh request quá lớn; có thể điều chỉnh nếu có yêu cầu vận hành thật.”

## 3:50–5:25 — Dashboard đánh giá

### Thao tác

1. Chọn tab **Đánh giá**.
2. Chỉ vào ba metric: Accuracy, F1-macro và ROC-AUC.
3. Chỉ vào bảng bốn mô hình.
4. Đổi combobox biểu đồ lần lượt sang:
   - “E01 · Độ sâu cây”;
   - “E02 · Chọn mức cắt tỉa”;
   - “Ma trận nhầm lẫn”.

### Lời nói

“Dashboard chỉ hiển thị kết quả từ thí nghiệm đã lưu, không tính lại theo CSV người dùng. Cây cắt tỉa đạt Accuracy 83,89%, F1-macro 0,8389 và AUC 0,8741. Bảng so sánh cho thấy rừng có AUC cao hơn nhưng F1 gần như ngang bằng và gap train–test lớn hơn. Biểu đồ độ sâu cho thấy cây sâu quá khớp; biểu đồ alpha cho thấy mức 0,01 rút cây xuống khoảng bốn lá và tăng validation. Ma trận nhầm lẫn của cây là 75–15 và 14–76.”

## 5:25–6:20 — Model card và giới hạn

### Thao tác

- Cuộn đến **Hồ sơ mô hình**.
- Chỉ vào phiên bản, nguồn, split và mục giới hạn.

### Lời nói

“Model card gắn trực tiếp với artifact đang phục vụ. Phiên bản là `raisin-1-fe3677bd45ef`; dữ liệu được chia 720 mẫu phát triển và 180 mẫu test. Python và Node.js đã được đối chiếu trên 3.192 trường hợp mà không lệch nhãn hoặc xác suất. Hệ thống không nhận ảnh trực tiếp, chưa hiệu chuẩn xác suất, chưa cảnh báo ngoài miền và chưa được xác nhận trên dây chuyền thực tế.”

## 6:20–6:45 — Kết thúc demo

### Thao tác

- Trở về slide 12 hoặc giữ trang model card.

### Lời nói

“Demo cho thấy cùng một artifact được nối từ pipeline học máy sang API và giao diện, đồng thời người dùng có thể xem cả dự đoán lẫn bằng chứng đánh giá. Nhóm giữ vai trò của hệ thống ở mức hỗ trợ sàng lọc và công khai các giới hạn thay vì chỉ hiển thị một nhãn.”

---

# PHẦN III — PHƯƠNG ÁN DỰ PHÒNG KHI DEMO

## Trường hợp API chưa kết nối

1. Không bấm dự đoán liên tục.
2. Kiểm tra terminal có cả tiến trình `api` và `web`.
3. Nếu cổng bận, dừng tiến trình cũ rồi chạy lại `npm run dev`.
4. Mở `/api/health`; chỉ tiếp tục khi `modelReady` là `true`.

Lời nói dự phòng:

“Backend chưa nạp xong artifact nên giao diện chủ động khóa suy luận thay vì trả kết quả giả. Nhóm kiểm tra health và khởi động lại dịch vụ.”

## Trường hợp không chọn được CSV

- Tiếp tục demo một mẫu và dashboard.
- Có thể mở `sample.csv` trong editor để trình bày đúng bảy cột.
- Không dùng file dữ liệu UCI có cột `Class` làm file dự đoán.

## Trường hợp hết thời gian

Ưu tiên theo thứ tự:

1. Một mẫu và xác suất;
2. dashboard test;
3. model card/giới hạn;
4. bỏ phần CSV nếu chỉ còn dưới hai phút.

---

# PHẦN IV — PHÂN CÔNG TRÌNH BÀY GỢI Ý

| Phần | Người trình bày | Thời lượng |
|---|---|---:|
| Slide 1–4: bài toán, dữ liệu, leakage | Thành viên 1 | 2,5 phút |
| Slide 5–9: mô hình, thí nghiệm, kết quả | Thành viên 2 | 3,5 phút |
| Slide 10: kiến trúc và parity | Thành viên 1 | 1 phút |
| Slide 11 + demo | Hai thành viên luân phiên | 5–7 phút |
| Slide 12: kết luận và giới hạn | Thành viên 2 | 45 giây |

Khi demo, một người thao tác và một người nói. Chỉ đổi vai tại ranh giới rõ ràng, chẳng hạn sau phần dự đoán một mẫu hoặc trước dashboard. Cả hai thành viên cần trả lời được câu hỏi về split, leakage, metric, cắt tỉa, Random Forest và API.

---

# CHECKLIST TRƯỚC KHI THUYẾT TRÌNH

- [ ] Đã điền đúng tên, MSSV, lớp và giảng viên.
- [ ] Slide dùng đúng số liệu từ `reports/evaluation.json`.
- [ ] Đã chèn hình gốc rõ nét, có chú thích nguồn.
- [ ] Đã chạy `npm run build` và `npm test`.
- [ ] Đã thử form một mẫu và `sample.csv`.
- [ ] API health báo model sẵn sàng.
- [ ] Không gọi xác suất một mẫu là “độ chính xác”.
- [ ] Không nói test được dùng chọn mô hình.
- [ ] Hai thành viên đã luyện chuyển phần và canh giờ.
- [ ] Có bản PDF slide và video/ảnh dự phòng nếu máy demo gặp lỗi.
