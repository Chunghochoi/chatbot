// storage.js - Quản lý lưu trữ dữ liệu

class StorageManager {
    constructor() {
        this.prefix = 'personalAI_';
        this.userIP = null;
        this.init();
    }

    async init() {
        this.userIP = await getUserIP();
        this.sessionId = this.generateSessionId();
        this.loadSettings();
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Tạo key duy nhất cho mỗi IP
     */
    getIPBasedKey(key) {
        const ipHash = this.userIP ? hashString(this.userIP) : 'default';
        return `${this.prefix}${ipHash}_${key}`;
    }

    /**
     * Lưu settings
     */
    saveSettings(settings) {
        try {
            const key = this.getIPBasedKey('settings');
            const data = {
                ...settings,
                lastUpdated: new Date().toISOString(),
                ip: this.userIP
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Lỗi lưu settings:', error);
            return false;
        }
    }

    /**
     * Load settings
     */
    loadSettings() {
        try {
            const key = this.getIPBasedKey('settings');
            const data = localStorage.getItem(key);
            if (data) {
                const settings = safeJSONParse(data);
                return { ...CONFIG.DEFAULT_SETTINGS, ...settings };
            }
            return CONFIG.DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Lỗi load settings:', error);
            return CONFIG.DEFAULT_SETTINGS;
        }
    }

    /**
     * Lưu lịch sử chat
     */
    saveChatHistory(messages) {
        if (!this.shouldSaveHistory()) return false;

        try {
            const key = this.getIPBasedKey('chat_history');
            const existingHistory = this.loadChatHistory();
            
            const newSession = {
                id: this.sessionId,
                timestamp: new Date().toISOString(),
                messages: messages,
                messageCount: messages.length,
                ip: this.userIP
            };

            existingHistory.push(newSession);

            // Giới hạn số lượng sessions
            if (existingHistory.length > CONFIG.LIMITS.maxHistoryItems) {
                existingHistory.shift(); // Xóa session cũ nhất
            }

            localStorage.setItem(key, JSON.stringify(existingHistory));
            this.updateHistoryStats();
            return true;
        } catch (error) {
            console.error('Lỗi lưu chat history:', error);
            return false;
        }
    }

    /**
     * Load lịch sử chat
     */
    loadChatHistory() {
        try {
            const key = this.getIPBasedKey('chat_history');
            const data = localStorage.getItem(key);
            return data ? safeJSONParse(data, []) : [];
        } catch (error) {
            console.error('Lỗi load chat history:', error);
            return [];
        }
    }

    /**
     * Lấy lịch sử session gần nhất
     */
    getRecentHistory(limit = 5) {
        const history = this.loadChatHistory();
        return history.slice(-limit).reverse();
    }

    /**
     * Xóa toàn bộ lịch sử
     */
    clearAllHistory() {
        try {
            const key = this.getIPBasedKey('chat_history');
            localStorage.removeItem(key);
            this.updateHistoryStats();
            return true;
        } catch (error) {
            console.error('Lỗi xóa history:', error);
            return false;
        }
    }

    /**
     * Export lịch sử
     */
    exportHistory() {
        const history = this.loadChatHistory();
        const exportData = {
            exportDate: new Date().toISOString(),
            userIP: this.userIP,
            totalSessions: history.length,
            sessions: history.map(session => ({
                ...session,
                messages: session.messages.map(msg => ({
                    type: msg.type,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            }))
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const filename = `chat_history_${formatDate().replace(/\//g, '-')}.json`;
        downloadTextAsFile(jsonString, filename);
    }

    /**
     * Cập nhật thống kê lịch sử
     */
    updateHistoryStats() {
        const history = this.loadChatHistory();
        const totalChats = history.length;
        const totalMessages = history.reduce((sum, session) => sum + session.messageCount, 0);

        // Update UI elements if they exist
        const totalChatsEl = document.getElementById('totalChats');
        const totalMessagesEl = document.getElementById('totalMessages');
        
        if (totalChatsEl) totalChatsEl.textContent = totalChats;
        if (totalMessagesEl) totalMessagesEl.textContent = totalMessages;
    }

    /**
     * Kiểm tra xem có nên lưu lịch sử không
     */
    shouldSaveHistory() {
        const settings = this.loadSettings();
        return settings.saveHistory !== false;
    }

    /**
     * Lưu theme hiện tại
     */
    saveTheme(theme) {
        try {
            const key = this.getIPBasedKey('theme');
            localStorage.setItem(key, theme);
            return true;
        } catch (error) {
            console.error('Lỗi lưu theme:', error);
            return false;
        }
    }

    /**
     * Load theme
     */
    loadTheme() {
        try {
            const key = this.getIPBasedKey('theme');
            return localStorage.getItem(key) || 'light';
        } catch (error) {
            console.error('Lỗi load theme:', error);
            return 'light';
        }
    }

    /**
     * Lưu conversation context cho session hiện tại
     */
    saveConversationContext(context) {
        try {
            const key = `${this.prefix}context_${this.sessionId}`;
            sessionStorage.setItem(key, JSON.stringify(context));
            return true;
        } catch (error) {
            console.error('Lỗi lưu context:', error);
            return false;
        }
    }

    /**
     * Load conversation context
     */
    loadConversationContext() {
        try {
            const key = `${this.prefix}context_${this.sessionId}`;
            const data = sessionStorage.getItem(key);
            return data ? safeJSONParse(data, []) : [];
        } catch (error) {
            console.error('Lỗi load context:', error);
            return [];
        }
    }

    /**
     * Reset settings về mặc định
     */
    resetSettings() {
        try {
            const key = this.getIPBasedKey('settings');
            localStorage.removeItem(key);
            return CONFIG.DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Lỗi reset settings:', error);
            return CONFIG.DEFAULT_SETTINGS;
        }
    }

    /**
     * Lấy thông tin storage usage
     */
    getStorageInfo() {
        let totalSize = 0;
        let itemCount = 0;
        
        for (let key in localStorage) {
            if (key.startsWith(this.prefix)) {
                totalSize += localStorage[key].length;
                itemCount++;
            }
        }

        return {
            totalSize: formatFileSize(totalSize),
            itemCount,
            userIP: this.userIP
        };
    }
}

// Khởi tạo storage manager
const storageManager = new StorageManager();