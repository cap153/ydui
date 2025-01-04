# 第一阶段：下载文件
FROM alpine:latest as downloader

# 安装下载工具和依赖
RUN apk add --no-cache curl jq

# 下载所有需要的可执行文件
RUN LATEST_YDUI=$(curl -s https://api.github.com/repos/cap153/ydui/releases/latest | jq -r '.assets[] | select(.name | contains("musl")) | .browser_download_url') && \
    LATEST_YTDLP=$(curl -s https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest | jq -r '.assets[] | select(.name == "yt-dlp_linux") | .browser_download_url') && \
    LATEST_ARIA2=$(curl -s https://api.github.com/repos/q3aql/aria2-static-builds/releases/latest | jq -r '.assets[] | select(.name | contains("linux-gnu-64bit-build1.tar.bz2")) | .browser_download_url') && \
    LATEST_FFMPEG=$(curl -s https://api.github.com/repos/eugeneware/ffmpeg-static/releases/latest | jq -r '.assets[] | select(.name == "linux-x64") | .browser_download_url') && \
    # 下载 ydui, yt-dlp
    curl -L "$LATEST_YDUI" -o ydui_linux_musl && \
    curl -L "$LATEST_YTDLP" -o yt-dlp && \
    # 下载 aria2c 静态编译版本
    curl -L "$LATEST_ARIA2" -o aria2.tar.bz2 && \
    tar -xf aria2.tar.bz2 && \
    mv aria2-*/aria2c . && \
    # 下载 ffmpeg 静态编译版本
    curl -L "$LATEST_FFMPEG" -o ffmpeg && \
    # 设置执行权限
    chmod +x ydui_linux_musl yt-dlp aria2c ffmpeg

# 第二阶段：构建最终镜像
FROM alpine:latest

# 从第一阶段复制所有可执行文件
COPY --from=downloader /ydui_linux_musl /ydui_linux_musl
COPY --from=downloader /yt-dlp /usr/local/bin/yt-dlp
COPY --from=downloader /aria2c /usr/local/bin/aria2c
COPY --from=downloader /ffmpeg /usr/local/bin/ffmpeg

# 设置工作目录
WORKDIR /

CMD ["./ydui_linux_musl"]
