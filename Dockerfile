FROM alpine:latest

WORKDIR /

# 包管理器安装 aria2 和 ffmpeg
RUN	apk add --no-cache aria2 ffmpeg && \
# 下载 ydui 和 yt-dlp(包管理区安装需要额外python环境所以直接下载可执行文件)
aria2c "https://github.com/cap153/ydui/releases/download/v1.0.0/ydui_linux_musl" -o ydui_linux_musl && \
aria2c "https://github.com/yt-dlp/yt-dlp/releases/download/2024.12.23/yt-dlp_linux" -o yt-dlp && \
chmod +x ydui_linux_musl && \
chmod +x yt-dlp && \
mv yt-dlp /usr/local/bin/

CMD ["./ydui_linux_musl"]
