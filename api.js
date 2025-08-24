// api.js - Quản lý API calls

class APIManager {
    constructor() {
        this.currentProvider = 'gemini';
        this.apiKeys = { ...CONFIG.DEFAULT_API_KEYS };
        this.requestCount = 0;
        this.lastRequestTime = 0;
    }

    /**
     * Thiết lập API key cho provider
     */
    setApiKey(provider, key) {
        if (key && key.trim()) {
            this.apiKeys[provider] = key.trim();
        }
    }

    /**
     * Lấy API key cho provider hiện tại
     */
    getCurrentApiKey() {
        return this.apiKeys[this.currentProvider] || CONFIG.DEFAULT_API_KEYS[this.currentProvider];
    }

    /**
     * Thiết lập provider hiện tại
     */
    setProvider(provider) {
        if (CONFIG.API_ENDPOINTS[provider]) {
            this.currentProvider = provider;
        }
    }

    /**
     * Rate limiting check
     */
    checkRateLimit() {
        const now = Date.now();
        const timeDiff = now - this.lastRequestTime;
        
        // Giới hạn 1 request/giây
        if (timeDiff < 1000) {
            throw new Error('Vui lòng chờ một chút trước khi gửi tin nhắn tiếp theo');
        }
        
        this.lastRequestTime = now;
        this.requestCount++;
    }

    /**
     * Gửi tin nhắn tới Gemini API
     */
    async sendToGemini(message, context, settings) {
        const apiKey = this.getCurrentApiKey();
        if (!apiKey) {
            throw new Error('Không có API key cho Gemini');
        }

        const systemPrompt = settings.personality || CONFIG.DEFAULT_SETTINGS.personality;
        
        // Xây dựng context với lịch sử
        let fullMessage = `Hệ thống: ${systemPrompt}\n\n`;
        
        if (context && context.length > 0) {
            const recentContext = context.slice(-CONFIG.LIMITS.maxContextMessages);
            const contextText = recentContext.map(msg => 
                `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`
            ).join('\n');
            fullMessage += `Lịch sử hội thoại:\n${contextText}\n\n`;
        }
        
        fullMessage += `Người dùng: ${message}`;

        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: fullMessage }]
            }],
            generationConfig: {
                ...CONFIG.GENERATION_CONFIG.gemini,
                temperature: settings.temperature || 0.7,
                maxOutputTokens: settings.maxTokens || 1024
            },
            safetySettings: CONFIG.SAFETY_SETTINGS
        };

        const response = await fetch(
            `${CONFIG.API_ENDPOINTS.gemini}?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(this.getErrorMessage('gemini', response.status, errorData));
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Không nhận được phản hồi hợp lệ từ Gemini API');
        }
    }

    /**
     * Gửi tin nhắn tới OpenAI API
     */
    async sendToOpenAI(message, context, settings) {
        const apiKey = this.getCurrentApiKey();
        if (!apiKey) {
            throw new Error('Vui lòng cấu hình API key cho OpenAI');
        }

        const messages = [
            {
                role: "system",
                content: settings.personality || CONFIG.DEFAULT_SETTINGS.personality
            }
        ];

        // Thêm context
        if (context && context.length > 0) {
            const recentContext = context.slice(-CONFIG.LIMITS.maxContextMessages);
            recentContext.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        messages.push({
            role: "user",
            content: message
        });

        const requestBody = {
            model: "gpt-3.5-turbo",
            messages: messages,
            ...CONFIG.GENERATION_CONFIG.openai,
            temperature: settings.temperature || 0.7,
            max_tokens: settings.maxTokens || 1024
        };

        const response = await fetch(CONFIG.API_ENDPOINTS.openai, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(this.getErrorMessage('openai', response.status, errorData));
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Không nhận được phản hồi hợp lệ từ OpenAI API');
        }
    }

    /**
     * Gửi tin nhắn tới Claude API
     */
    async sendToClaude(message, context, settings) {
        const apiKey = this.getCurrentApiKey();
        if (!apiKey) {
            throw new Error('Vui lòng cấu hình API key cho Claude');
        }

        const messages = [];

        // Thêm context
        if (context && context.length > 0) {
            const recentContext = context.slice(-CONFIG.LIMITS.maxContextMessages);
            recentContext.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        messages.push({
            role: "user",
            content: message
        });

        const requestBody = {
            model: "claude-3-sonnet-20240229",
            max_tokens: settings.maxTokens || 1024,
            temperature: settings.temperature || 0.7,
            system: settings.personality || CONFIG.DEFAULT_SETTINGS.personality,
            messages: messages
        };

        const response = await fetch(CONFIG.API_ENDPOINTS.claude, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(this.getErrorMessage('claude', response.status, errorData));
        }

        const data = await response.json();
        
        if (data.content && data.content[0] && data.content[0].text) {
            return data.content[0].text;
        } else {
            throw new Error('Không nhận được phản hồi hợp lệ từ Claude API');
        }
    }

    /**
     * Gửi tin nhắn (router chính)
     */
    async sendMessage(message, context, settings) {
        try {
            this.checkRateLimit();
            
            switch (this.currentProvider) {
                case 'gemini':
                    return await this.sendToGemini(message, context, settings);
                case 'openai':
                    return await this.sendToOpenAI(message, context, settings);
                case 'claude':
                    return await this.sendToClaude(message, context, settings);
                default:
                    throw new Error('Provider không được hỗ trợ');
            }
        } catch (error) {
            console.error(`${this.currentProvider} API Error:`, error);
            throw error;
        }
    }

    /**
     * Lấy thông báo lỗi chi tiết
     */
    getErrorMessage(provider, status, errorData) {
        const commonErrors = {
            400: 'Yêu cầu không hợp lệ. Kiểm tra lại nội dung tin nhắn.',
            401: 'API key không hợp lệ hoặc đã hết hạn.',
            403: 'Không có quyền truy cập. Kiểm tra lại API key.',
            429: 'Đã vượt quá giới hạn request. Vui lòng thử lại sau.',
            500: 'Lỗi server. Vui lòng thử lại sau.',
            503: 'Dịch vụ tạm thời không khả dụng.'
        };

        let baseMessage = commonErrors[status] || `HTTP Error ${status}`;
        
        // Thêm thông tin chi tiết từng provider
        if (errorData.error) {
            if (provider === 'openai' && errorData.error.message) {
                baseMessage += ` (${errorData.error.message})`;
            } else if (provider === 'gemini' && errorData.error.message) {
                baseMessage += ` (${errorData.error.message})`;
            } else if (provider === 'claude' && errorData.error.message) {
                baseMessage += ` (${errorData.error.message})`;
            }
        }

        return baseMessage;
    }

    /**
     * Test API connection
     */
    async testConnection(provider = null) {
        const testProvider = provider || this.currentProvider;
        const originalProvider = this.currentProvider;
        
        try {
            if (provider) this.setProvider(provider);
            
            const response = await this.sendMessage(
                'Hello, this is a test message.', 
                [], 
                { personality: 'You are a helpful assistant. Reply briefly.' }
            );
            
            return { success: true, provider: testProvider, response: response.substring(0, 100) };
        } catch (error) {
            return { success: false, provider: testProvider, error: error.message };
        } finally {
            this.currentProvider = originalProvider;
        }
    }

    /**
     * Lấy thống kê sử dụng API
     */
    getStats() {
        return {
            currentProvider: this.currentProvider,
            requestCount: this.requestCount,
            hasValidKey: !!this.getCurrentApiKey(),
            availableProviders: Object.keys(CONFIG.API_ENDPOINTS)
        };
    }
}

// Khởi tạo API manager
const apiManager = new APIManager();