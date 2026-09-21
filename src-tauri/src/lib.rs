use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::{Emitter, Manager, State};

/// File path passed on the command line when the app was launched
/// (e.g. double-click on a .md file in Explorer).
struct StartupFile(Mutex<Option<String>>);

/// Pick the first CLI argument that points at an existing file, resolved against `cwd`.
fn file_from_args(args: &[String], cwd: &Path) -> Option<String> {
    args.iter().skip(1).find_map(|arg| {
        if arg.starts_with('-') {
            return None;
        }
        let path = PathBuf::from(arg);
        let path = if path.is_absolute() { path } else { cwd.join(path) };
        path.is_file().then(|| path.to_string_lossy().into_owned())
    })
}

/// Returns the startup file once; later calls get `None` so a reload doesn't reopen it.
#[tauri::command]
fn get_startup_file(state: State<StartupFile>) -> Option<String> {
    state.0.lock().ok()?.take()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    let cwd = std::env::current_dir().unwrap_or_default();
    let startup_file = file_from_args(&args, &cwd);

    tauri::Builder::default()
        // Must be registered first: a second launch forwards its file to the running window.
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            if let Some(file) = file_from_args(&args, Path::new(&cwd)) {
                let _ = app.emit("open-file", file);
            }
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(StartupFile(Mutex::new(startup_file)))
        .invoke_handler(tauri::generate_handler![get_startup_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
