# Đề Xuất: Hệ Thống Theo Dõi Thời Gian Chấm Bài

---

## 📋 Tổng Quan Giải Pháp

### Mục Tiêu
Xây dựng hệ thống theo dõi **thời gian thực tế** mà giáo viên/người chấm dành để chấm một bài tập trên Google Docs, giúp:
- ✅ Đo lường hiệu suất chấm bài chính xác
- ✅ Phân tích năng suất làm việc
- ✅ Công bằng trong đánh giá và phân công khối lượng công việc
- ✅ Có dữ liệu để cải thiện quy trình

### Cách Hoạt Động Đơn Giản

```
┌─────────────────────────────────────────────────────────────┐
│  1. Người chấm nhận link tracking                           │
│     👉 https://tracking.example.com/?name=Thai&doc=...      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Trang web hiển thị Google Doc trong iframe             │
│     ⏱️  Tự động bắt đầu đếm thời gian khi có hoạt động     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Hệ thống theo dõi thời gian ACTIVE                      │
│     ✓ Chỉ đếm khi người dùng thực sự làm việc             │
│     ✓ Không đếm khi chuyển tab hoặc để máy                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Kết thúc session và lưu dữ liệu
│     • Cập nhật status "Đã chữa" trên Google Sheet          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tính Năng Chính

### 1. **Theo Dõi Thời Gian Chính Xác**
- Chỉ đếm thời gian khi người dùng **thực sự hoạt động**
- Phát hiện: di chuột, gõ phím, scroll, click, focus vào document
- Không đếm thời gian khi chuyển tab, rời khỏi màn hình hoặc không hoạt động

### 2. **Hỗ Trợ Reload Trang**
- Người chấm có thể reload/refresh trang bất cứ lúc nào
- Session **không bị mất**, thời gian tiếp tục tích lũy
- Thoải mái làm việc mà không lo mất dữ liệu

### 3. **Kết Thúc Tự Động**
- **Cách 1**: Người dùng nhấn nút "Finish" trên trang
- **Cách 2**: Tự động kết thúc khi cập nhật status "Đã chữa" trên Google Sheet
- Linh hoạt, không bắt buộc phải đóng trang thủ công

### 4. **Dashboard & Báo Cáo**
- Lưu trữ dữ liệu trên Google Sheets (dễ truy cập, dễ phân tích)
- Các metrics quan trọng:
  - ⏱️ Thời gian active (phút)
  - 📊 Tỷ lệ active/total time (%)
  - 📅 Thời gian bắt đầu/kết thúc
  - 👤 Tên người chấm, link document

### 5. **Bảo Mật & Chống Gian Lận**
- Session ID có chữ ký HMAC (không thể giả mạo)
- Server tự tính thời gian (không tin client)
- Session chỉ dùng 1 lần (không thể submit nhiều lần)
- Giới hạn tối đa 12 giờ (sanity check)
- Hỗ trợ HTTPS toàn bộ

### 6. **Dễ Sử Dụng**
- Không cần cài đặt, đăng nhập, hay phần mềm
- Chỉ cần click vào link → bắt đầu làm việc
- Giao diện đơn giản, không gây phiền nhiễu
- Hoạt động trên mọi trình duyệt hiện đại

---

## 🏗️ Kiến Trúc Hệ Thống

### Thành Phần Chính

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (GitHub Pages)                    │
│  • Tracking page với custom domain                           │
│  • Hiển thị Google Doc trong iframe                          │
│  • Detect hoạt động người dùng                               │
│  • Gửi heartbeat mỗi 5 giây                                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS API Calls
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (n8n Workflows)                    │
│  • Workflow 1: /start (tạo session)                          │
│  • Workflow 2: /heartbeat (cập nhật thời gian)              │
│  • Workflow 3: /end (kết thúc & tính toán)                  │
│  • Workflow 4: Status Monitor (tự động kết thúc)            │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Read/Write
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    STORAGE (Google Sheets)                    │
│  • Sheet "Sessions": tracking sessions đang chạy            │
│  • Sheet "Completed": kết quả cuối cùng                     │
│  • Sheet "Bài Chấm": quản lý danh sách bài cần chấm        │
└──────────────────────────────────────────────────────────────┘
```

### Công Nghệ Sử Dụng

| Thành Phần | Công Nghệ | Lý Do |
|------------|-----------|-------|
| **Frontend** | HTML/CSS/JavaScript | Đơn giản, không cần build process |
| **Hosting** | GitHub Pages + Custom Domain | Miễn phí, reliable, HTTPS tự động |
| **Backend** | n8n Workflows (Webhooks) | Serverless, visual workflow, dễ maintain |
| **Storage** | Google Sheets | Dễ truy cập, không cần setup database |
| **Security** | HMAC signing, Session validation | Chống gian lận cơ bản |

---

## 📅 Timeline & Deliverables

### Thời Gian Thực Hiện: **~5 Ngày Làm Việc**

| Ngày | Công Việc | Chi Tiết |
|------|-----------|----------|
| **Ngày 1-2** | **Setup & Core Features** | • Setup GitHub Pages + Custom domain<br>• Tạo tracking page cơ bản<br>• Implement 3 workflows chính (start/heartbeat/end)<br>• Setup Google Sheets storage |
| **Ngày 3-4** | **Advanced Features & Security** | • Implement Status Monitor workflow<br>• Activity detection (mouse, keyboard, focus)<br>• Session signing với HMAC<br>• Validation & error handling<br>• Testing các edge cases |
| **Ngày 5** | **Polish & Handover** | • UI improvements & finish button<br>• Google Sheets dashboard/reports<br>• Documentation<br>• Final testing & bug fixes<br>• Handover & demo |

