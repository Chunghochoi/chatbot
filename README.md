# 🤖 Gemini Chatbot Advanced 2.0

> **Trợ lý AI thông minh với công nghệ Gemini 2.0 Flash mới nhất**

Chatbot AI tiên tiến với real-time streaming, multimodal AI, và offline support. Được xây dựng với Express.js, vanilla JavaScript, và tích hợp Google Gemini 2.0 Flash API.

## ✨ Tính năng nổi bật

### 🚀 **Công nghệ AI tiên tiến**
- **Gemini 2.0 Flash** - Model AI mới nhất từ Google
- **Real-time Streaming** - Phản hồi theo thời gian thực
- **Context Window mở rộng** - Lên đến 32,000 tokens
- **Multimodal AI** - Xử lý text, image, và files

### 💡 **Trải nghiệm người dùng**
- **Giao diện hiện đại** với glassmorphism design
- **Dark/Light theme** với chuyển đổi mượt mà  
- **Responsive design** tối ưu cho mọi thiết bị
- **PWA support** - Cài đặt như ứng dụng native

### 🔧 **Tính năng kỹ thuật**
- **Offline support** với Service Worker
- **File upload & preview** - Hỗ trợ nhiều định dạng
- **Chat history** với export/import
- **Security** - Helmet, CORS, Rate limiting
- **Performance** - Compression, caching

