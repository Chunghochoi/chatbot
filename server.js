const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieSession = require("cookie-session");
const multer = require("multer");
const fs = require("fs").promises;
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    }
}));

// Compression middleware
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// CORS configuration
app.use(cors({
    origin: NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000, // requests per window
    message: {
        error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for static files
        return req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/);
    }
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(cookieSession({
    name: 'gemini-session',
    keys: [process.env.SESSION_SECRET || 'your-secret-key-change-in-production'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
}));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|txt|pdf|doc|docx|json|js|py|html|css|md/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Static file serving with caching headers
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: NODE_ENV === 'production' ? '1d' : '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: NODE_ENV
    });
});

// Authentication endpoint
app.post('/api/auth', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }
        
        // Simple password check (in production, use proper hashing)
        const isValid = password === process.env.PERSONA_PASSWORD;
        
        if (isValid) {
            req.session.authenticated = true;
            req.session.authTime = Date.now();
            
            res.json({
                success: true,
                message: 'Authentication successful'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        
        const processedFiles = [];
        
        for (const file of req.files) {
            // Process file based on type
            const fileData = {
                name: file.originalname,
                size: file.size,
                type: file.mimetype.startsWith('image/') ? 'image' : 'file',
                data: file.mimetype.startsWith('image/') 
                    ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
                    : file.buffer.toString('utf-8'),
                uploadTime: new Date().toISOString()
            };
            
            processedFiles.push(fileData);
        }
        
        res.json({
            success: true,
            files: processedFiles,
            count: processedFiles.length
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: error.message
        });
    }
});

// Chat history endpoints
app.get('/api/chats', (req, res) => {
    // In production, this would fetch from a database
    res.json({
        success: true,
        chats: req.session.chats || []
    });
});

app.post('/api/chats', (req, res) => {
    try {
        const { chatData } = req.body;
        
        if (!chatData) {
            return res.status(400).json({
                success: false,
                message: 'Chat data is required'
            });
        }
        
        // Store in session (in production, use a database)
        if (!req.session.chats) {
            req.session.chats = [];
        }
        
        req.session.chats.unshift(chatData);
        
        // Keep only last 50 chats
        if (req.session.chats.length > 50) {
            req.session.chats = req.session.chats.slice(0, 50);
        }
        
        res.json({
            success: true,
            message: 'Chat saved successfully'
        });
        
    } catch (error) {
        console.error('Chat save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save chat'
        });
    }
});

// Delete chat endpoint
app.delete('/api/chats/:chatId', (req, res) => {
    try {
        const { chatId } = req.params;
        
        if (req.session.chats) {
            req.session.chats = req.session.chats.filter(chat => chat.id !== chatId);
        }
        
        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });
        
    } catch (error) {
        console.error('Chat delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete chat'
        });
    }
});

// Export chat history
app.get('/api/export/:format', (req, res) => {
    try {
        const { format } = req.params;
        const chats = req.session.chats || [];
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="chat-history.json"');
            res.json(chats);
        } else if (format === 'txt') {
            const txtContent = chats.map(chat => 
                `=== ${chat.title} (${chat.timestamp}) ===\n` +
                chat.messages.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n') +
                '\n\n'
            ).join('');
            
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', 'attachment; filename="chat-history.txt"');
            res.send(txtContent);
        } else {
            res.status(400).json({
                success: false,
                message: 'Unsupported format'
            });
        }
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Export failed'
        });
    }
});

// System info endpoint
app.get('/api/system', (req, res) => {
    res.json({
        version: '2.0.0',
        model: 'gemini-2.0-flash-exp',
        features: [
            'real-time-streaming',
            'multimodal-ai',
            'function-calling',
            'advanced-context',
            'offline-support',
            'file-upload',
            'chat-history',
            'export-import'
        ],
        limits: {
            maxFileSize: '10MB',
            maxFiles: 10,
            contextWindow: 32000,
            maxChatHistory: 50
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: 'File too large'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(413).json({
                success: false,
                message: 'Too many files'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
});

// 404 handler
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    } else {
        // Serve index.html for all non-API routes (SPA routing)
        res.sendFile(path.join(__dirname, "public", "index.html"));
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Gemini Chatbot Server running at http://localhost:${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`⚡ Features: Streaming, File Upload, Chat History, Offline Support`);
    console.log(`🔒 Security: Helmet, CORS, Rate Limiting`);
    
    if (NODE_ENV === 'development') {
        console.log(`🔗 Direct access: http://localhost:${PORT}`);
        console.log(`📝 API Health: http://localhost:${PORT}/api/health`);
    }
});

// Handle server errors
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    
    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
    
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

module.exports = app;