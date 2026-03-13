use tauri::{
    menu::{CheckMenuItem, CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

const TRAY_GAME_MODE_ID: &str = "game-mode";
const TRAY_GAME_MODE_EVENT: &str = "tray-game-mode-changed";

struct TrayMenuState {
    game_mode_item: CheckMenuItem<tauri::Wry>,
}

#[tauri::command]
fn set_tray_game_mode(state: tauri::State<'_, TrayMenuState>, enabled: bool) -> Result<(), String> {
    state
        .game_mode_item
        .set_checked(enabled)
        .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // #[cfg(target_os = "macos")]
    // {
    //     use cocoa::base::nil;
    //     use cocoa::foundation::NSString;
    //     use objc::runtime::{Class, Object};
    //     use objc::{msg_send, sel, sel_impl};
    //
    //     unsafe {
    //         let process_info: *mut Object = msg_send![Class::get("NSProcessInfo").unwrap(), processInfo];
    //         let reason = NSString::alloc(nil).init_str("Keep app running");
    //         let _activity: *mut Object = msg_send![
    //             process_info,
    //             beginActivityWithOptions: 0x00EFFFFFu64
    //             reason: reason
    //         ];
    //     }
    // }
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![set_tray_game_mode])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let game_mode = CheckMenuItemBuilder::with_id(TRAY_GAME_MODE_ID, "游戏模式")
                .checked(false)
                .build(app)?;
            let menu = MenuBuilder::new(app).items(&[&game_mode, &quit]).build()?;
            app.manage(TrayMenuState {
                game_mode_item: game_mode.clone(),
            });
            let game_mode_item = game_mode.clone();
            let icon = app.default_window_icon().cloned().ok_or_else(|| {
                std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "default window icon is required for tray icon",
                )
            })?;
            let _ = TrayIconBuilder::new()
                .menu(&menu)
                .icon(icon)
                .tooltip("要石 v2.4.0")
                .on_menu_event(move |tray, event| match event.id().as_ref() {
                    TRAY_GAME_MODE_ID => {
                        if let Ok(checked) = game_mode_item.is_checked() {
                            let _ = tray.app_handle().emit(TRAY_GAME_MODE_EVENT, checked);
                        }
                    }
                    "quit" => {
                        let app_handle = tray.app_handle();
                        let _ = app_handle.save_window_state(StateFlags::all());
                        std::process::exit(0);
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button,
                        button_state,
                        ..
                    } => {
                        if button == MouseButton::Left && button_state == MouseButtonState::Up {
                            let app = tray.app_handle();
                            if let Some(webview_window) = app.get_webview_window("main") {
                                let _ = webview_window.show();
                                let _ = webview_window.unminimize();
                                let _ = webview_window.set_focus();
                            }
                        }
                    }
                    _ => (),
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                #[cfg(not(target_os = "macos"))]
                {
                    let _ = window.hide();
                }
                #[cfg(target_os = "macos")]
                {
                    if let Err(primary_err) = tauri::AppHandle::hide(window.app_handle()) {
                        if let Err(fallback_err) = window.hide() {
                            panic!(
                                "failed to hide app on macOS: {primary_err}; fallback window.hide failed: {fallback_err}"
                            );
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
