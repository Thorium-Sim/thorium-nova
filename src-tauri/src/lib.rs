// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod api_manager;

use api_manager::APIManager;
use local_ip_address::local_ip;
use regex::Regex;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Listener, Manager, State};

struct APIManagerState {
    api_manager_mutex: Mutex<APIManager>,
    server_address: Arc<Mutex<Option<String>>>,
}

#[tauri::command]
fn get_server_address(api_manager_state: State<APIManagerState>) -> Result<String, String> {
    let server_address = api_manager_state.server_address.lock().unwrap();
    if let Some(address) = &*server_address {
        Ok(address.clone())
    } else {
        Err("Server address not available".to_string())
    }
}

#[tauri::command]
fn get_ip_address() -> Result<String, String> {
    local_ip()
        .map(|ip| ip.to_string()) // Convert `IpAddr` to `String` on success
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn start_server(api_manager_state: State<APIManagerState>) -> Result<String, String> {
    let am = api_manager_state
        .api_manager_mutex
        .lock()
        .unwrap()
        .start_backend();
    am
}

#[tauri::command]
fn stop_server(api_manager_state: State<APIManagerState>) -> Result<String, String> {
    let am = api_manager_state
        .api_manager_mutex
        .lock()
        .unwrap()
        .terminate_backend();
    am
}

#[tauri::command]
fn restart_server(api_manager_state: State<APIManagerState>) -> Result<String, String> {
    let am = api_manager_state
        .api_manager_mutex
        .lock()
        .unwrap()
        .restart_backend();
    am
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let api_manager = APIManager::new(app_handle.clone());
            let ams = APIManagerState {
                api_manager_mutex: Mutex::new(api_manager),
                server_address: Arc::new(Mutex::new(None)), // Initialize the server address state
            };

            let server_address_state = ams.server_address.clone(); // Clone for the listener

            app_handle.clone().listen("server_output", move |event| {
                let started_pattern = Regex::new(
                    r"Server running on (https?://(?:[a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(?::\d+)?/?)",
                )
                .unwrap();

                if let Some(captures) = started_pattern.captures(event.payload()) {
                    if let Some(url) = captures.get(1) {
                        let server_address = url.as_str();

                        // Store the server address in the shared state
                        let mut state_address = server_address_state.lock().unwrap();
                        *state_address = Some(server_address.to_string());

                        app_handle
                            .emit("backend_started", server_address)
                            .expect("Failed to start backend.");
                    }
                }
            });

            ams.api_manager_mutex
                .lock()
                .unwrap()
                .start_backend()
                .expect("");

            app.manage(ams);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_server_address,
            start_server,
            stop_server,
            restart_server,
            get_ip_address
        ])
        .build(tauri::generate_context!())
        .expect("Error building app");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::Exit { .. } => {
            let am: State<APIManagerState> = app_handle.state();
            am.api_manager_mutex
                .lock()
                .unwrap()
                .terminate_backend()
                .expect("");
        }
        _ => {}
    });
}
