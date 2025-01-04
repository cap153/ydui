/*
 * Copyright (c) 2025 cap153 <cap15369@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use actix_web::{web, App, HttpResponse, HttpServer, Result, middleware::Logger};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use env_logger;
use tokio::process::Command;
use tokio::io::{BufReader, AsyncBufReadExt};
use tokio::sync::RwLock;
use uuid::Uuid;
use std::collections::HashMap;
use std::sync::Arc;
use std::fs;
use std::collections::HashSet;
use rust_embed::RustEmbed;
use actix_files;
use serde_json::json;
use std::process::Stdio;
use std::env;
use std::process::Command as StdCommand;

const PORT: u16 = 2333;
const DOWNLOADS_DIR: &str = "downloads";

#[derive(Debug, Clone, Serialize)]
struct DownloadStatus {
    progress: f32,
    status: String,
    filename: Option<String>,
    log: Vec<String>,
}

impl DownloadStatus {
    fn new() -> Self {
        Self {
            progress: 0.0,
            status: "准备下载".to_string(),
            filename: None,
            log: Vec::new(),
        }
    }

    fn add_log(&mut self, line: String) {
        println!("[yt-dlp] {}", &line);
        self.log.push(line);
    }
}

struct AppState {
    downloads: RwLock<HashMap<String, DownloadStatus>>,
}

#[derive(Deserialize, Debug)]
struct DownloadRequest {
    url: String,
    proxy: Option<String>,
    cookie_text: Option<String>,
    use_aria2: bool,
    quality: String,
    custom_args: Option<String>,
}

#[derive(Serialize)]
struct DownloadResponse {
    id: String,
    message: String,
}

#[derive(Serialize)]
struct FileInfo {
    filename: String,
    created_time: u64,
}

async fn get_status(id: web::Path<String>, data: web::Data<Arc<AppState>>) -> Result<HttpResponse> {
    let downloads = data.downloads.read().await;
    Ok(match downloads.get(id.as_str()) {
        Some(status) => HttpResponse::Ok().json(json!({
            "progress": status.progress,
            "status": status.status,
            "filename": status.filename,
            "log": status.log.join("\n")
        })),
        None => HttpResponse::NotFound().finish()
    })
}

fn build_yt_dlp_command(
    req: &DownloadRequest,
    download_path: &str,
    cookie_path: &std::path::Path,
) -> (Command, Vec<String>) {
    let cmd = Command::new("yt-dlp");
    let mut args = vec![
        "--encoding".to_string(),
        "utf8".to_string(),
    ];

    // 添加画质参数
    if req.quality != "none" {
        let format_arg = if req.quality == "best" {
            "bestvideo+bestaudio/best".to_string()
        } else {
            format!("bestvideo[height<={}]+bestaudio/best", req.quality)
        };
        args.extend_from_slice(&["-f".to_string(), format_arg]);
    }

    // 添加下载路径
    args.extend_from_slice(&["-P".to_string(), download_path.to_string()]);

    // 添加 aria2 参数
    if req.use_aria2 {
        args.extend_from_slice(&[
            "--external-downloader".to_string(),
            "aria2c".to_string(),
            "--external-downloader-args".to_string(),
            "-x 16 -k 1m".to_string(),
        ]);
    }

    // 添加 cookie
    if cookie_path.exists() {
        args.extend_from_slice(&[
            "--cookies".to_string(),
            cookie_path.to_string_lossy().into_owned(),
        ]);
    }

    // 添加代理
    if let Some(proxy) = &req.proxy {
        args.extend_from_slice(&["--proxy".to_string(), proxy.clone()]);
    }

    // 添加自定义参数
    if let Some(custom_args) = &req.custom_args {
        args.extend(custom_args.split_whitespace().map(|s| s.trim().to_string()));
    }

    // 添加 URL
    args.push(req.url.trim().to_string());

    (cmd, args)
}

async fn start_download(
    req: web::Json<DownloadRequest>,
    data: web::Data<Arc<AppState>>,
) -> Result<HttpResponse> {
    println!("\n开始下载: {}", req.url);
    
    let download_id = Uuid::new_v4().to_string();
    let download_path = std::env::current_dir()?.join(DOWNLOADS_DIR);
    let cookie_path = std::env::current_dir()?.join("cookies.txt");

    tokio::fs::create_dir_all(&download_path).await?;

    // 更新 cookie
    if let Some(cookie_text) = &req.cookie_text {
        if !cookie_text.is_empty() {
            tokio::fs::write(&cookie_path, cookie_text).await?;
        }
    }

    // 初始化下载状态
    data.downloads.write().await.insert(download_id.clone(), DownloadStatus::new());

    let (mut cmd, args) = build_yt_dlp_command(&req, DOWNLOADS_DIR, &cookie_path);
    println!("\n执行命令: yt-dlp {}", args.join(" "));

    cmd.args(&args)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    let data_clone = data.clone();
    let download_id_clone = download_id.clone();

    tokio::spawn(async move {
        handle_download_process(cmd, download_path, data_clone, download_id_clone).await;
    });

    Ok(HttpResponse::Ok().json(DownloadResponse {
        id: download_id,
        message: "下载任务已开始".to_string(),
    }))
}

async fn handle_download_process(
    mut cmd: Command,
    download_path: std::path::PathBuf,
    data: web::Data<Arc<AppState>>,
    download_id: String,
) {
    let old_files = fs::read_dir(&download_path)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter_map(|e| e.file_name().into_string().ok())
                .collect::<HashSet<String>>()
        })
        .unwrap_or_default();

    match cmd.spawn() {
        Ok(mut child) => {
            let stdout = child.stdout.take().expect("Failed to capture stdout");
            let stderr = child.stderr.take().expect("Failed to capture stderr");

            let mut stdout_reader = BufReader::new(stdout).lines();
            let mut stderr_reader = BufReader::new(stderr).lines();

            let data_stdout = data.clone();
            let data_stderr = data.clone();
            let download_id_stdout = download_id.clone();
            let download_id_stderr = download_id.clone();

            // 启动输出处理任务
            let stdout_handle = tokio::spawn(async move {
                while let Ok(Some(line)) = stdout_reader.next_line().await {
                    let mut downloads = data_stdout.downloads.write().await;
                    if let Some(status) = downloads.get_mut(&download_id_stdout) {
                        status.add_log(line);
                    }
                }
            });

            let stderr_handle = tokio::spawn(async move {
                while let Ok(Some(line)) = stderr_reader.next_line().await {
                    let mut downloads = data_stderr.downloads.write().await;
                    if let Some(status) = downloads.get_mut(&download_id_stderr) {
                        status.add_log(format!("Error: {}", line));
                    }
                }
            });

            // 等待所有任务完成
            let _ = tokio::join!(stdout_handle, stderr_handle);

            // 处理下载结果
            if let Ok(status) = child.wait().await {
                let mut downloads = data.downloads.write().await;
                if let Some(download_status) = downloads.get_mut(&download_id) {
                    if status.success() {
                        // 查找新文件
                        if let Ok(entries) = fs::read_dir(&download_path) {
                            for entry in entries.filter_map(Result::ok) {
                                if let Some(name) = entry.file_name().to_str() {
                                    if !old_files.contains(name) {
                                        download_status.filename = Some(name.to_string());
                                        break;
                                    }
                                }
                            }
                        }
                        download_status.status = "下载完成".to_string();
                        download_status.progress = 100.0;
                    } else {
                        download_status.status = "下载失败".to_string();
                    }
                }
            }
        }
        Err(e) => {
            let mut downloads = data.downloads.write().await;
            if let Some(status) = downloads.get_mut(&download_id) {
                status.status = format!("启动失败: {}", e);
            }
        }
    }
}

#[derive(RustEmbed)]
#[folder = "static/"]
struct Asset;

async fn handle_static_files(path: web::Path<String>) -> HttpResponse {
    let path = if path.is_empty() { "index.html" } else { &path };
    
    Asset::get(path)
        .map(|content| {
            HttpResponse::Ok()
                .content_type(mime_guess::from_path(path).first_or_octet_stream().as_ref())
                .body(content.data.to_vec())
        })
        .unwrap_or_else(|| HttpResponse::NotFound().body("404 Not Found"))
}

async fn list_downloads() -> Result<HttpResponse> {
    let download_path = std::env::current_dir()?.join(DOWNLOADS_DIR);
    let mut files = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&download_path) {
        for entry in entries.filter_map(Result::ok) {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    if let (Some(filename), Ok(created)) = (
                        entry.file_name().to_str().map(String::from),
                        metadata.created()
                    ) {
                        files.push(FileInfo {
                            filename,
                            created_time: created
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs(),
                        });
                    }
                }
            }
        }
    }

    files.sort_by(|a, b| b.created_time.cmp(&a.created_time));
    Ok(HttpResponse::Ok().json(files))
}

async fn restart_server() -> Result<HttpResponse> {
    // 获取当前可执行文件路径
    let current_exe = std::env::current_exe()?;
    
    // 检查是否在 Docker 环境中运行
    let in_docker = std::path::Path::new("/.dockerenv").exists();
    
    if in_docker {
        // Docker 环境下使用 kill -1 发送 SIGHUP 信号
        StdCommand::new("sh")
            .arg("-c")
            .arg("kill -1 1")  // 发送 SIGHUP 到 PID 1
            .spawn()?;
    } else {
        // 非 Docker 环境下使用原来的重启方式
        StdCommand::new("sh")
            .arg("-c")
            .arg(format!(
                "pkill ydui; {} &",
                current_exe.display()
            ))
            .spawn()?;
    }

    Ok(HttpResponse::Ok().finish())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let downloads_dir = std::env::current_dir()?.join(DOWNLOADS_DIR);
    tokio::fs::create_dir_all(&downloads_dir).await?;

    println!("服务器启动在:");

    let is_windows = env::consts::OS == "windows";
    
    let app_state = Arc::new(AppState {
        downloads: RwLock::new(HashMap::new()),
    });

    let server = HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .wrap(Logger::default())
            .wrap(Cors::default()
                .allow_any_origin()
                .allow_any_method()
                .allow_any_header()
                .max_age(3600))
            .service(
                web::scope("/api")
                    .route("/download", web::post().to(start_download))
                    .route("/status/{id}", web::get().to(get_status))
                    .route("/list", web::get().to(list_downloads))
                    .route("/restart", web::post().to(restart_server))
            )
            .service(
                actix_files::Files::new("/downloads", DOWNLOADS_DIR)
                    .show_files_listing()
                    .use_last_modified(true)
            )
            .route("/{filename:.*}", web::get().to(handle_static_files))
    });

    let server = if is_windows {
        println!("  IPv4: http://127.0.0.1:{}", PORT);
        server.bind(format!("127.0.0.1:{}", PORT))?
    } else {
        println!("  IPv4/IPv6: http://[::]:{}", PORT);
        server.bind(format!("[::]:{}", PORT))?
    };

    println!("下载目录: {}", downloads_dir.display());

    server.run().await
}