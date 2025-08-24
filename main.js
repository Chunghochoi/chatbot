// main.js - Logic chính của ứng dụng

class ChatBot {
    constructor() {
        this.conversationHistory = [];
        this.isProcessing = false;
        this.init();
    }

    async init() {
        // Wait for storage manager to initialize
        setTimeout(() => {
            this.loadConversationHistory();
            this.initializeSettings();
        }, 100);
    }

    /**
     * Load conversation history from storage
     */
    loadConversationHistory() {
        this.conversationHistory = storageManager.loadConversationContext();
        uiManager.showToast('Đã khôi phục ngữ cảnh hội thoại', 'info', 2000);
    }

    /**
     * Initialize settings
     */
    initializeSettings() {
        const settings = storageManager.loadSettings();
        
        // Set API keys
        if (settings.apiKey) {
            apiManager.setApiKey(settings.aiProvider || 'gemini', settings.apiKey);
        }
        
        // Set provider
        apiManager.setProvider(settings.aiProvider || 'gemini');
        
        // Apply theme
        uiManager.currentTheme = settings.theme || 'light';
        uiManager.applyTheme();
    }

    /**
     * Send message
     */
    async sendMessage() {
        if (this.isProcessing) return;

        const messageInput = document.getElementById('messageInput');
        const message = messageInput?.value?.trim();
        
        if (!message) {
            uiManager.showToast('Vui lòng nhập tin nhắn', 'warning');
            return;
        }

        if (message.length > CONFIG.LIMITS.maxMessageLength) {
            uiManager.showToast(`Tin nhắn quá dài. Tối đa ${CONFIG.LIMITS.maxMessageLength} ký tự`, 'error');
            return;
        }

        this.isProcessing = true;
        
        try {
            // Add user message to UI
            uiManager.addMessage('👤', message, 'user');
            uiManager.resetInput();

            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Show typing indicator
            uiManager.showTypingIndicator();

            // Get current settings
            const settings = uiManager.getCurrentSettings();
            
            // Update API manager with current settings
            if (settings.apiKey) {
                apiManager.setApiKey(settings.aiProvider, settings.apiKey);
            }
            apiManager.setProvider(settings.aiProvider);

            // Send to AI
            const response = await apiManager.sendMessage(
                message, 
                this.conversationHistory.slice(-CONFIG.LIMITS.maxContextMessages), 
                settings
            );

            // Hide typing indicator
            uiManager.hideTypingIndicator();

            // Add AI response to UI
            uiManager.addMessage('🤖', response, 'bot');

            // Add to conversation history
            this.conversationHistory.push({
                role: 'bot',
                content: response,
                timestamp: new Date().toISOString()
            });

            // Save conversation context
            this.saveConversationContext();

            // Save to chat history if enabled
            if (settings.saveHistory) {
                this.saveChatSession();
            }

            uiManager.clearError();
            uiManager.focusInput();

        } catch (error) {
            console.error('Send message error:', error);
            uiManager.hideTypingIndicator();
            
            // Show error message
            uiManager.showError(error.message);
            
            // Add error message to chat
            uiManager.addMessage('🤖', 
                'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc kiểm tra cài đặt API.', 
                'bot'
            );

            uiManager.focusInput();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Save conversation context
     */
    saveConversationContext() {
        storageManager.saveConversationContext(this.conversationHistory);
    }

    /**
     * Save chat session to history
     */
    saveChatSession() {
        const messages = this.conversationHistory.map(msg => ({
            type: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
        }));
        
        storageManager.saveChatHistory(messages);
    }

    /**
     * Save settings
     */
    saveSettings() {
        const settings = uiManager.getCurrentSettings();
        
        // Validate API key format
        if (settings.apiKey && !validateApiKey(settings.aiProvider, settings.apiKey)) {
            uiManager.showError('Định dạng API key không hợp lệ cho ' + settings.aiProvider);
            return;
        }

        // Update API manager
        if (settings.apiKey) {
            apiManager.setApiKey(settings.aiProvider, settings.apiKey);
        }
        apiManager.setProvider(settings.aiProvider);

        // Save to storage
        const success = storageManager.saveSettings(settings);
        
        if (success) {
            uiManager.showToast('Đã lưu cài đặt thành công', 'success');
            uiManager.clearError();
        } else {
            uiManager.showError('Không thể lưu cài đặt');
        }

        // Test API connection if key is provided
        if (settings.apiKey) {
            this.testApiConnection(settings.aiProvider);
        }
    }

    /**
     * Test API connection
     */
    async testApiConnection(provider = null) {
        try {
            uiManager.showToast('Đang kiểm tra kết nối API...', 'info');
            
            const result = await apiManager.testConnection(provider);
            
            if (result.success) {
                uiManager.showToast(`Kết nối ${result.provider} thành công!`, 'success');
            } else {
                uiManager.showToast(`Lỗi kết nối ${result.provider}: ${result.error}`, 'error', 5000);
            }
        } catch (error) {
            uiManager.showToast('Không thể kiểm tra kết nối', 'error');
        }
    }

    /**
     * Reset settings to default
     */
    resetSettings() {
        uiManager.showConfirmDialog(
            'Bạn có chắc chắn muốn khôi phục cài đặt về mặc định?',
            () => {
                const defaultSettings = storageManager.resetSettings();
                uiManager.loadSettingsToUI();
                uiManager.showToast('Đã khôi phục cài đặt mặc định', 'success');
                
                // Reset API manager
                apiManager.setProvider(defaultSettings.aiProvider);
                apiManager.setApiKey(defaultSettings.aiProvider, '');
            }
        );
    }

    /**
     * Clear all chat history
     */
    clearAllHistory() {
        uiManager.showConfirmDialog(
            'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác.',
            () => {
                // Clear storage
                storageManager.clearAllHistory();
                
                // Clear current conversation
                this.conversationHistory = [];
                storageManager.saveConversationContext([]);
                
                // Clear UI
                uiManager.clearMessages();
                
                uiManager.showToast('Đã xóa toàn bộ lịch sử', 'success');
            }
        );
    }

    /**
     * Export chat history
     */
    exportHistory() {
        try {
            storageManager.exportHistory();
            uiManager.showToast('Đã xuất lịch sử thành công', 'success');
        } catch (error) {
            console.error('Export error:', error);
            uiManager.showToast('Không thể xuất lịch sử', 'error');
        }
    }

    /**
     * Get app statistics
     */
    getStats() {
        const storageInfo = storageManager.getStorageInfo();
        const apiStats = apiManager.getStats();
        
        return {
            ...storageInfo,
            ...apiStats,
            currentConversationLength: this.conversationHistory.length,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter: Send message
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.sendMessage();
            return;
        }

        // Ctrl/Cmd + K: Focus search/input
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            uiManager.focusInput();
            return;
        }

        // Escape: Close modals or settings
        if (event.key === 'Escape') {
            const modal = document.querySelector('.modal[style*="flex"]');
            if (modal) {
                modal.style.display = 'none';
            } else if (uiManager.settingsVisible) {
                uiManager.toggleSettings();
            }
            return;
        }

        // Ctrl/Cmd + /: Toggle settings
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            uiManager.toggleSettings();
            return;
        }
    }

