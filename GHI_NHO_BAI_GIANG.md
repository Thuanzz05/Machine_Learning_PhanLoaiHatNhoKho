# Ghi nhớ Bài 6 — Cây quyết định

Đã đọc trực tiếp toàn bộ 67 ảnh trong `Images_bai_giang` ngày 28/09/2026. Giảng viên trên slide: PGS.TS Nguyễn Văn Hậu. Đây là ghi chú tổng hợp để tra cứu lại trong dự án, không phải bản chép nguyên văn.

## Phạm vi nguồn

Bộ slide đánh số đến 68. Ảnh hiện có gồm 62 trang đánh số khác nhau, một ảnh chụp lặp trang 8 và bốn ảnh tổng kết. Không thấy trang 6, 16, 20, 24, 57, 60. Một số mép ảnh bị cắt; không tự bổ sung nội dung trang thiếu. Các số liệu thực nghiệm dưới đây được đọc từ slide, chưa chạy lại dữ liệu hay mã nguồn của giảng viên.

## 1. Bài toán và dữ liệu (trang 1–5)

- Case Olist: dự báo một đơn có giao trễ không, tại thời điểm duyệt đơn. Bài 4 dự báo số ngày bằng hồi quy tuyến tính; bài 5 dùng logistic; bài 6 dùng quy tắc phân nhánh của cây.
- Nhãn `y = 1{date(t_giao) > date(t_hen)}`. So theo ngày lịch: giao cùng ngày hẹn vẫn là 0, kể cả buổi tối.
- Chọn đặc trưng biết được lúc dự báo; nhãn chỉ được biết sau khi giao. Tránh dùng thông tin tương lai.
- Giữ phép chia theo thời gian và chỉ dùng nhãn có thể biết tại ranh giới train/validation.

| Tập | Thời gian duyệt | Điều kiện giao | Số đơn | Số trễ |
|---|---|---|---:|---:|
| Train | 01–10/2017 | Trước 01/11/2017 | 29.031 | 941 |
| Validation | 11–12/2017 | Trước 01/01/2018 | 10.389 | 634 |
| Test | 01–06/2018 | Cuối cùng đã giao | 40.266 | 3.478 |

Chỉ gồm đơn hoàn tất hợp lệ, không đại diện mọi đơn mới.

## 2. Cây và đầu ra tại lá (trang 7–14)

- Gốc/nút trong đặt câu hỏi; mỗi mẫu đi đúng một nhánh tại mỗi nút, đến một lá.
- Trong ví dụ không trọng số, điểm ở lá là `p = số mẫu lớp 1 trong lá / số mẫu train trong lá`.
- Quyết định cảnh báo là bước riêng: `p >= tau`. Lá có 6 đúng hạn, 2 trễ cho p=0,25: tau=0,50 không cảnh báo; tau=0,20 cảnh báo.
- Tỷ lệ lớp phải tính lại theo số mẫu ở nút đang xét, không luôn chia cho kích thước tập gốc.

### Dữ liệu 12 đơn mô phỏng để tính tay

Đây không phải các đơn Olist thật. x có đơn vị 100 km; phép chia nhị phân theo một cột, nhánh `<=` sang trái.

| ID | x | Hẹn (ngày) | y |
|---|---:|---:|---:|
| M01 | 1 | 10 | 1 |
| M02 | 2 | 20 | 0 |
| M03 | 3 | 20 | 0 |
| M04 | 4 | 10 | 1 |
| M05 | 5 | 20 | 0 |
| M06 | 6 | 20 | 0 |
| M07 | 7 | 10 | 1 |
| M08 | 8 | 20 | 0 |
| M09 | 9 | 20 | 0 |
| M10 | 10 | 10 | 1 |
| M11 | 11 | 20 | 1 |
| M12 | 12 | 20 | 1 |

## 3. Gini và chọn phép chia (trang 14–23)

- `G(t) = 1 - sum_k p_tk^2`; nhị phân: `G(t) = 2p_t(1-p_t)`.
- Nút thuần có G=0; nhị phân cân bằng có G=0,5. Có thể hiểu là xác suất hai lần rút độc lập có hoàn lại cho hai nhãn khác nhau.
- `G_sau = (n_L/n_t)G(L) + (n_R/n_t)G(R)`.
- Gain cục bộ: `Delta_t = G(t) - G_sau`. So các phép chia hợp lệ trên cùng nút và chọn gain lớn nhất.
- Phải cân theo số mẫu: một lá nhỏ không có trọng lượng ngang toàn bộ phần còn lại.
- `G'(p)=2-4p`; độ dốc lớn gần hai đầu không đủ để kết luận mọi phép chia ưu tiên nút gần thuần.

