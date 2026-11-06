# Thần Số Học Phương Đông (PWA)

Ứng dụng web cài được (PWA), chạy hoàn toàn trên thiết bị và dùng được ngoại tuyến:

- **Tra cứu & diễn giải** SĐT, CCCD 12 số, dãy số bất kỳ theo 8 từ trường Bát tinh (Sinh khí, Thiên y, Diên niên, Phục vị, Họa hại, Tuyệt mệnh, Ngũ quỷ, Lục sát).
- **Đề xuất SĐT 10 số** theo nhà mạng (Viettel, VinaPhone, MobiFone, Vietnamobile, Gmobile, iTel, Wintel), theo mục tiêu, giới tính, đuôi mong muốn và có thể cá nhân hóa theo CCCD.
- **Kiến thức**: bảng cặp số, quy tắc 0/5, hóa giải, 64 tổ hợp hai sao.

Nội dung dựa trên giáo trình "Thần Số Học Phương Đông". Đây là văn hóa/tín ngưỡng, **không có cơ sở khoa học**; số đề xuất do ứng dụng tạo theo quy tắc, **chưa kiểm tra còn hàng** tại nhà mạng.

## Chạy
```
npm start        # http://localhost:8080  (cần phục vụ qua HTTP để service worker hoạt động)
npm test         # kiểm thử bộ máy phân tích và bộ sinh số
```
Triển khai: đẩy nguyên thư mục lên bất kỳ hosting tĩnh HTTPS nào (GitHub Pages, Netlify…). Mọi đường dẫn đều tương đối nên chạy được trong thư mục con.

## Cấu trúc
- `js/data.js` – dữ liệu từ giáo trình (sao, cặp số, tổ hợp, hóa giải)
- `js/engine.js` – ghép cặp, xử lý 0/5, chấm điểm, CCCD, tương hợp
- `js/generator.js` – sinh số theo nhà mạng
- `js/carriers.js` – bảng đầu số (sửa tại đây khi quy hoạch đổi)
- `sw.js`, `manifest.webmanifest`, `icons/` – PWA. Đổi `VERSION` trong `sw.js` khi phát hành bản mới.

## Quy ước tính điểm
Điểm 0–100 là quy ước của ứng dụng (giáo trình không có thang điểm): cát tinh cộng, hung tinh trừ theo cấp và vị trí (hai cặp cuối nặng nhất), thưởng khi hung tinh có hóa thần, phạt khi đuôi 0/5, nhiều số 0, thiếu Sinh khí/Thiên y, hoặc toàn cát tinh.
