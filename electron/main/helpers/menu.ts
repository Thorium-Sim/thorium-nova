import {
  App,
  BrowserWindow,
  dialog,
  globalShortcut,
  Menu,
  MenuItem,
} from "electron";
import {MenuItemConstructorOptions} from "electron/main";
import {settings} from "./settings";
import {getLoadedUrl} from "./loadedUrl";
// TODO: Implement loading a flight document
function loadFlight(filePath: string) {}
// TODO: Implement opening a new window
function addWindow() {}
export function restoreMenubar(app: App) {
  const recentDocs = settings.get("recentDocs") || [];

  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Open...",
          click: async function (menuItem, browserWindow) {
            if (!browserWindow) return;
            const {canceled, filePaths} = await dialog.showOpenDialog(
              browserWindow,
              {
                filters: [{name: "flight", extensions: ["flight"]}],
              }
            );
            if (canceled) return;
            loadFlight(filePaths[0]);
          },
        },
        {
          id: "recent",
          label: "Open Recent",
          enabled: false,
          submenu: [
            ...recentDocs
              .filter(r => typeof r === "string")
              .map(r => ({
                label: r,
                click: function (
                  _menuItem: any,
                  browserWindow: BrowserWindow | undefined
                ) {
                  if (!browserWindow) return;
                  loadFlight(r);
                },
              })),
            {type: "separator"},
            {
              label: "Clear",
              click: function () {
                app.clearRecentDocuments();
                settings.set("recentDocs", []);
              },
            },
          ],
        },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+Alt+R",
          click: function (menuItem, browserWindow) {
            if (!browserWindow) return;

            browserWindow.reload();
          },
        },

        {
          label: "Kiosk",
          accelerator: "CmdOrCtrl+Alt+K",
          click: function (menuItem, browserWindow) {
            if (!browserWindow) return;

            if (browserWindow.isKiosk()) {
              browserWindow.setKiosk(false);
            } else {
              browserWindow.setKiosk(true);
            }
          },
        },
        {
          label: "Dev Tools",
          accelerator: "CmdOrCtrl+Alt+I",
          click: function (menuItem, browserWindow) {
            if (!browserWindow) return;

            browserWindow.webContents.openDevTools();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut"},
        {label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy"},
        {label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste"},
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectAll",
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {role: "reload"},
        {type: "separator"},
        {role: "togglefullscreen"},
      ],
    },
    {
      role: "window",
      submenu: [{role: "minimize"}],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click() {
            // TODO: Add a learn more link
          },
        },
      ],
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: "about"},
        {type: "separator"},
        {role: "services", submenu: []},
        {type: "separator"},
        {role: "hide"},
        {role: "unhide"},
        {type: "separator"},
        {role: "quit"},
      ],
    });
  }
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.isDestroyed()) {
      w.setMenuBarVisibility(true);
      w.autoHideMenuBar = false;
    }
  });
}
