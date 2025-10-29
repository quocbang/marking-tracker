# Status Monitor Workflow (4-status-monitor-workflow.json)

## Mục đích
Workflow này tự động kết thúc tracking session khi trạng thái trên sheet "Bài Chấm" được cập nhật thành "Đã chữa".

## Cách hoạt động

### Flow Logic:
1. **Monitor Sheet "Bài Chấm"** (Google Sheets Trigger)
   - Poll mỗi 1 phút để kiểm tra thay đổi
   - Trigger khi có thay đổi trên sheet

2. **Check Status = "Đã chữa"**
   - Kiểm tra cột "Trạng Thái" có giá trị "Đã chữa"
   - Kiểm tra có `sessionId` trong row

3. **Lookup Session**
   - Tìm session tương ứng trong sheet "Sessions"
   - Dựa vào `sessionId`

4. **Check Session Not Used**
   - Kiểm tra `used = FALSE`
   - Đảm bảo session chưa được kết thúc

5. **Call End Endpoint**
   - Gọi HTTP POST đến `/end` với:
     - `sessionId`: ID của session
     - `reason`: "status_updated"
     - `ts`: timestamp hiện tại

## Yêu cầu Setup

### 1. Sheet "Bài Chấm" phải có các cột:
- `sessionId`: Khóa liên kết với sheet "Sessions"
- `Trạng Thái`: Cột chứa trạng thái chấm bài

### 2. Cấu hình Workflow:
- **Document ID**: ID của Google Sheets (mặc định: `1sGSFYOdX13Ja7VdJyd45cGNYVvBL24NgDEPNoLc6n5M`)
- **Sheet Name (gid)**: Cần cập nhật đúng gid của sheet "Bài Chấm"
- **Poll Interval**: Mặc định 1 phút, có thể thay đổi

### 3. Credentials:
- Cần Google Sheets OAuth2 credentials với quyền đọc sheet

## Import vào n8n

1. Copy nội dung file `4-status-monitor-workflow.json`
2. Trong n8n: **Workflows → Import from File → Paste JSON**
3. Cập nhật các thông tin:
   - Sheet "Bài Chấm" gid (node "Monitor Bài Chấm Sheet")
   - Credentials (nếu cần)
4. **Activate** workflow

## Testing

### Test Case 1: Status được update thành "Đã chữa"
1. Tạo session mới (gọi `/start`)
2. Thêm `sessionId` vào sheet "Bài Chấm"
3. Update cột "Trạng Thái" thành "Đã chữa"
4. Chờ tối đa 1 phút
5. Kiểm tra session trong sheet "Sessions" có `used = TRUE`

### Test Case 2: Session đã được used
1. Tạo session và kết thúc (gọi `/end`)
2. Update trạng thái thành "Đã chữa"
3. Workflow sẽ ignore vì session đã `used = TRUE`

### Test Case 3: Không có sessionId
1. Update trạng thái thành "Đã chữa" nhưng không có `sessionId`
2. Workflow sẽ ignore

## Monitoring

### Execution Logs:
- Check n8n execution history để xem workflow có chạy đúng
- Xem logs của node "Call End Endpoint" để xác nhận request thành công

### Troubleshooting:
- **Workflow không trigger**: Kiểm tra poll interval, sheet permissions
- **Session not found**: Kiểm tra `sessionId` có đúng, có tồn tại trong sheet "Sessions"
- **Session already used**: Session đã được kết thúc trước đó

## Edge Cases

### 1. User đóng tab + Update status cùng lúc:
- Nếu user nhấn "Finish" và admin update status gần như đồng thời
- Workflow sẽ check `used = FALSE`, nếu đã kết thúc sẽ ignore
- Đảm bảo không gọi `/end` 2 lần cho cùng session

### 2. Status được update nhiều lần:
- Workflow trigger mỗi lần có thay đổi
- Nhưng chỉ gọi `/end` nếu `used = FALSE`
- Sau lần đầu, session đã `used = TRUE` nên ignore các lần sau

### 3. Polling delay:
- Có thể có delay tối đa 1 phút giữa khi update status và khi `/end` được gọi
- Nếu cần realtime hơn, giảm poll interval (nhưng tốn tài nguyên hơn)

## Configuration Options

### Thay đổi Poll Interval:
Trong node "Monitor Bài Chấm Sheet", section `pollTimes`:
- `everyMinute`: Mỗi 1 phút (mặc định)
- `every5Minutes`: Mỗi 5 phút
- `every15Minutes`: Mỗi 15 phút
- Custom: Tự định nghĩa interval

### Thay đổi End Endpoint:
Trong node "Call End Endpoint", thay đổi `url` nếu backend khác:
```
https://n8n-mac.quocbangdev.asia/webhook/marking-log/end
```

## Integration với Workflows khác

Workflow này hoạt động độc lập nhưng phụ thuộc vào:
- **1-start-workflow.json**: Tạo session và `sessionId`
- **2-heartbeat-workflow.json**: Tracking thời gian hoạt động
- **3-end-workflow.json**: Xử lý kết thúc session

Khi workflow này gọi `/end`, nó sẽ trigger workflow 3-end-workflow để:
- Tính toán thời gian hoạt động cuối cùng
- Cập nhật sheet "Sessions"
- Lưu vào sheet "Completed"
