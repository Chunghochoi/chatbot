// utils.js - Các hàm tiện ích

/**
 * Định dạng thời gian
 */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Định dạng ngày
 */
function formatDate(date = new Date()) {
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Chuyển đổi markdown đơn giản thành HTML
 */
function formatMessage(text) {
    if (!text) return '';
    
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: var(--border-color); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
        .replace(/```(.*?)```/gs, '<pre style="background: var(--border-color); padding: 10px; border-radius: 8px; overflow-x: auto;"><code>$1</code></pre>')
        .replace(/\n/g, '<br>');
}

/**
 * Tạo ID ngẫu nhiên
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Lấy địa chỉ IP của user (sử dụng service miễn phí)
 */
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Không thể lấy IP:', error);
        return 'unknown';
    }
}

/**
 * Lấy thông tin vị trí từ IP
 */
async function getLocationFromIP(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        return {
            country: data.country_name,
            city: data.city,
            region: data.region,
            timezone: data.timezone
        };
    } catch (error) {
        console.error('Không thể lấy location:', error);
        return null;
    }
}

/**
 * Tạo hash từ chuỗi (để làm ID cho IP)
 */
function hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Validate API key format
 */
function validateApiKey(provider, key) {
    if (!key) return true; // Cho phép empty để dùng default
    
    switch (provider) {
        case 'gemini':
            return key.startsWith('AIza') && key.length > 30;
        case 'openai':
            return key.startsWith('sk-') && key.length > 40;
        case 'claude':
            return key.startsWith('sk-ant-') && key.length > 40;
        default:
            return false;
    }
}

/**
 * Truncate text với ellipsis
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback cho browsers cũ
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    } catch (error) {
        console.error('Không thể copy:', error);
        return false;
    }
}

/**
 * Download text as file
 */
function downloadTextAsFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Sanitize HTML để tránh XSS
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Parse JSON safely
 */
function safeJSONParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
}

/**
 * Kiểm tra xem device có phải mobile không
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Escape regex special characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\/**
 * Download text as file
 */
function downloadTextAsFile(text, filename) {');
}