## 🛠️ Cài đặt & Chạy

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- NPM >= 9.0.0
- Gemini API Key (miễn phí tại [Google AI Studio](https://makersuite.google.com/))

### Bước 1: Clone dự án
```bash
git clone https://github.com/yourusername/gemini-chatbot-advanced.git
cd gemini-chatbot-advanced
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PERSONA_PASSWORD=your_secure_password
SESSION_SECRET=your_session_secret_key
PORT=3000
NODE_ENV=development
```

### Bước 4: Chạy ứng dụng

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

Truy cập: `http://localhost:3000`

## 🏗️ Cấu trúc dự án

```
gemini-chatbot-advanced/
├── public/                 # Static files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Enhanced styles
│   ├── api-manager.js     # API management
│   ├── config.js          # Configuration
│   └── sw.js             # Service worker
├── server.js             # Enhanced Express server
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md            # Documentation
```

## 🔑 Lấy Gemini API Key

1. Truy cập [Google AI Studio](https://makersuite.google.com/)
2. Đăng nhập với tài khoản Google
3. Nhấn "Get API key" và tạo key mới
4. Sao chép API key vào file `.env`

## 🎯 Cách sử dụng

### Truy cập Bot Riêng tư
1. Nhập mật khẩu (mặc định: `12345`)
2. Truy cập tính năng đầy đủ với Gemini 2.0 Flash

### Sử dụng như khách
- Truy cập nhanh không cần mật khẩu
- Tính năng cơ bản với Gemini model

### Upload & Phân tích File
- **Kéo thả file** vào chat
- **Nhấn icon đính kèm** để chọn file
- Hỗ trợ: `.txt`, `.pdf`, `.doc`, `.js`, `.py`, `.json`, `.md`
- **Phân tích ảnh**: `.jpg`, `.png`, `.gif`, `.webp`

### Quản lý Chat History
- **Tự động lưu** cuộc trò chuyện
- **Export** định dạng JSON/TXT
- **Xóa** từng chat riêng lẻ
- **Tìm kiếm** trong lịch sử

## ⚙️ API Endpoints

### Authentication
```http
POST /api/auth
Content-Type: application/json

{
  "password": "your_password"
}
```

### File Upload
```http
POST /api/upload
Content-Type: multipart/form-data

files: [File1, File2, ...]
```

### Chat History
```http
GET /api/chats              # Get all chats
POST /api/chats             # Save chat
DELETE /api/chats/:id       # Delete chat
GET /api/export/:format     # Export (json/txt)
```

### System Info
```http
GET /api/health             # Health check
GET /api/system             # System information
```

## 🔧 Tùy chỉnh & Mở rộng

### Thay đổi Model AI
```javascript
// config.js
const CONFIG = {
    MODEL: "gemini-pro",              // Standard model
    MODEL: "gemini-2.0-flash-exp",    // Latest experimental
    MODEL: "gemini-pro-vision"        // Vision model
};
```

### Tùy chỉnh Generation Config
```javascript
GENERATION_CONFIG: {
    temperature: 0.7,        // Độ sáng tạo (0-1)
    topK: 40,               // Số lượng tokens xem xét
    topP: 0.95,             // Ngưỡng xác suất tích lũy
    maxOutputTokens: 8192   // Độ dài tối đa
}
```

### Thêm Custom Functions
```javascript
// api-manager.js
const customFunctions = [
    {
        name: "get_weather",
        description: "Get current weather",
        parameters: {
            type: "object",
            properties: {
                location: { type: "string" }
            }
        }
    }
];
```

## 🛡️ Bảo mật

### Built-in Security Features
- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection  
- **Rate limiting** - Chống spam
- **Input validation** - Sanitize user input
- **Session management** - Secure cookies

### Best Practices
- Thay đổi `SESSION_SECRET` trong production
- Sử dụng HTTPS trong production
- Cập nhật dependencies thường xuyên
- Monitor API usage và costs

## 🚀 Deploy lên Production

### Environment Variables cần thiết:
```env
NODE_ENV=production
GEMINI_API_KEY=your_production_api_key
SESSION_SECRET=your_strong_secret_key
ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Deployment:
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Heroku Deployment:
```bash
# Install Heroku CLI
npm install -g heroku

# Login và tạo app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## 📊 Monitoring & Analytics

### Logging
- **Winston** cho structured logging
- **Morgan** cho HTTP request logging
- Log files tại `logs/app.log`

### Performance Monitoring
```javascript
// Enable in production
const CONFIG = {
    ENABLE_PERFORMANCE_MONITORING: true,
    SENTRY_DSN: "your_sentry_dsn_here"
};
```

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)  
5. Mở Pull Request

## 📝 Changelog

### Version 2.0.0
- ✨ Upgrade to Gemini 2.0 Flash
- ✨ Real-time streaming responses
- ✨ Enhanced multimodal support
- ✨ Offline PWA capabilities
- ✨ Advanced file handling
- ✨ Improved security & performance

### Version 1.0.0
- 🎉 Initial release
- 🤖 Basic Gemini integration
- 💬 Simple chat interface
- 📁 File upload support

## ❓ FAQ

**Q: Tại sao cần API key?**
A: Gemini API key miễn phí với quota hợp lý cho testing và development.

**Q: Chi phí sử dụng?**
A: Gemini API có tier miễn phí và pricing rất cạnh tranh. Xem chi tiết tại [Google AI Pricing](https://ai.google.dev/pricing).

**Q: Có thể tự host không?**
A: Có, dự án hoàn toàn open source và có thể deploy trên VPS/cloud của bạn.

**Q: Hỗ trợ Vietnamese không?**
A: Có, Gemini hỗ trợ tiếng Việt rất tốt và giao diện đã được localize.

## 📞 Hỗ trợ

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/yourusername/gemini-chatbot-advanced/issues)
- 💡 **Feature requests**: [GitHub Discussions](https://github.com/yourusername/gemini-chatbot-advanced/discussions)
- 📧 **Email**: your.email@example.com
- 💬 **Discord**: Your Discord Server

## 📄 License

Dự án được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 🙏 Acknowledgments

- **Google AI Team** - Gemini API
- **Express.js Community** - Backend framework
- **Font Awesome** - Icons
- **Highlight.js** - Syntax highlighting
- **Marked.js** - Markdown parsing

---

⭐ **Nếu dự án hữu ích, đừng quên star repo nhé!** ⭐

Made with ❤️ by [Chungdeptrai]