Ví dụ ở gốc: 6 đúng, 6 trễ, G=0,5.

| Phép chia | Con trái (đúng/trễ) | Con phải (đúng/trễ) | G sau | Gain |
|---|---|---|---:|---:|
| x <= 6,5 | 4/2 | 2/4 | 4/9 | 1/18 ≈ 0,0556 |
| Hẹn <= 15 | 0/4 | 6/2 | 1/4 | 1/4 = 0,25 |

Chia cân bằng số lượng chưa chắc tốt. Hẹn <=15 tốt hơn trong hai phép chia này và tốt nhất trong toàn bộ 12 ứng viên ở gốc.

Ngưỡng ứng viên lấy trung điểm giữa hai giá trị phân biệt liên tiếp đã sắp xếp: `t_j=(v_j+v_(j+1))/2`. Ở gốc có 11 ngưỡng khoảng cách (1,5 đến 11,5) và một ngưỡng hẹn (15). Khoảng cách <=9,5 cho gain 1/6, vẫn nhỏ hơn 1/4. CART quét ứng viên, không dùng Gradient Descent để tìm ngưỡng.

## 4. Dựng cây đệ quy và gain toàn tập (trang 25–35)

Sau chia hẹn <=15, nhánh trái có 4 mẫu trễ, đã thuần. Nhánh phải chỉ còn M02, M03, M05, M06, M08, M09, M11, M12; tất cả hẹn 20 nên cột hẹn không còn ngưỡng chia.

Nhánh phải chia x <=10 (trung điểm 9 và 11): trái có 6 đúng, phải có 2 trễ, cả hai thuần.

- Gain cục bộ tại nút phải: 3/8 = 0,375.
- Đóng góp theo toàn tập: `(8/12)*(3/8)=1/4=0,25`.
- Không cộng trực tiếp gain cục bộ của các nút khác kích thước. Tổng đóng góp là `0,25+0,25=0,5`, bằng Gini gốc khi mọi lá thuần.
- Cây cuối: độ sâu 2, 3 lá, 5 nút (2 nút hỏi). Cây nhị phân mỗi nút trong có hai con thỏa `N_nodes=2L-1`.
- Quy tắc: hẹn <=15 → p=1; hẹn >15 và x<=10 → p=0; hẹn >15 và x>10 → p=1.
- M11: hẹn 20 → phải; x=11 → phải; p=1 → dự đoán trễ. M02 đến lá p=0.
- Khớp 12/12 mẫu mô phỏng chưa chứng minh dự báo tốt trên mẫu mới.

Thủ tục CART: kiểm điều kiện dừng → liệt kê phép chia hợp lệ → chọn gain lớn nhất → chia tập tại nút → lặp trên hai tập con. Không còn phép chia hợp lệ thì dừng dù nhãn còn lẫn.

## 5. Kiểm soát độ phức tạp và cắt tỉa (trang 36–44)

- `max_depth`: giới hạn độ sâu.
- `min_samples_leaf`: số mẫu tối thiểu ở mỗi lá con. Giá trị 3 loại phép chia 8 thành 6 và 2.
- `min_impurity_decrease`: mức giảm có trọng số theo toàn bộ train, tức `(n_t/N)*Delta_t`.
- Fit trên train, đo train và validation, chọn độ phức tạp bằng validation. Train=100% là tín hiệu cần kiểm tra, tự nó chưa chứng minh quá khớp.
- Ví dụ hai mặt trăng mô phỏng: 300 train và 300 validation; theo chú thích slide, depth 2–4 đạt validation 87,67%, cây tự do có 40 lá, train 100%, validation 84,67%. Đây là một phép chạy minh họa, không phải quy luật đơn điệu cho mọi dữ liệu.
- Cắt tỉa đánh giá cả nhánh; không bảo đảm luôn hơn dừng sớm.

Hàm mục tiêu:

`R(T) = sum_(lá l) (n_l/N)*G(l)`

`R_alpha(T) = R(T) + alpha*|L(T)|`, alpha >=0.

