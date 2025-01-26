use std::borrow::BorrowMut;
use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use std::thread;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

pub struct APIManager {
    app: AppHandle,
    cmd: Command,
    child: Option<Child>,
    // api_process: Option<GroupChild>,
}

impl APIManager {
    pub fn new(app: tauri::AppHandle) -> APIManager {
        let t = app.shell().sidecar("thoriumNovaServer").unwrap();

        APIManager {
            app,
            cmd: t.into(),
            child: None,
        }
    }

    pub fn start_backend(&mut self) -> Result<String, String> {
        match self.child.borrow_mut() {
            Some(_) => {
                let info = "Starting Server";
                println!("{}", &info);
                Ok(info.into())
            }
            None => {
                let child = self
                    .cmd
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .spawn();

                match child {
                    Ok(v) => {
                        self.child = Some(v);
                        let stdout = self.child.as_mut().unwrap().stdout.take().unwrap();
                        let app_handle = self.app.clone();
                        thread::spawn(move || {
                            let reader = BufReader::new(stdout);
                            for line in reader.lines() {
                                if let Ok(line) = line {
                                    app_handle.emit("server_output", line).unwrap();
                                }
                            }
                        });

                        let info = "Server start successfully";
                        println!("{}", &info);
                        Ok(info.into())
                    }
                    Err(_) => {
                        let info = "Server start failed";
                        println!("{}", &info);
                        Err(info.into())
                    }
                }
            }
        }
    }

    pub fn terminate_backend(&mut self) -> Result<String, String> {
        match self.child.borrow_mut() {
            Some(child) => {
                // child.wait().expect("Some error happened when killing child process");
                child
                    .kill()
                    .expect("Some error happened when killing child process");
                self.child = None;
                let info = "Server Terminated";
                println!("{}", &info);
                Ok(info.into())
            }
            _ => {
                let info = "Attempt to terminate server failed: Server not running";
                println!("{}", &info);
                Ok(info.into())
            }
        }
    }

    pub fn restart_backend(&mut self) -> Result<String, String> {
        let terminate_result = self.terminate_backend();
        match terminate_result {
            Ok(_) => {
                println!("Terminanted Server");
                match self.start_backend() {
                    Ok(_) => {
                        let info = "Successfully restarted the server";
                        println!("{}", &info);
                        Ok(info.into())
                    }
                    Err(e) => {
                        println!("{}", &e);
                        return Err(e.into());
                    }
                }
            }
            Err(e) => {
                println!("{}", &e);
                return Err(e);
            }
        }
    }
}
