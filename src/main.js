const electron = require('electron');
const url = require('url');
const path = require('path');
const setupPug = require('electron-pug');
const windowState = require('electron-window-state');
const _mysql = require(__dirname+'/mysql.js');
const {
    openProcessManager
} = require('electron-process-manager');
require('electron-reload')(__dirname, {
    electron: require('$(__dirname)/../../node_modules/electron')
});
require('electron-debug')({
    showDevTools: true,
    enabled: true
});
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    session,
    protocol,
    Notification //jshint ignore:line
} = electron;
var defaults = require(__dirname + '/defaults.js')(app);
const Store = require('electron-store');
const store = new Store({
    defaults
});
const pkg = require(__dirname+'/../package.json');
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

var pos = (function() {

    var window;
    let mysql;

    function createWindow() {
        try {
            let mainWindowState = windowState({
                width: 1024,
                height: 768
            });
            try {
                window = new BrowserWindow({
                    webPreferences: {
                        nodeIntegration: true
                    },
                    x: mainWindowState.x,
                    y: mainWindowState.y,
                    resizable: false,
                    frame: false,
                    backgroundThrottling: false,
                    thickFrame: true,
                    transparent: true,
                    title: 'Smitty\'s POS'
                });
            } catch(e) {
                console.log(e);
            }
            window.loadURL(url.format({
                pathname: path.join(__dirname, '/static/index.pug'),
                protocol: 'file:',
                slashes: true
            }));
            window.on('closed', () => window = null);
            // window.on('restore', () => window.setFullScreen(true));
            mainWindowState.manage(window);
            Menu.setApplicationMenu(null);
        } catch(e) {
            console.log(e);
        }
    }

    function sendMessage(opcode, data) {
        window.webContents.send(opcode, data);
    }

    function registerNotifications() {
        ipcMain.on('package:get-version', () => sendMessage('package:get-version', pkg.version));
    }

    function startElectron() {
        app.on('ready', () => {
            app.setAppUserModelId('Smittys.POS');
            setupPug({
                pretty: true
            }, {});
            createWindow();
        });

        app.on('window-all-closed', () => {
            if(process.platform !== 'darwin') app.quit();
        });

        app.on('activate', () => {
            if(window == null) createWindow();
        });
    }

    return {

        init: function() {
            mysql = _mysql(store);
            mysql.start();
            startElectron();
            registerNotifications();
        }

    }

})();

pos.init();
