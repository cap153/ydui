# YDUI

A web interface for yt-dlp built with Rust + Actix Web.

[中文文档](README_zh.md)  
[Video tutorial: Download the demonstration and install under windows(English subtitles can be turned on)](https://www.youtube.com/watch?v=hLKCX9bgsqA&t=72s)  
[Video tutorial: Summary of ydui issues(English subtitles can be turned on)](https://www.youtube.com/watch?v=hLKCX9bgsqA&t=72s)


## Features

- Clean and simple web interface
- Video quality selection (144p to 4K)
- Proxy support (HTTP/SOCKS)
- Cookie import (text or file)
- aria2c multi-threaded download support
- Custom download parameters
- Bilingual support (English/Chinese)
- Online playback of downloaded videos
- Download status and logs display
- View downloaded videos list
- Support for over 1000 video sites ([Full List](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md))

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (must be in system PATH, for downloading videos)
- [ffmpeg](https://www.ffmpeg.org/download.html) (must be in system PATH, for merging video and audio)
- [aria2c](https://github.com/aria2/aria2) (optional, for multi-threaded downloading)

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/cap153/ydui.git
cd ydui
```

2. Run the development server:

```bash
cargo run
```

3. Open http://127.0.0.1:2333 or http://[::]:2333 in your browser

## Build Release Version

```bash
cargo build --release
```

The executable will be available in the `target/release` directory.

## Cookie Setup

For websites requiring login (e.g., YouTube member videos), you need to provide valid cookies. You can:

1. Paste cookie text directly into the input box
2. Upload a file containing cookies
3. Using yt-dlp's --cookies-from-browser option in conjunction with the --cookies option, for example: paste `--cookies-from-browser chrome --cookies cookies.txt` into the Custom Arguments input box(Supported browsers are: brave, chrome, chromium, edge, firefox, opera, safari, vivaldi, whale)

For instructions on how to get cookies, please refer to [yt-dlp Cookie FAQ](https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp)

### Recommended Cookie Export Extensions

- Chrome/Chromium-based browsers: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- Firefox browser: [cookies.txt](https://addons.mozilla.org/zh-CN/firefox/addon/cookies-txt/)
- Microsoft Edge browser: [Export Cookies File](https://microsoftedge.microsoft.com/addons/detail/export-cookies-file/hbglikhfdcfhdfikmocdflffaecbnedo)

## Usage

1. Enter video URL
2. Select desired quality
3. Configure proxy and cookies if needed
4. Optionally enable aria2c downloader
5. Click "Start Download" button
6. View downloaded videos in the left panel
7. Click filename to play downloaded videos

## Project Structure

```
ydui/
├── src/            # Rust source code
├── static/         # Frontend static files
│   ├── css/       # Stylesheets
│   ├── js/        # JavaScript files
│   └── index.html # Main page
├── downloads/      # Download storage directory
└── Cargo.toml     # Project configuration
```

## Tech Stack

- Backend: Rust + Actix Web
- Frontend: Vanilla JavaScript + CSS
- Download Tools: yt-dlp + aria2c

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
