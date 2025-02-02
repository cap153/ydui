# YDUI

一个使用 Rust + Actix Web 开发的 yt-dlp Web 界面。

[English](README.md)  
[视频教程：下载演示并在windows下安装](https://www.bilibili.com/video/BV1Gs6mYYEXe?vd_source=670195c083a81e0e203115ecef2b87a1&spm_id_from=333.788.videopod.sections)  
[视频教程：ydui问题总结](https://www.bilibili.com/video/BV1Ay6mYSEe9?vd_source=670195c083a81e0e203115ecef2b87a1&spm_id_from=333.788.videopod.sections)

![中文界面](static/中文界面.png)

## 功能特点

- 简洁的 Web 界面
- 支持视频画质选择（从 144p 到 4K）
- 支持代理设置（HTTP/SOCKS）
- 支持 Cookie 导入（文本或文件）
- 支持 aria2c 多线程下载
- 支持自定义下载参数
- 支持中英文切换
- 支持在线播放已下载视频
- 显示下载状态和日志
- 查看已下载视频列表
- 支持超过 1000 个视频网站（[完整列表](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)）

## 环境要求

- [Rust](https://www.rust-lang.org/tools/install) (最新稳定版)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (需要在系统 PATH 中，用于下载视频)
- [ffmpeg](https://www.ffmpeg.org/download.html) (需要在系统 PATH 中，用于合并下载好的音频和视频)
- [aria2c](https://github.com/aria2/aria2) (可选，用于多线程下载)

## 快速开始

1. 克隆仓库：

```bash
git clone https://github.com/cap153/ydui.git
cd ydui
```

2. 运行开发服务器：

```bash
cargo run
```

3. 在浏览器中打开 http://127.0.0.1:2333 或 http://[::]:2333

## 构建发布版本

```bash
cargo build --release
```

构建完成后，可执行文件将位于 `target/release` 目录中。

## Docker 部署

### 方式一：从 Docker Hub 拉取
```bash
sudo docker run -itd \
  --name ydui \
  --restart=always \
  --net=host \
  -v /你的下载目录:/downloads \
  cap153/ydui:latest
```

### 方式二：从源码构建
1. 构建镜像：
```bash
git clone https://github.com/cap153/ydui.git
cd ydui
docker build -t ydui .
```

2. 运行容器：
```bash
docker-compose up -d
```

或者不使用 docker-compose：
```bash
docker run -itd \
  --name ydui \
  --restart=always \
  -p 2333:2333 \
  -v /你的下载目录:/downloads \
  ydui
```

注意：
- 将 `/你的下载目录` 替换为实际的下载目录路径
- 网络模式：
  1. `--net=host`：使用主机网络，便于使用局域网代理，通过 2333 端口访问
  2. 端口映射 (`-p 2333:2333`)：使用桥接网络，通过映射端口访问
  3. `macvlan`：高级网络模式，可用但需要额外配置
- 方式一使用主机网络以便于代理访问
- 方式二使用端口映射以获得更好的容器隔离性

## Cookie 设置

对于需要登录的网站（如 YouTube 会员视频），你需要提供有效的 cookie。你可以：

1. 将`cookies.txt`文件放置在项目根目录或可执行文件所在的目录中
2. 将 yt-dlp 的 --cookies-from-browser 选项与 --cookies 选项结合使用，例如：将 `--cookies-from-browser chrome --cookies cookies.txt` 粘贴到自定义参数输入框中（支持的浏览器有：brave、chrome、chromium、edge、firefox、opera、safari、vivaldi、whale）
3. 直接粘贴 cookie 文本到输入框（**如果当前设备有公网IP，不建议使用此方法**）
4. 上传包含 cookie 的文件（**如果当前设备有公网IP，不建议使用此方法**）

获取 cookie 的方法请参考 [yt-dlp Cookie FAQ](https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp)

### 推荐的 Cookie 导出插件

- Chrome/Chromium 系列浏览器：[Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- Firefox 浏览器：[cookies.txt](https://addons.mozilla.org/zh-CN/firefox/addon/cookies-txt/)
- Microsoft Edge 浏览器：[Export Cookies File](https://microsoftedge.microsoft.com/addons/detail/export-cookies-file/hbglikhfdcfhdfikmocdflffaecbnedo)

## 使用说明

1. 输入视频链接
2. 选择所需画质
3. 根据需要配置代理和 Cookie
4. 可选择是否启用 aria2c 下载器
5. 点击"开始下载"按钮
6. 在左侧面板查看已下载的视频
7. 下载完成后可直接点击文件名在线播放

## 目录结构

```
ydui/
├── src/            # Rust 源代码
├── static/         # 前端静态文件
│   ├── css/       # 样式文件
│   ├── js/        # JavaScript 文件
│   └── index.html # 主页面
├── downloads/      # 下载文件存储目录
└── Cargo.toml     # 项目配置文件
```

## 技术栈

- 后端：Rust + Actix Web
- 前端：原生 JavaScript + CSS
- 下载工具：yt-dlp + aria2c

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