Alpha phạt mỗi lá, khác ngưỡng cảnh báo tau và khác learning rate.

| Cây mô phỏng | R(T) | R_alpha |
|---|---:|---|
| 3 lá | 0 | 3 alpha |
| 2 lá | 0,25 | 0,25 + 2 alpha |
| 1 lá | 0,50 | 0,50 + alpha |

Alpha=0,10 chọn 3 lá; alpha=0,30 chọn 1 lá; alpha=0,25 cả ba hòa ở 0,75. Cây 2 lá không thắng riêng trên một khoảng alpha. Chọn alpha bằng validation.

## 6. Thực nghiệm Olist (trang 45–53)

- Sáu đặc trưng: khoảng cách, ngày hẹn, giá hàng, phí vận chuyển, số dòng hàng, khối lượng.
- Điền thiếu median và z-score chỉ học trên train. Scaler giữ để tái lập pilot; cây không cần thang đo Euclid.
- Gini; `min_samples_leaf=200`; seed 42; so `max_depth` 3 và 6.
- Chọn cấu trúc bằng AP validation, hòa ưu tiên ít lá. Sau đó mới chọn ngưỡng theo chi phí giả định.

| max_depth | Lá thực tế | AP validation | AUC validation |
|---:|---:|---:|---:|
| 3 | 6 | 0,082 | 0,542 |
| 6 | 23 | 0,100 | 0,627 |

Chọn cây sâu 6. Nút gốc hỏi khoảng cách <=1395,27 km (làm tròn): 29.031 mẫu, 941 trễ. Con trái 25.817 mẫu/728 trễ/p≈0,0282; con phải 3.214 mẫu/213 trễ/p≈0,0663. Hai con này là nút trung gian, chưa phải lá cuối.

Lá số 2 có 33/297 trễ → p=1/9≈0,1111. Tau=0,50 không cảnh báo, tau=0,10 cảnh báo. Đây là tần suất train, chưa chứng minh xác suất đã hiệu chuẩn.

Đọc giải thích phải đi hết đường từ gốc đến lá, đối chiếu đặc trưng/ngưỡng, số mẫu train, số trễ, điểm và quyết định. Slide nhắc viewer `Bai06_Du_lieu_that.html` nhưng ghi chú này chưa kiểm tra viewer.

Ngưỡng chọn trên validation với chi phí giả định `FP+5FN`, lưới 0,05; 0,10; 0,15; 0,20; 0,30; 0,50. Chọn 0,10; nếu hòa ưu tiên ít cảnh báo rồi ngưỡng lớn hơn. Khóa cấu trúc và ngưỡng trước khi đọc test.

| Ngưỡng cây | TN | FP | FN | TP |
|---|---:|---:|---:|---:|
| 0,50 | 36.788 | 0 | 3.478 | 0 |
| 0,10 | 34.659 | 2.129 | 3.046 | 432 |

Tau=0,50: accuracy 91,36% nhưng bỏ sót mọi đơn trễ, recall=0; precision dạng tỷ số không xác định vì TP+FP=0.

Tau=0,10: 2.561 cảnh báo; precision≈0,169; recall≈0,124. Bắt thêm trễ nhưng có nhiều cảnh báo nhầm.

| Test 40.266 đơn; ngưỡng 0,10 chọn từ validation | Logistic bài 5 | Cây sâu 6 |
|---|---:|---:|
| TP / FP | 161 / 359 | 432 / 2.129 |
| Recall | 0,046 | 0,124 |
| AP | 0,159 | 0,134 |
| FP + 5FN | 16.944 | 17.359 |

Cây tăng recall nhưng AP thấp hơn và chi phí giả định cao hơn logistic. AP đo chất lượng xếp hạng, không trực tiếp đo chi phí cảnh báo.

## 7. Tầm quan trọng và giới hạn (trang 54–56)

- MDI: giảm tạp chất train, chuẩn hóa tổng bằng 1 khi tổng giảm >0.
- Permutation importance: mức AP validation giảm khi hoán vị một cột; bài dùng 5 lần. Thanh sai số là SD giữa các lần, không phải khoảng tin cậy.
- Hai cách có thang đo khác nhau; cả hai không tự chứng minh quan hệ nhân quả.
- Giới hạn: chỉ đơn cuối cùng đã giao; metadata tĩnh thiếu snapshot lịch sử; chưa chứng minh hiệu chuẩn xác suất hay tác động cảnh báo; chi phí giả định, chưa có đánh giá tại Việt Nam.
- Pilot tổng hợp 16 đơn thiếu toàn bộ khối lượng thành 0; cần nêu rõ.

