// config.js - File cấu hình riêng biệt
const CONFIG = {
    // API Configuration
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE",
    MODEL: "gemini-2.0-flash-exp", // Latest model
    
    // Security
    PERSONA_PASSWORD: process.env.PERSONA_PASSWORD || "your_secure_password",
    
    // File handling
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['.txt', '.pdf', '.doc', '.docx', '.json', '.js', '.py', '.html', '.css', '.md'],
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // Features
    STREAMING_ENABLED: true,
    CONTEXT_LIMIT: 32000,
    MAX_ATTACHMENTS: 10,
    
    // UI Settings
    THEME: 'dark',
    PARTICLE_COUNT: 75,
    ANIMATION_DURATION: 500,
    
    // Chat Settings
    MAX_CHAT_HISTORY: 50,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    
    // API Settings
    REQUEST_TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // Advanced AI Settings
    GENERATION_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        candidateCount: 1,
        stopSequences: []
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}