# Hệ Thống Tracking Thời Gian Chấm Bài - Tóm Tắt Chức Năng

## 1. Tổng Quan Hệ Thống

**Mục đích**: Đo lường thời gian thực tế mà giáo viên dành để chấm bài trên Google Docs, phục vụ phân tích hiệu suất và tối ưu quy trình chấm bài.

**Công nghệ**: 
- Frontend: HTML/CSS/JavaScript (GitHub Pages - miễn phí hosting)
- Backend: n8n workflow automation (serverless)
- Database: Google Sheets (dễ xem, xuất báo cáo)

---

## 2. Chức Năng Chính

### A. Tracking Tự Động
✅ **Tự động theo dõi thời gian** khi giáo viên mở link chấm bài  
✅ **Phân biệt thời gian active/inactive** (chỉ tính khi thực sự làm việc)  
✅ **Hỗ trợ reload page** - không mất dữ liệu, thời gian tiếp tục tích lũy  
✅ **Heartbeat mỗi 5 giây** - cập nhật trạng thái real-time  

**Cách phát hiện active:**
- Di chuyển chuột, gõ phím, click, scroll
- Focus vào tab/window
- Click vào Google Doc để đọc/chấm

### B. Giao Diện Người Dùng (FAB Button)

**Nút tròn góc phải màn hình** với 2 tùy chọn khi hover:

1. **Nút "Hoàn Thành"** (màu xanh ✓)
   - Kết thúc phiên chấm bài
   - Gọi API lưu kết quả
   - Không thể click lại (disabled vĩnh viễn)
   - Giữ trạng thái sau reload

2. **Nút "Báo Lỗi"** (màu đỏ ⚠)
   - Mở form nhập mô tả lỗi
   - Lưu báo cáo để xử lý
   - Hỗ trợ feedback từ người dùng

### C. Kết Thúc Phiên Tự Động

✅ **2 cách kết thúc phiên:**
1. **Thủ công**: Click nút "Hoàn Thành"
2. **Tự động**: Khi cập nhật trạng thái "Đã chữa" trên Google Sheets

✅ **Lợi ích**: Đồng bộ giữa workflow chấm bài và tracking, giáo viên không cần nhớ đóng trang

---

## 3. Workflow Hoạt Động

```
[1] Giáo viên mở link tracking
     ↓
[2] Hệ thống tạo session (hoặc resume nếu đã có)
     ↓
[3] Iframe hiển thị Google Doc
     ↓
[4] Heartbeat tự động mỗi 5s
     - Gửi trạng thái active/inactive
     - Backend tích lũy thời gian active
     ↓
[5] Giáo viên chấm bài (reload thoải mái)
     ↓
[6] Kết thúc bằng 1 trong 2 cách:
     A. Click nút "Hoàn Thành"
     B. Cập nhật status "Đã chữa" trên sheet
     ↓
[7] Hệ thống tính toán metrics:
     - Tổng thời gian làm việc (active time)
     - Tỷ lệ active/total (%)
     - Phút active (rounded)
     ↓
[8] Lưu kết quả vào Google Sheets
```

---

## 4. Dữ Liệu Thu Thập

**Mỗi phiên chấm bài ghi lại:**
- Tên giáo viên
- Link Google Doc
- Thời gian bắt đầu
- Thời gian kết thúc
- **Thời gian active** (phút) ⭐
- Tỷ lệ active/total (%)
- Lý do kết thúc (hoàn thành/timeout/lỗi)

**Xuất báo cáo:**
- Google Sheets (xem trực tiếp, filter, sort)
- Looker Studio (dashboard trực quan)
- Export CSV/Excel

---

## 5. Tính Năng Bảo Mật & Chống Gian Lận

✅ Session signing (HMAC) - ngăn tạo session giả  
✅ Single-use session - không cho gửi /end nhiều lần  
✅ Server-side calculation - không tin client về thời gian  
✅ Sanity checks - reject duration > 12h  
✅ HTTPS everywhere  

