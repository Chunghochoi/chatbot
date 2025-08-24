// config.js - Cấu hình ứng dụng
const CONFIG = {
    // API Keys mặc định
    DEFAULT_API_KEYS: {
        gemini: 'AIzaSyDtovOnKqGNYdamLaVDlp3UYDSFfnD2fbk',
        openai: '', // Để trống nếu chưa có
        claude: ''  // Để trống nếu chưa có
    },

    // Cài đặt API endpoints
    API_ENDPOINTS: {
        gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        openai: 'https://api.openai.com/v1/chat/completions',
        claude: 'https://api.anthropic.com/v1/messages'
    },

    // Cài đặt mặc định
    DEFAULT_SETTINGS: {
        aiProvider: 'gemini',
        personality: 'Bạn là một trợ lý thông minh, thân thiện và hữu ích. Bạn trả lời bằng tiếng Việt một cách tự nhiên và gần gũi.',
        temperature: 0.7,
        maxTokens: 1024,
        saveHistory: true,
        autoScroll: true,
        theme: 'light'
    },

    // Giới hạn
    LIMITS: {
        maxHistoryItems: 50,
        maxMessageLength: 4000,
        maxContextMessages: 10
    },

    // Cấu hình generation cho từng provider
    GENERATION_CONFIG: {
        gemini: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
        },
        openai: {
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.95
        },
        claude: {
            temperature: 0.7,
            max_tokens: 1024
        }
    },

    // Safety settings cho Gemini
    SAFETY_SETTINGS: [
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
    ]
};

// Export cho sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}