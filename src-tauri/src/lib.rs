use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconEvent, TrayIconBuilder, MouseButton, MouseButtonState},
    Manager, 
    WindowEvent,
};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&quit]).build()?;
            let _ = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("wolfx-api-viewer")
                .on_menu_event(move |tray, event| match event.id().as_ref() {
                    "quit" => {
                        let app_handle = tray.app_handle();
                        let _ = app_handle.save_window_state(StateFlags::all());
                        std::process::exit(0);
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click { button, button_state, .. } => {
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
                    }
                })
                .build(app)?;
            let main_window = app.get_webview_window("main").unwrap();
            let main_window_clone = main_window.clone();
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = main_window_clone.hide();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