---

## 6. Phạm Vi Triển Khai (Scope)

### Phase 1: Core Features (Ưu tiên cao)
- [x] Tracking tự động với heartbeat
- [x] Phát hiện active/inactive chính xác
- [x] FAB button với nút Hoàn Thành
- [x] FAB button với nút Báo Lỗi
- [x] Session persistence (hỗ trợ reload)
- [x] API endpoints: /start, /heartbeat, /end
- [x] Lưu dữ liệu vào Google Sheets
- [x] Tự động kết thúc khi status "Đã chữa"

### Phase 2: Enhancements (Tuỳ chọn)
- [ ] Dashboard Looker Studio
- [ ] Email notification khi hoàn thành
- [ ] Export report tự động (hàng tuần)
- [ ] Analytics dashboard cho admin
- [ ] Gửi error reports lên backend
- [ ] Toast notifications thay alert()
- [ ] Mobile responsive optimization

---

## 7. Timeline Ước Tính

| Công việc | Thời gian |
|-----------|-----------|
| Setup infrastructure (GitHub Pages + n8n) | 0.5 ngày |
| Frontend development (tracking page + FAB) | 1.5 ngày |
| Backend workflows (4 endpoints) | 1 ngày |
| Google Sheets integration | 0.5 ngày |
| Testing & bug fixes | 1 ngày |
| Documentation & handover | 0.5 ngày |
| **TOTAL Phase 1** | **5 ngày** |

*Phase 2 (nếu có): +2-3 ngày tuỳ features*

---

## 8. Chi Phí Ước Tính

### Phí phát triển:
- **Phase 1 (Core)**: 5 ngày × [rate] = **[total]**
- **Phase 2 (Optional)**: Báo giá riêng theo features chọn

### Chi phí vận hành (hàng tháng):
- GitHub Pages: **$0** (miễn phí)
- n8n: **$0** (self-hosted) hoặc **$20/tháng** (cloud)
- Google Sheets: **$0** (miễn phí)
- Domain (tuỳ chọn): **~$12/năm**

**Tổng chi phí vận hành**: **$0-20/tháng**

---

## 9. Lợi Ích Cho Khách Hàng

✅ **Minh bạch**: Biết chính xác thời gian thực tế chấm bài  
✅ **Tối ưu quy trình**: Phát hiện bottleneck, cải thiện hiệu suất  
✅ **Công bằng**: Đánh giá workload dựa trên dữ liệu thực  
✅ **Chi phí thấp**: Không cần server, infrastructure tối thiểu  
✅ **Dễ sử dụng**: Giao diện đơn giản, không cần training  
✅ **Linh hoạt**: Dễ mở rộng, tích hợp với hệ thống khác  

---

## 10. Rủi Ro & Mitigation

| Rủi Ro | Giải pháp |
|--------|-----------|
| User quên đóng tracking page | Tự động kết thúc khi status "Đã chữa" |
| Network issue mất heartbeat | Backend xử lý gaps, tính toán dựa trên dữ liệu có |
| Cross-origin không track typing | Focus vào iframe interaction, đủ accurate |
| User manipulation | Session signing + server-side validation |

---

## 11. Deliverables

✅ Source code (GitHub repository)  
✅ n8n workflow templates (import ready)  
✅ Google Sheets template  
✅ Documentation (setup + user guide)  
✅ Testing checklist  
✅ 1 tháng support & bug fixes  

---

## 12. Next Steps

1. **Review scope** - Confirm Phase 1 features
2. **Finalize quotation** - Based on timeline
3. **Kickoff meeting** - Requirements clarification
4. **Development** - 5 ngày
5. **UAT** - Testing với real users
6. **Go-live** - Production deployment

---

**Contact:**  
Để thảo luận chi tiết scope và báo giá, vui lòng liên hệ:  
📧 [your-email]  
📱 [your-phone]  

**Prepared by:** [Your Name]  
**Date:** 31/10/2025  
**Version:** 1.0
