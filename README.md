# Khóa Luận Tốt Nghiệp Frontend (KLTNFE)

**Phát triển bởi:** Nguyễn Tuấn Anh

Đây là dự án Frontend dành cho nền tảng **AskHealth** - một ứng dụng RAG Chatbot (Retrieval-Augmented Generation) y tế
Hệ thống hoạt động theo mô hình client-server:
- **Backend (Linux Server):** Chứa mô hình AI và cơ sở dữ liệu tài liệu y tế để Chatbot "học" và truy xuất thông tin (RAG).
- **Frontend (Dự án này):** Đảm nhiệm giao diện tương tác, tiếp nhận câu hỏi từ người dùng và giao tiếp với Backend thông qua API để hiển thị kết quả.


## 🚀 Hướng dẫn cài đặt và khởi chạy

Dự án sử dụng [Vite](https://vitejs.dev/) để khởi chạy môi trường phát triển (development server) cục bộ nhanh chóng với tính năng Hot-Reload.

### Bước 1: Cài đặt Dependencies (Thư viện)
Mở Terminal tại thư mục gốc của dự án (`KLTNFE`) và chạy:
```bash
npm install
```

### Bước 2: Khởi động Server
Để xem giao diện và phát triển, hãy chạy lệnh sau:
```bash
npm run dev
```
Sau khi lệnh chạy thành công, bạn hãy truy cập trình duyệt tại địa chỉ: `http://localhost:3000`

### Các câu lệnh thao tác khác
- **Đóng gói dự án lên Production (Build):**
  ```bash
  npm run build
  ```
- **Xem trước file đã build (Preview):**
  ```bash
  npm run preview
  ```
- **Chạy chế độ Debug:**
  ```bash
  npm run debug
  ```

---
*Dự án hướng đến việc nâng cao trải nghiệm người dùng trong hệ sinh thái y tế thông minh.*