    /**
     * Handle app visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // App became hidden, save current state
            this.saveConversationContext();
        } else {
            // App became visible, could refresh data if needed
            storageManager.updateHistoryStats();
        }
    }
}

// Global functions for HTML onclick handlers
function sendMessage() {
    chatBot.sendMessage();
}

function saveSettings() {
    chatBot.saveSettings();
}

function resetSettings() {
    chatBot.resetSettings();
}

function clearAllHistory() {
    chatBot.clearAllHistory();
}

function exportHistory() {
    chatBot.exportHistory();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chatbot
    window.chatBot = new ChatBot();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        chatBot.handleKeyboardShortcuts(event);
    });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        chatBot.handleVisibilityChange();
    });
    
    // Handle before unload
    window.addEventListener('beforeunload', () => {
        chatBot.saveConversationContext();
    });
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn-primary {
            background: var(--secondary-gradient);
            color: white;
        }
        
        .btn-secondary {
            background: var(--border-color);
            color: var(--text-color);
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn-info {
            background: #3b82f6;
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .history-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .history-stats p {
            margin: 8px 0;
            font-weight: 500;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .modal-body {
            padding: 20px;
        }
    `;
    document.head.appendChild(style);
    
    // Show welcome message
    console.log('🤖 Personal AI Chatbot đã sẵn sàng!');
    console.log('📝 Keyboard shortcuts:');
    console.log('  • Ctrl/Cmd + Enter: Gửi tin nhắn');
    console.log('  • Ctrl/Cmd + K: Focus input');
    console.log('  • Ctrl/Cmd + /: Toggle settings');
    console.log('  • Escape: Đóng modals');
});