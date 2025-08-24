// api-manager.js - Advanced API management cho Gemini 2.0 Flash

class GeminiAPIManager {
    constructor(config) {
        this.config = config;
        this.requestQueue = [];
        this.isProcessing = false;
        this.retryCount = 0;
        this.abortController = null;
    }

    // Enhanced API call with retry mechanism
    async makeRequest(prompt, options = {}) {
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    ...this.config.GENERATION_CONFIG,
                    ...options.generationConfig
                },
                safetySettings: this.getSafetySettings(),
                ...options.requestBody
            })
        };

        // Add abort controller for cancellation
        if (options.abortController) {
            requestOptions.signal = options.abortController.signal;
        }

        return this.executeRequestWithRetry(requestOptions, options);
    }

    // Streaming request with enhanced error handling
    async makeStreamingRequest(prompt, onChunk, options = {}) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.MODEL}:streamGenerateContent?key=${this.config.GEMINI_API_KEY}`;
        
        try {
            this.abortController = new AbortController();
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream"
                },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        ...this.config.GENERATION_CONFIG,
                        ...options.generationConfig
                    },
                    safetySettings: this.getSafetySettings()
                }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return this.processStreamingResponse(response, onChunk, options);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return { success: false, aborted: true };
            }
            throw error;
        }
    }

    // Process streaming response
    async processStreamingResponse(response, onChunk, options = {}) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                                const chunk = data.candidates[0].content.parts[0].text;
                                fullResponse += chunk;
                                
                                // Call chunk handler
                                if (onChunk) {
                                    await onChunk(chunk, fullResponse);
                                }
                            }
                        } catch (parseError) {
                            console.warn('Error parsing chunk:', parseError);
                        }
                    }
                }
            }

            return {
                success: true,
                response: fullResponse,
                finishReason: 'STOP'
            };

        } catch (error) {
            console.error('Streaming error:', error);
            throw error;
        } finally {
            reader.releaseLock();
        }
    }

    // Execute request with retry logic
    async executeRequestWithRetry(requestOptions, options = {}) {
        const maxRetries = options.maxRetries || this.config.MAX_RETRIES;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.config.RETRY_DELAY * Math.pow(2, attempt - 1);
                    await this.sleep(delay);
                    console.log(`Retry attempt ${attempt} after ${delay}ms`);
                }

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.MODEL}:generateContent?key=${this.config.GEMINI_API_KEY}`;
                const response = await fetch(url, requestOptions);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(`API Error: ${data.error.message}`);
                }

                if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    throw new Error('Invalid response format');
                }

                return {
                    success: true,
                    response: data.candidates[0].content.parts[0].text,
                    usage: data.usageMetadata,
                    finishReason: data.candidates[0].finishReason
                };

            } catch (error) {
                lastError = error;
                
                if (error.name === 'AbortError' || error.message.includes('401')) {
                    // Don't retry for authentication errors or aborted requests
                    break;
                }

                if (attempt === maxRetries) {
                    console.error(`All ${maxRetries + 1} attempts failed:`, error);
                    break;
                }

                console.warn(`Attempt ${attempt + 1} failed:`, error.message);
            }
        }

        return {
            success: false,
            error: lastError?.message || 'Unknown error',
            originalError: lastError
        };
    }

    // Safety settings for content filtering
    getSafetySettings() {
        return [
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
        ];
    }

    // Process multimodal content (images, files)
    async processMultimodalContent(content, attachments = []) {
        const parts = [{ text: content }];

        for (const attachment of attachments) {
            if (attachment.type === 'image') {
                // Convert image to base64 format required by Gemini
                const base64Data = attachment.data.split(',')[1];
                const mimeType = attachment.data.split(';')[0].split(':')[1];
                
                parts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                });
            } else if (attachment.type === 'file') {
                // Include file content in text
                parts[0].text += `\n\n[File: ${attachment.name}]\n${attachment.data.substring(0, 3000)}`;
            }
        }

        return parts;
    }

    // Function calling support for advanced features
    async makeRequestWithFunctions(prompt, functions = [], options = {}) {
        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
            tools: functions.length > 0 ? [{ function_declarations: functions }] : undefined,
            generationConfig: {
                ...this.config.GENERATION_CONFIG,
                ...options.generationConfig
            }
        };

        return this.makeRequest(prompt, {
            ...options,
            requestBody: requestBody
        });
    }

    // Cancel current request
    cancelCurrentRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            return true;
        }
        return false;
    }

    // Utility sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Rate limiting
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - (this.lastRequestTime || 0);
        const minInterval = 1000; // 1 second between requests

        if (timeSinceLastRequest < minInterval) {
            await this.sleep(minInterval - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
    }

    // Health check
    async checkAPIHealth() {
        try {
            const result = await this.makeRequest("Hello", {
                generationConfig: { maxOutputTokens: 10 }
            });
            return result.success;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }
}

// Enhanced File Manager
class FileManager {
    constructor(config) {
        this.config = config;
        this.supportedTypes = new Set(config.ALLOWED_FILE_TYPES);
        this.supportedImageTypes = new Set(config.ALLOWED_IMAGE_TYPES);
    }

    // Validate file before processing
    validateFile(file) {
        const errors = [];

        // Check file size
        if (file.size > this.config.MAX_FILE_SIZE) {
            errors.push(`File too large. Maximum size: ${this.formatFileSize(this.config.MAX_FILE_SIZE)}`);
        }

        // Check file type
        const extension = this.getFileExtension(file.name);
        const isImage = file.type.startsWith('image/');
        
        if (isImage && !this.supportedImageTypes.has(file.type)) {
            errors.push(`Unsupported image type: ${file.type}`);
        } else if (!isImage && !this.supportedTypes.has(extension)) {
            errors.push(`Unsupported file type: ${extension}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Process file with enhanced error handling
    async processFile(file) {
        const validation = this.validateFile(file);
        
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    data: e.target.result,
                    size: file.size,
                    lastModified: file.lastModified,
                    processed: true
                });
            };

            reader.onerror = () => {
                reject(new Error(`Failed to read file: ${file.name}`));
            };

            // Read based on file type
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    // Batch process multiple files
    async processFiles(files) {
        const results = {
            success: [],
            errors: []
        };

        for (const file of files) {
            try {
                const processed = await this.processFile(file);
                results.success.push(processed);
            } catch (error) {
                results.errors.push({
                    fileName: file.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    // Get file extension
    getFileExtension(filename) {
        return '.' + filename.split('.').pop().toLowerCase();
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Compress image if needed
    async compressImage(file, maxSizeMB = 2) {
        if (file.size <= maxSizeMB * 1024 * 1024) {
            return file; // No compression needed
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const maxDimension = 1920;
                let { width, height } = img;

                if (width > height && width > maxDimension) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', 0.8);
            };

            img.src = URL.createObjectURL(file);
        });
    }
}

// Chat History Manager
class ChatHistoryManager {
    constructor(config) {
        this.config = config;
        this.storageKey = 'gemini_chat_history_v2';
    }

    // Save chat history with compression
    saveChatHistory(chatHistory) {
        try {
            const compressed = this.compressHistory(chatHistory);
            localStorage.setItem(this.storageKey, JSON.stringify(compressed));
            return true;
        } catch (error) {
            console.error('Failed to save chat history:', error);
            return false;
        }
    }

    // Load chat history with decompression
    loadChatHistory() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return [];

            const parsed = JSON.parse(saved);
            return this.decompressHistory(parsed);
        } catch (error) {
            console.error('Failed to load chat history:', error);
            return [];
        }
    }

    // Compress history to save storage space
    compressHistory(history) {
        return history.slice(0, this.config.MAX_CHAT_HISTORY).map(chat => ({
            id: chat.id,
            title: chat.title.substring(0, 100),
            timestamp: chat.timestamp,
            messageCount: chat.messages.length,
            model: chat.model,
            lastMessage: chat.messages.slice(-1)[0]?.content?.substring(0, 200) || '',
            // Store only essential message data
            messages: chat.messages.map(msg => ({
                type: msg.type,
                content: msg.type === 'bot' ? msg.content.substring(0, 2000) : msg.content,
                timestamp: msg.timestamp,
                attachments: msg.attachments?.map(att => ({
                    name: att.name,
                    type: att.type,
                    size: att.size
                })) || []
            }))
        }));
    }

    // Decompress history
    decompressHistory(compressed) {
        return compressed;
    }

    // Export chat history
    exportHistory(format = 'json') {
        const history = this.loadChatHistory();
        
        if (format === 'json') {
            return JSON.stringify(history, null, 2);
        } else if (format === 'txt') {
            return history.map(chat => 
                `=== ${chat.title} (${chat.timestamp}) ===\n` +
                chat.messages.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n') +
                '\n\n'
            ).join('');
        }
        
        return history;
    }

    // Import chat history
    importHistory(data, format = 'json') {
        try {
            let imported;
            
            if (format === 'json') {
                imported = JSON.parse(data);
            } else {
                throw new Error('Only JSON import is supported currently');
            }

            // Validate imported data
            if (!Array.isArray(imported)) {
                throw new Error('Invalid import format');
            }

            return this.saveChatHistory(imported);
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
}

// Export classes for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeminiAPIManager, FileManager, ChatHistoryManager };
} else {
    window.GeminiAPIManager = GeminiAPIManager;
    window.FileManager = FileManager;
    window.ChatHistoryManager = ChatHistoryManager;
}