// Bảng trọng lượng cân xương (xưng cốt) theo phương pháp gắn với Viên Thiên Cương. Đơn vị: chỉ (10 chỉ = 1 lượng).
// Nguồn: 华易网 (m.k366.com/gj/chenggu.htm, cập nhật 27/10/2026). Đã đối chiếu 60/60 năm với bảng tham chiếu độc lập;
// tổng nhẹ nhất 2 lượng 1 chỉ và nặng nhất 7 lượng 1 chỉ khớp mô tả phương pháp (blog cennylee.blogspot.com).
// Lưu ý: không có sử liệu chứng minh phương pháp do Viên Thiên Cương sáng lập; đây là tục dân gian, chỉ để giải trí.

// Năm âm lịch theo can chi (60 năm, lặp theo chu kỳ).
export const YEAR_W = {"Giáp Tý": 12, "Bính Tý": 16, "Mậu Tý": 15, "Canh Tý": 7, "Nhâm Tý": 5, "Ất Sửu": 9, "Đinh Sửu": 8, "Kỷ Sửu": 7, "Tân Sửu": 7, "Quý Sửu": 7, "Bính Dần": 6, "Mậu Dần": 8, "Canh Dần": 9, "Nhâm Dần": 9, "Giáp Dần": 12, "Đinh Mão": 7, "Kỷ Mão": 19, "Tân Mão": 12, "Quý Mão": 12, "Ất Mão": 8, "Mậu Thìn": 12, "Canh Thìn": 12, "Nhâm Thìn": 10, "Giáp Thìn": 8, "Bính Thìn": 8, "Kỷ Tỵ": 5, "Tân Tỵ": 6, "Quý Tỵ": 7, "Ất Tỵ": 7, "Đinh Tỵ": 6, "Canh Ngọ": 9, "Nhâm Ngọ": 8, "Giáp Ngọ": 15, "Bính Ngọ": 13, "Mậu Ngọ": 19, "Tân Mùi": 8, "Quý Mùi": 7, "Ất Mùi": 6, "Đinh Mùi": 5, "Kỷ Mùi": 6, "Nhâm Thân": 7, "Giáp Thân": 5, "Bính Thân": 5, "Mậu Thân": 14, "Canh Thân": 8, "Quý Dậu": 8, "Ất Dậu": 15, "Đinh Dậu": 14, "Kỷ Dậu": 5, "Tân Dậu": 16, "Giáp Tuất": 15, "Bính Tuất": 6, "Mậu Tuất": 14, "Canh Tuất": 9, "Nhâm Tuất": 10, "Ất Hợi": 9, "Đinh Hợi": 16, "Kỷ Hợi": 9, "Tân Hợi": 17, "Quý Hợi": 6};

// Tháng âm lịch 1..12 (tháng nhuận tính như tháng cùng số).
export const MONTH_W = [6, 7, 18, 9, 5, 16, 9, 15, 18, 8, 9, 5];

// Ngày âm lịch 1..30.
export const DAY_W = [5, 10, 8, 15, 16, 15, 8, 16, 8, 16, 9, 17, 8, 17, 10, 8, 9, 18, 5, 15, 10, 9, 8, 9, 15, 18, 7, 8, 16, 6];

// Giờ sinh theo 12 chi, bắt đầu từ Tý (23:00–00:59).
export const HOUR_W = [16, 6, 7, 10, 9, 16, 10, 8, 8, 9, 6, 6];

export const CHI_NAMES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const CHI_HOURS = ["23:00–00:59", "01:00–02:59", "03:00–04:59", "05:00–06:59", "07:00–08:59", "09:00–10:59", "11:00–12:59", "13:00–14:59", "15:00–16:59", "17:00–18:59", "19:00–20:59", "21:00–22:59"];
