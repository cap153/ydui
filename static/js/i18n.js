/**
 * Copyright (c) 2025 cap153 <cap15369@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const translations = {
    en: {
        'video-url': 'Video URL:',
        'video-url-placeholder': 'Enter YouTube video URL',
        'video-quality': 'Video Quality:',
        'quality-best': 'Best Quality',
        'proxy': 'Proxy Settings:',
        'proxy-placeholder': 'e.g., socks5://127.0.0.1:1080',
        'cookie-text': 'Cookie Content:',
        'cookie-text-placeholder': 'Paste cookie content',
        'cookie-file': 'Or Upload Cookie File:',
        'use-aria2': 'Enable Aria2 Downloader (Multi-threaded)',
        'download-btn': 'Start Download',
        'downloads-title': 'Downloads',
        'preparing': 'Preparing...',
        'download-failed': 'Download Failed:',
        'status-update-failed': 'Status Update Failed',
        'download-completed': 'Download completed',
        'command-preview': 'Command Preview:',
        'quality-none': 'None',
        'custom-args': 'Custom Arguments:',
        'custom-args-placeholder': 'e.g., --extract-audio --audio-format mp3',
        'logs-title': 'Download Logs',
        'clear-logs': 'Clear Logs',
        'copy-logs': 'Copy Logs',
        'logs-copied': 'Logs copied to clipboard',
        'loading-files': 'Loading downloaded files...',
        'no-files': 'No downloaded files',
        'load-failed': 'Failed to load files:'
    },
    zh: {
        'video-url': '视频链接：',
        'video-url-placeholder': '请输入YouTube视频链接',
        'video-quality': '视频画质：',
        'quality-best': '最佳画质',
        'proxy': '代理设置：',
        'proxy-placeholder': '例如: socks5://127.0.0.1:1080',
        'cookie-text': 'Cookie 内容：',
        'cookie-text-placeholder': '粘贴 cookie 内容',
        'cookie-file': '或上传 Cookie 文件：',
        'use-aria2': '启用 Aria2 下载器（多线程下载）',
        'download-btn': '开始下载',
        'downloads-title': '下载列表',
        'preparing': '准备下载...',
        'download-failed': '下载失败：',
        'status-update-failed': '更新状态失败',
        'download-completed': '下载完成',
        'command-preview': '命令预览：',
        'quality-none': '无',
        'custom-args': '自定义参数：',
        'custom-args-placeholder': '例如: --extract-audio --audio-format mp3',
        'logs-title': '下载日志',
        'clear-logs': '清除日志',
        'copy-logs': '复制日志',
        'logs-copied': '日志已复制到剪贴板',
        'loading-files': '加载已下载文件列表...',
        'no-files': '暂无已下载文件',
        'load-failed': '加载失败:'
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('ydui-language') || 'zh';
        this.langBtn = document.getElementById('lang-switch');
        this.initEventListeners();
        this.updateLanguage();
    }

    initEventListeners() {
        this.langBtn.addEventListener('click', () => {
            this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
            localStorage.setItem('ydui-language', this.currentLang);
            this.updateLanguage();
            window.downloadManager?.loadExistingDownloads();
        });
    }

    updateLanguage() {
        this.langBtn.textContent = this.currentLang === 'zh' ? 'EN' : '中文';
        
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = translations[this.currentLang][key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = translations[this.currentLang][key];
        });
    }

    getText(key) {
        return translations[this.currentLang][key];
    }
}

window.I18n = I18n; 