### Estimate Chi Tiết

```
Tổng thời gian: 35 giờ
Phân bổ:
  • Frontend development: 10 giờ
  • n8n workflows (4 workflows): 12 giờ
  • Security & validation: 6 giờ
  • Testing & bug fixes: 4 giờ
  • Documentation & handover: 3 giờ
```

---

## 📦 Sản Phẩm Bàn Giao

### ✅ Deliverables

1. **Tracking System Hoàn Chỉnh**
   - Tracking page với custom domain (e.g., `tracking.example.com`)
   - Responsive design, hoạt động trên mobile/desktop
   - Favicon và branding

2. **Backend Workflows**
   - 4 n8n workflows đã import và test
   - Webhook endpoints đã configure
   - Session management logic

3. **Google Sheets Dashboard**
   - Sheet "Sessions" để theo dõi realtime
   - Sheet "Completed" với metrics đầy đủ
   - Sample data và pivot tables

4. **Documentation**
   - Hướng dẫn sử dụng cho người chấm bài
   - Technical documentation cho admin
   - Troubleshooting guide

5. **Source Code**
   - GitHub repository với full source code
   - README với setup instructions
   - Comments trong code

---

## 🔧 Yêu Cầu Chuẩn Bị Từ Khách Hàng

### Cần Có Trước Khi Bắt Đầu:

1. **n8n Instance**
   - n8n Cloud account (recommended) HOẶC
   - Self-hosted n8n instance với public URL
   - Quyền tạo workflows và webhooks

2. **Google Account**
   - Để tạo và quản lý Google Sheets
   - Quyền chia sẻ sheets với n8n service account

3. **Domain Name**
   - Domain đã đăng ký (e.g., `example.com`)
   - Quyền truy cập DNS settings để thêm CNAME record

4. **Google Sheet "Bài Chấm"**
   - Sheet với cấu trúc:
     - Column: `sessionId` (sẽ được auto-fill)
     - Column: `Trạng Thái` (giá trị: "Đã chữa" để trigger auto-end)
     - Các columns khác theo nhu cầu

---

### Lưu Ý Chi Phí

- ✅ **Bao gồm**: Development, testing, documentation, source code
- ✅ **Bao gồm**: Custom domain setup và configuration
- ❌ **Không bao gồm**: Ongoing maintenance, hosting costs, training sessions
- ❌ **Không bao gồm**: Chi phí n8n Cloud subscription (nếu chọn Cloud)
- ❌ **Không bao gồm**: Domain registration fee

---

## 🎓 Hướng Dẫn Sử Dụng (Tóm Tắt)

### Cho Người Chấm Bài:

1. **Nhận link tracking** từ Google Sheet "Bài Chấm"
   - Link đã được tạo sẵn trong sheet
   - Chỉ cần click vào link để bắt đầu
   ```
   https://tracking.example.com/?name=YourName&doc=GoogleDocURL
   ```

2. **Click vào link** → trang web tự động mở với Google Doc bên trong

3. **Làm việc bình thường**:
   - Đọc, sửa, comment trên document
   - Có thể reload trang bất cứ lúc nào (session không mất)
   - Thời gian chỉ đếm khi bạn thực sự hoạt động

4. **Kết thúc**:   
   - **Option 1**: Cập nhật status "Đã chữa" trên Sheet → tự động kết thúc

### Cho Admin:

1. **Tạo tracking link** cho mỗi bài cần chấm
2. **Monitor realtime** trên Google Sheet "Sessions"
3. **Xem kết quả** trên Sheet "Completed" sau khi hoàn thành
4. **Phân tích dữ liệu** với pivot tables hoặc export sang tools khác

---

## 🔒 Bảo Mật & Privacy

### Các Biện Pháp Bảo Mật

- 🔐 **HTTPS everywhere**: Mọi connection đều mã hóa
- 🎫 **Session signing**: HMAC để chống giả mạo session
- ⏱️ **Server-side calculation**: Không tin client về thời gian
- 🚫 **Single-use sessions**: Mỗi session chỉ submit 1 lần
- 📊 **Sanity checks**: Giới hạn thời gian tối đa, detect anomalies
- 🔍 **Audit logs**: Lưu IP, UserAgent để phát hiện suspicious activities

## ⚡ Điểm Mạnh & Lợi Ích

### Lợi Ích Cho Tổ Chức

✅ **Đo lường hiệu suất chính xác**
- Biết được thời gian thực tế để chấm mỗi bài
- Dữ liệu để tối ưu quy trình chấm bài

✅ **Công bằng trong phân công**
- Phân bổ công việc dựa trên năng lực thực tế
- Tránh overload hoặc underutilize

✅ **Cải thiện quy trình**
- Phát hiện bottlenecks
- Identify các bài khó/dễ
- Training insights

✅ **Chi phí thấp**
- Không cần server riêng
- Sử dụng tools miễn phí/rẻ (GitHub Pages, Google Sheets)
- Dễ maintain, không cần DevOps chuyên sâu

### Điểm Mạnh Kỹ Thuật

✅ **Đơn giản & Reliable**
- Ít moving parts → ít bugs
- Proven technologies
- Easy to debug

✅ **Scalable**
- Có thể nâng cấp lên database khi cần
- Support hundreds of concurrent sessions

✅ **Maintainable**
- n8n visual workflows dễ hiểu, dễ sửa
- Clear code structure
- Well documented
