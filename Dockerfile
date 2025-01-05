# 第一阶段：下载文件
FROM alpine:latest as downloader

# 安装下载工具和依赖
RUN apk add --no-cache curl jq

# 下载最新版本的文件
RUN LATEST_YDUI=$(curl -s https://api.github.com/repos/cap153/ydui/releases/latest | jq -r '.assets[] | select(.name | contains("musl")) | .browser_download_url') && \
    LATEST_YTDLP=$(curl -s https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest | jq -r '.assets[] | select(.name == "yt-dlp_linux") | .browser_download_url') && \
    curl -L "$LATEST_YDUI" -o ydui_linux_musl && \
    curl -L "$LATEST_YTDLP" -o yt-dlp && \
    chmod +x ydui_linux_musl yt-dlp

# 第二阶段：构建最终镜像
FROM alpine:latest

# 安装运行必需的包和 tini
# tini 是一个轻量级的初始化系统和进程收割器
# - 作为 PID 1 运行，处理僵尸进程
# - 正确转发信号给应用程序
# - 在应用程序退出时自动重启
# - 确保容器在应用重启时不会退出
RUN apk add --no-cache ffmpeg aria2 tini

# 从第一阶段复制文件
COPY --from=downloader /ydui_linux_musl /ydui_linux_musl
COPY --from=downloader /yt-dlp /usr/local/bin/yt-dlp

# 设置工作目录
WORKDIR /

# 使用 tini 作为入口点
# tini 将作为 PID 1 运行，管理 ydui_linux_musl 进程
# 当 ydui_linux_musl 重启时，容器不会退出
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./ydui_linux_musl"]