## 8. Câu hỏi kiểm tra và exit ticket

- Q1: C — 2/8=0,25 >=0,20 nên cảnh báo.
- Q3: B — G sau = (4/12)*0+(8/12)*0,375=0,25.
- Q4: C — đóng góp nút phải theo toàn tập là 0,25.
- Q5: B — alpha=0,30: một lá có mục tiêu 0,80 < ba lá 0,90.
- Q6: C — tăng recall phải cân với 2.129 FP và mục tiêu chi phí.
- Q2 không có ảnh riêng trong thư mục hiện tại.

Exit ticket (trang 58–59): cha 6 đúng/4 trễ; trái 4 đúng/0 trễ; phải 2 đúng/4 trễ.

`G_cha=0,48`; `G_sau=(4/10)*0+(6/10)*(4/9)=4/15`; `gain=16/75≈0,2133`.

Lá phải p=4/6=2/3; tau=0,70 → nhãn 0. Gain train cao không bảo đảm tốt ngoài mẫu.

## 9. Phần mở rộng (trang 61–68)

- Entropy: `H(t)=-sum_k p_tk*log2(p_tk)`, quy ước 0log2(0)=0. Nhị phân thuần 0 bit, cân bằng 1 bit. Đổi cơ số log không đổi thứ tự gain trong cùng tiêu chí; Gini và entropy có thể chọn cây khác nhau.
- Tổng gain: `sum_(nút trong t) (n_t/N)*Delta_t = G(root) - sum_(lá l) (n_l/N)*G(l)`.
- MDI của cột j là tổng đóng góp của các nút chia theo j, chia tổng đóng góp của mọi nút trong. Trong mô phỏng 12 đơn, mỗi cột có MDI=0,50; cây chỉ có gốc có importance 0.
- XOR: gain bước đầu 0 vẫn có thể dẫn tới các lá thuần ở bước hai. Slide báo sâu 1→50%; sâu 2/gain tối thiểu 0→100%; sâu 2/gain tối thiểu 0,01→50%. Phải nêu rõ điều kiện dừng.
- Biến đổi affine dương bảo toàn thứ tự và trung điểm trong số học chính xác. Biến đổi đơn điệu phi tuyến như bình phương trên x>=0 giữ phân hoạch train nhưng có thể đổi dự đoán mẫu mới. Ví dụ train x=0 và 2, mẫu mới x=1,2 có thể đổi nhánh sau bình phương. Xoay/trộn cột đổi họ nhát cắt theo trục. Theo slide, raw/scaled Olist có 12 điểm test đổi score, nhãn ở ngưỡng 0,5 đều là 0.
- Alpha hiệu dụng của nhánh: `alpha_eff(t)=[R(t)-R(T_t)]/[|L(T_t)|-1]`; hai R phải cùng chuẩn hóa theo toàn bộ train.
- Trung bình B cây: `Var(mean Z_b)=sigma^2*[rho+(1-rho)/B]`, giả định cùng phương sai và cùng tương quan giữa mọi cặp. Lợi ích phụ thuộc tương quan và thiên lệch; không bảo đảm accuracy tăng.
- Cây hồi quy với squared_error: lá trả trung bình nhãn train; tạp chất là trung bình bình phương sai lệch khỏi trung bình lá. Đầu ra hằng trong từng lá.
- Nguồn được slide nhắc: Olist/Kaggle; `tree_lab.py`, `case_audit.json`, CSV ứng viên; CART và scikit-learn 1.6.1. Chưa đọc các nguồn này trong tác vụ hiện tại.

## Nguyên tắc dùng lại

Khi hỗ trợ bài tập tiếp theo, bám các khái niệm, công thức, cách tính trọng số và quy trình đánh giá ở trên. Phân biệt dữ liệu mô phỏng với Olist thật; phân biệt gain cục bộ với đóng góp toàn tập, điểm lá với ngưỡng hành động, khả năng giải thích với nhân quả. Không áp nguyên các con số/cấu hình Olist cho bài phân loại hạt nho khô nếu chưa có căn cứ từ dữ liệu và yêu cầu bài tập.
