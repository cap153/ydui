/**
 * Copyright (c) 2025 cap153 <cap15369@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class DownloadManager {
    constructor() {
        // 获取所有需要的 DOM 元素
        const elements = {
            downloadBtn: document.getElementById('download-btn'),
            videoUrl: document.getElementById('video-url'),
            proxy: document.getElementById('proxy'),
            useAria2: document.getElementById('use-aria2'),
            videoQuality: document.getElementById('video-quality'),
            downloadsContainer: document.getElementById('downloads-container'),
            customArgs: document.getElementById('custom-args'),
            logsContainer: document.getElementById('logs-container'),
            clearLogsBtn: document.getElementById('clear-logs'),
            copyLogsBtn: document.getElementById('copy-logs'),
            logsPanel: document.querySelector('.logs-panel'),
            logsToggle: document.getElementById('logs-toggle'),
            cookieText: document.getElementById('cookie-text'),
            cookieFile: document.getElementById('cookie-file'),
            sidebar: document.querySelector('.sidebar'),
            restartBtn: document.getElementById('restart-server')
        };

        // 检查必需元素
        const missingElements = Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
        }

        Object.assign(this, elements);

        // 初始化日志面板状态
        const logsPanelCollapsed = localStorage.getItem('ydui-logs-collapsed') === 'true';
        if (logsPanelCollapsed || window.matchMedia("(orientation: portrait)").matches) {
            this.logsPanel.classList.add('collapsed');
        }

        // 添加屏幕方向变化监听
        window.matchMedia("(orientation: portrait)").addEventListener("change", (e) => {
            if (e.matches) {  // 切换到竖屏
                this.logsPanel.classList.add('collapsed');
            }
        });

        this.initEventListeners();
        this.loadSettings();
        this.updateButtonText();
    }

    initEventListeners() {
        const handlers = {
            downloadBtn: () => this.startDownload(),
            useAria2: () => { this.saveSettings(); this.updateButtonText(); },
            videoQuality: () => { this.saveSettings(); this.updateButtonText(); },
            videoUrl: () => this.updateButtonText(),
            proxy: () => { this.saveSettings(); this.updateButtonText(); },
            cookieText: () => { this.saveSettings(); this.updateButtonText(); },
            cookieFile: () => {
                const file = this.cookieFile.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.cookieText.value = e.target.result;
                        this.saveSettings();
                        this.updateButtonText();
                    };
                    reader.readAsText(file);
                }
            },
            customArgs: () => { this.saveSettings(); this.updateButtonText(); },
            clearLogsBtn: () => this.clearLogs(),
            copyLogsBtn: () => this.copyLogs(),
            logsToggle: () => {
                this.logsPanel.classList.toggle('collapsed');
                localStorage.setItem('ydui-logs-collapsed', this.logsPanel.classList.contains('collapsed'));
            },
            restartBtn: () => this.restartServer()
        };

        // 修改事件监听的方式
        Object.entries(handlers).forEach(([key, handler]) => {
            const element = this[key];
            if (element) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    // 对文本输入框同时监听 input 和 change 事件
                    element.addEventListener('input', handler);
                    element.addEventListener('change', handler);
                } else if (element.tagName === 'TEXTAREA') {
                    // 对文本区域同时监听 input 和 change 事件
                    element.addEventListener('input', handler);
                    element.addEventListener('change', handler);
                    element.addEventListener('blur', handler);  // 添加失去焦点事件
                } else {
                    // 其他元素使用原来的逻辑
                    element.addEventListener('click' in element ? 'click' : 'input', handler);
                }
            }
        });
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('ydui-settings') || '{}');
        this.useAria2.checked = settings.useAria2 || false;
        this.videoQuality.value = settings.videoQuality || 'best';
        this.customArgs.value = settings.customArgs || '';
        this.proxy.value = settings.proxy || '';
        this.cookieText.value = settings.cookieText || '';
    }

    saveSettings() {
        localStorage.setItem('ydui-settings', JSON.stringify({
            useAria2: this.useAria2.checked,
            videoQuality: this.videoQuality.value,
            customArgs: this.customArgs.value,
            proxy: this.proxy.value,
            cookieText: this.cookieText.value
        }));
    }

    async startDownload() {
        if (!this.videoUrl.value) {
            alert(window.i18n.getText('video-url-placeholder'));
            return;
        }

        const data = {
            url: this.videoUrl.value,
            proxy: this.proxy.value || null,
            cookie_text: this.cookieText.value || null,
            use_aria2: this.useAria2.checked,
            quality: this.videoQuality.value,
            custom_args: this.customArgs.value.trim() || null
        };

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const responseData = await response.json();
            this.addDownloadItem(responseData.id, this.videoUrl.value);
            this.videoUrl.value = '';
        } catch (error) {
            alert(window.i18n.getText('download-failed') + error.message);
        }
    }

    addDownloadItem(id, url) {
        const downloadItem = document.createElement('div');
        downloadItem.className = 'download-item';
        downloadItem.innerHTML = `
            <div class="title">${url}</div>
            <div class="progress">
                <div class="progress-bar loading" style="width: 100%"></div>
            </div>
            <div class="status">${window.i18n.getText('preparing')}</div>
        `;

        this.downloadsContainer.prepend(downloadItem);
        this.startProgressUpdates(id, downloadItem);
    }

    async startProgressUpdates(id, element) {
        const progressBar = element.querySelector('.progress-bar');
        const statusText = element.querySelector('.status');
        const titleDiv = element.querySelector('.title');

        while (true) {
            try {
                const response = await fetch(`/api/status/${id}`);
                const data = await response.json();

                if (data.progress > 0) {
                    progressBar.classList.remove('loading');
                    progressBar.style.width = `${data.progress}%`;
                }

                statusText.textContent = data.status === "下载完成" 
                    ? window.i18n.getText('download-completed') 
                    : data.status;

                if (data.filename) {
                    this.updateDownloadTitle(titleDiv, data.filename);
                }

                if (data.status === "下载完成" || data.status === 'error') {
                    progressBar.classList.remove('loading');
                    break;
                }

                if (data.log) this.appendLog(data.log);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                progressBar.classList.remove('loading');
                statusText.textContent = window.i18n.getText('status-update-failed');
                break;
            }
        }

        if (statusText.textContent === window.i18n.getText('download-completed')) {
            await this.loadExistingDownloads();
        }
    }

    updateDownloadTitle(titleDiv, filename) {
        titleDiv.textContent = filename;
        titleDiv.setAttribute('role', 'button');
        titleDiv.setAttribute('data-filename', filename);
        
        const newTitle = titleDiv.cloneNode(true);
        newTitle.addEventListener('click', () => {
            window.open(`/downloads/${encodeURIComponent(filename)}`, '_blank');
        });
        titleDiv.parentNode.replaceChild(newTitle, titleDiv);
    }

    async loadExistingDownloads() {
        if (!this.downloadsContainer) return;

        try {
            const [filesResponse, tasksResponse] = await Promise.all([
                fetch('/api/list'),
                fetch('/api/tasks')
            ]);

            if (!filesResponse.ok) throw new Error(`HTTP error! status: ${filesResponse.status}`);
            if (!tasksResponse.ok) throw new Error(`HTTP error! status: ${tasksResponse.status}`);

            const [files, tasks] = await Promise.all([
                filesResponse.json(),
                tasksResponse.json()
            ]);

            this.downloadsContainer.innerHTML = '';

            // 显示正在进行的任务
            Object.entries(tasks).forEach(([id, task]) => {
                if (task.status !== "下载完成") {
                    const url = task.url ||
                               (task.log && task.log.find(log => log.includes('https://'))) ||
                               "正在下载";
                    this.addDownloadItem(id, url);
                    if (task.progress) {
                        const item = this.downloadsContainer.querySelector(`[data-id="${id}"]`);
                        if (item) {
                            const progressBar = item.querySelector('.progress-bar');
                            const statusText = item.querySelector('.status');
                            if (progressBar) {
                                progressBar.style.width = `${task.progress}%`;
                                progressBar.classList.remove('loading');
                            }
                            if (statusText) {
                                statusText.textContent = task.status;
                            }
                        }
                    }
                }
            });

            // 显示已完成下载的文件
            if (files.length > 0) {
                files.sort((a, b) => b.created_time - a.created_time)
                    .forEach(file => this.createDownloadItem(file));
            } else if (Object.keys(tasks).length === 0) {
                this.downloadsContainer.innerHTML = `
                    <div class="download-item">
                        <div class="status">${window.i18n.getText('no-files')}</div>
                    </div>
                `;
            }
        } catch (error) {
            this.downloadsContainer.innerHTML = `
                <div class="download-item">
                    <div class="status" style="color: #dc3545;">
                        ${window.i18n.getText('load-failed')} ${error.message}
                    </div>
                </div>
            `;
        }
    }

    createDownloadItem(file) {
        const downloadItem = document.createElement('div');
        downloadItem.className = 'download-item';
        
        const date = new Date(file.created_time * 1000);
        downloadItem.innerHTML = `
            <div class="title" role="button" data-filename="${file.filename}">${file.filename}</div>
            <div class="progress">
                <div class="progress-bar" style="width: 100%"></div>
            </div>
            <div class="status">
                ${window.i18n.getText('download-completed')} (${date.toLocaleString()})
            </div>
        `;
        
        downloadItem.querySelector('.title').addEventListener('click', () => {
            window.open(`/downloads/${encodeURIComponent(file.filename)}`, '_blank');
        });
        
        this.downloadsContainer.appendChild(downloadItem);
    }

    updateButtonText() {
        let command = ['yt-dlp'];

        const quality = this.videoQuality.value;
        if (quality !== 'none') {
            const formatArg = quality === 'best' 
                ? 'bestvideo+bestaudio/best'
                : `bestvideo[height<=${quality}]+bestaudio/best`;
            command.push(`-f "${formatArg}"`);
        }

        if (this.proxy.value) command.push(`--proxy "${this.proxy.value}"`);
        if (this.useAria2.checked) {
            command.push('--external-downloader "aria2c"');
            command.push('--external-downloader-args "-x 16 -k 1m"');
        }
        if (this.cookieText.value || this.cookieFile.files[0]) {
            command.push('--cookies "cookies.txt"');
        }
        if (this.customArgs.value.trim()) command.push(this.customArgs.value.trim());
        if (this.videoUrl.value) command.push(`"${this.videoUrl.value}"`);

        this.downloadBtn.title = command.join(' ');
        this.downloadBtn.textContent = window.i18n.getText('download-btn');
    }

    appendLog(text) {
        const timestamp = new Date().toLocaleTimeString();
        this.logsContainer.textContent += `[${timestamp}] ${text}\n`;
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }

    clearLogs() {
        this.logsContainer.textContent = '';
    }

    async copyLogs() {
        try {
            await navigator.clipboard.writeText(this.logsContainer.textContent);
            alert(window.i18n.getText('logs-copied'));
        } catch (err) {
            console.error('Failed to copy logs:', err);
        }
    }

    async restartServer() {
        if (!confirm('确定要重启服务器吗？')) return;
        
        try {
            await fetch('/api/restart', {
                method: 'POST'
            });
        } catch (error) {
            alert(window.i18n.getText('restart-failed') + error.message);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new window.I18n();
    window.downloadManager = new DownloadManager();
    window.downloadManager.loadExistingDownloads();
}); 