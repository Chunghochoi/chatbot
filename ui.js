// ui.js - Quản lý giao diện người dùng

class UIManager {
    constructor() {
        this.isRecording = false;
        this.currentTheme = 'light';
        this.settingsVisible = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.initializeElements();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Auto resize textarea
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.autoResizeTextarea(messageInput);
            });

            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Temperature slider
        const tempSlider = document.getElementById('temperature');
        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                const valueSpan = e.target.nextElementSibling;
                if (valueSpan) valueSpan.textContent = value;
            });
        }

        // Settings toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.settings-toggle')) {
                this.toggleSettings();
            }
        });
    }

    /**
     * Auto resize textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        storageManager.saveTheme(this.currentTheme);
    }

    /**
     * Apply theme
     */
    applyTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('#themeToggle i');
        
        if (this.currentTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        } else {
            body.removeAttribute('data-theme');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        }
    }

    /**
     * Load theme from storage
     */
    loadTheme() {
        this.currentTheme = storageManager.loadTheme();
        this.applyTheme();
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            this.settingsVisible = !this.settingsVisible;
            if (this.settingsVisible) {
                settingsPanel.classList.add('show');
                this.loadSettingsToUI();
            } else {
                settingsPanel.classList.remove('show');
            }
        }
    }

    /**
     * Show specific tab in settings
     */
    showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const tabContent = document.getElementById(`${tabName}Tab`);
        const tabButton = event.target;
        
        if (tabContent) tabContent.classList.add('active');
        if (tabButton) tabButton.classList.add('active');

        // Update history stats if showing history tab
        if (tabName === 'history') {
            storageManager.updateHistoryStats();
        }
    }

    /**
     * Load settings to UI
     */
    loadSettingsToUI() {
        const settings = storageManager.loadSettings();
        
        // API Key (chỉ hiển thị một phần)
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput && settings.apiKey) {
            apiKeyInput.value = this.maskApiKey(settings.apiKey);
        }

        // AI Provider
        const providerSelect = document.getElementById('aiProvider');
        if (providerSelect) {
            providerSelect.value = settings.aiProvider || 'gemini';
        }

        // Personality
        const personalityInput = document.getElementById('personality');
        if (personalityInput) {
            personalityInput.value = settings.personality || CONFIG.DEFAULT_SETTINGS.personality;
        }

        // Temperature
        const temperatureSlider = document.getElementById('temperature');
        const temperatureValue = temperatureSlider?.nextElementSibling;
        if (temperatureSlider) {
            temperatureSlider.value = settings.temperature || 0.7;
            if (temperatureValue) temperatureValue.textContent = temperatureSlider.value;
        }

        // Max tokens
        const maxTokensInput = document.getElementById('maxTokens');
        if (maxTokensInput) {
            maxTokensInput.value = settings.maxTokens || 1024;
        }

        // Checkboxes
        const saveHistoryCheck = document.getElementById('saveHistory');
        if (saveHistoryCheck) {
            saveHistoryCheck.checked = settings.saveHistory !== false;
        }

        const autoScrollCheck = document.getElementById('autoScroll');
        if (autoScrollCheck) {
            autoScrollCheck.checked = settings.autoScroll !== false;
        }
    }

    /**
     * Mask API key for display
     */
    maskApiKey(key) {
        if (!key || key.length < 10) return key;
        return key.substring(0, 8) + '...' + key.substring(key.length - 4);
    }

    /**
     * Toggle API key visibility
     */
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.querySelector('.toggle-visibility i');
        
        if (apiKeyInput && toggleBtn) {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                toggleBtn.className = 'fas fa-eye-slash';
            } else {
                apiKeyInput.type = 'password';
                toggleBtn.className = 'fas fa-eye';
            }
        }
    }

    /**
     * Show error message
     */
    showError(message, duration = 5000) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
            
            if (duration > 0) {
                setTimeout(() => {
                    this.clearError();
                }, duration);
            }
        }
    }

    /**
     * Clear error message
     */
    clearError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        const sendBtn = document.getElementById('sendBtn');
        
        if (typingIndicator) typingIndicator.style.display = 'flex';
        if (sendBtn) sendBtn.disabled = true;
        
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        const sendBtn = document.getElementById('sendBtn');
        
        if (typingIndicator) typingIndicator.style.display = 'none';
        if (sendBtn) sendBtn.disabled = false;
    }

    /**
     * Add message to chat
     */
    addMessage(avatar, content, type, timestamp = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageTime = timestamp || formatTime();
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${formatMessage(content)}</div>
                <div class="message-time">${messageTime}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Add copy functionality
        this.addCopyFunctionality(messageDiv);
        
        return messageDiv;
    }

    /**
     * Add copy functionality to message
     */
    addCopyFunctionality(messageElement) {
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
            messageContent.addEventListener('dblclick', async () => {
                const textContent = messageContent.querySelector('.message-text').textContent;
                const success = await copyToClipboard(textContent);
                if (success) {
                    this.showToast('Đã copy tin nhắn', 'success');
                } else {
                    this.showToast('Không thể copy', 'error');
                }
            });
        }
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        const settings = storageManager.loadSettings();
        if (settings.autoScroll === false) return;

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            
            // Add welcome message
            this.addMessage('🤖', 'Lịch sử trò chuyện đã được xóa. Bạn có thể bắt đầu cuộc hội thoại mới.', 'bot');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Style toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow)',
            animation: 'slideInRight 0.3s ease-out'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.background = colors[type] || colors.info;

        // Add to document
        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Initialize elements after DOM load
     */
    initializeElements() {
        // Set default personality if empty
        const personalityInput = document.getElementById('personality');
        if (personalityInput && !personalityInput.value.trim()) {
            personalityInput.value = CONFIG.DEFAULT_SETTINGS.personality;
        }

        // Load history stats
        storageManager.updateHistoryStats();
    }

    /**
     * Show confirmation dialog
     */
    showConfirmDialog(message, onConfirm, onCancel = null) {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'flex';
        
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Xác nhận</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-btn">Hủy</button>
                    <button class="btn btn-primary confirm-btn">Xác nhận</button>
                </div>
            </div>
        `;

        // Add event listeners
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const confirmBtn = dialog.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            dialog.remove();
            if (onCancel) onCancel();
        });
        
        confirmBtn.addEventListener('click', () => {
            dialog.remove();
            if (onConfirm) onConfirm();
        });

        // Close on backdrop click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
                if (onCancel) onCancel();
            }
        });

        document.body.appendChild(dialog);
    }

    /**
     * Toggle voice recording modal
     */
    toggleVoiceRecording() {
        const modal = document.getElementById('voiceModal');
        if (modal) {
            if (this.isRecording) {
                this.stopVoiceRecording();
            } else {
                modal.style.display = 'flex';
            }
        }
    }

    /**
     * Close voice modal
     */
    closeVoiceModal() {
        const modal = document.getElementById('voiceModal');
        if (modal) {
            modal.style.display = 'none';
            if (this.isRecording) {
                this.stopVoiceRecording();
            }
        }
    }

    /**
     * Start voice recording
     */
    startVoiceRecording() {
        // Voice recording functionality would be implemented here
        // This is a placeholder for the UI changes
        this.isRecording = true;
        const voiceIcon = document.getElementById('voiceIcon');
        const voiceActionBtn = document.getElementById('voiceActionBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (voiceIcon) voiceIcon.className = 'fas fa-stop';
        if (voiceActionBtn) {
            voiceActionBtn.innerHTML = '<i class="fas fa-stop"></i> Dừng';
            voiceActionBtn.onclick = () => this.stopVoiceRecording();
        }
        if (voiceStatus) voiceStatus.textContent = 'Đang ghi âm...';
        
        this.showToast('Bắt đầu ghi âm', 'info');
    }

    /**
     * Stop voice recording
     */
    stopVoiceRecording() {
        this.isRecording = false;
        const voiceIcon = document.getElementById('voiceIcon');
        const voiceActionBtn = document.getElementById('voiceActionBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (voiceIcon) voiceIcon.className = 'fas fa-microphone';
        if (voiceActionBtn) {
            voiceActionBtn.innerHTML = '<i class="fas fa-microphone"></i> Bắt đầu';
            voiceActionBtn.onclick = () => this.startVoiceRecording();
        }
        if (voiceStatus) voiceStatus.textContent = 'Nhấn để bắt đầu ghi âm';
        
        this.closeVoiceModal();
        this.showToast('Đã dừng ghi âm', 'info');
    }

    /**
     * Update provider change
     */
    onProviderChange() {
        const providerSelect = document.getElementById('aiProvider');
        if (providerSelect) {
            const newProvider = providerSelect.value;
            apiManager.setProvider(newProvider);
            
            // Show different instructions based on provider
            this.showProviderInfo(newProvider);
        }
    }

    /**
     * Show provider specific information
     */
    showProviderInfo(provider) {
        const messages = {
            gemini: 'Sử dụng Google Gemini API. API key mặc định đã được cung cấp.',
            openai: 'Cần API key từ OpenAI. Lấy tại: https://platform.openai.com/api-keys',
            claude: 'Cần API key từ Anthropic. Lấy tại: https://console.anthropic.com/'
        };
        
        if (messages[provider]) {
            this.showToast(messages[provider], 'info', 4000);
        }
    }

    /**
     * Reset input field
     */
    resetInput() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
    }

    /**
     * Focus input field
     */
    focusInput() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }

    /**
     * Get current settings from UI
     */
    getCurrentSettings() {
        return {
            apiKey: document.getElementById('apiKey')?.value?.trim() || '',
            aiProvider: document.getElementById('aiProvider')?.value || 'gemini',
            personality: document.getElementById('personality')?.value?.trim() || CONFIG.DEFAULT_SETTINGS.personality,
            temperature: parseFloat(document.getElementById('temperature')?.value || 0.7),
            maxTokens: parseInt(document.getElementById('maxTokens')?.value || 1024),
            saveHistory: document.getElementById('saveHistory')?.checked !== false,
            autoScroll: document.getElementById('autoScroll')?.checked !== false,
            theme: this.currentTheme
        };
    }
}

// Global UI functions for HTML onclick handlers
function toggleTheme() {
    uiManager.toggleTheme();
}

function toggleSettings() {
    uiManager.toggleSettings();
}

function showTab(tabName) {
    uiManager.showTab(tabName);
}

function toggleApiKeyVisibility() {
    uiManager.toggleApiKeyVisibility();
}

function toggleVoiceRecording() {
    uiManager.toggleVoiceRecording();
}

function closeVoiceModal() {
    uiManager.closeVoiceModal();
}

function startVoiceRecording() {
    uiManager.startVoiceRecording();
}

function onProviderChange() {
    uiManager.onProviderChange();
}

// Initialize UI manager
const uiManager = new UIManager();