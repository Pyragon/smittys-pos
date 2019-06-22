const electron = require('electron');
const url = require('url');
const path = require('path');
const pug = require('pug');
const setupPug = require('electron-pug');
const windowState = require('electron-window-state');
const _mysql = require(__dirname + '/mysql.js');
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
    Notification
} = electron;
var defaults = require(__dirname + '/defaults.js')(app);
const Store = require('electron-store');
const store = new Store({
    defaults
});
const pkg = require(__dirname + '/../package.json');
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

var pos = (function () {

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
                    title: 'Smitty\'s POS',
                    icon: __dirname + '/static/images/icon.png'
                });
            } catch (e) {
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
        } catch (e) {
            console.log(e);
        }
    }

    function renderFile(data) {
        let html = pug.compileFile(data.path);
        if (!html) return false;
        sendMessage('pug:rendered-file', {
            'html': html(data)
        });
    }

    function clickMenuOption(option) {
        sendMessage("menu:click-option", option);
    }

    async function openMenu(data) {
        let id = data.id;
        try {
            let employee;
            let rolePriveliges = 0;
            if(id >= 0) {
                let employee = await getEmployee(id);
                    if (!employee) return false;
                    employee = employee[0];
                    let role = await getRole(employee.default_role);
                    if (role)
                        rolePriveliges = role[0].privilege;
            }
            let menuData = require(path.join(__dirname, 'static', 'menus', data.menu + '_menu.json'));
            if (!menuData) return false;
            menuData = filter(menuData, d => {
                let required = d.requires || 0;
                if (typeof d === 'object') return rolePriveliges >= required;
                return true;
            });
            let html = pug.compileFile(path.join(__dirname, 'static', 'menus', 'menu.pug'), {
                data: menuData
            });
            sendMessage('menu:open', {
                'html': html({
                    data: menuData
                }),
                'title': data.title,
                rolePriveliges
            });
        } catch (err) {
            console.error(err);
        }
    }

    function sendMessage(opcode, data) {
        window.webContents.send(opcode, data);
    }

    function registerNotifications() {
        ipcMain.on('package:get-version', () => sendMessage('package:get-version', pkg.version));
        ipcMain.on('employee:get-with-id', (event, data) => returnEmployee(data));
        ipcMain.on('menu:open', (event, data) => openMenu(data));
        ipcMain.on('menu:click-option', (event, data) => sendMessage('menu:click-option', data));
        ipcMain.on('pug:render-file', (event, data) => openMenu(data));
    }

    function returnEmployee(id) {
        getEmployee(id).then((results) => {
            sendMessage('employee:return', results[0]);
        }).catch((error) => sendMessage('employee:return', {
            'error': 'Unable to find employee with that ID.'
        }));
    }

    function getEmployee(id) {
        return mysql.select('employees', 'WHERE id = ?', null, [id]);
    }

    function getRole(id) {
        return mysql.select('roles', 'WHERE id = ?', null, [id]);
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
            if (process.platform !== 'darwin') app.quit();
        });

        app.on('activate', () => {
            if (window == null) createWindow();
        });
    }

    function filter(obj, predicate) {
        var result = {},
            key;

        for (key in obj) {
            if (obj.hasOwnProperty(key) && predicate(obj[key])) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    return {

        init: function () {
            mysql = _mysql(store);
            mysql.start();
            startElectron();
            registerNotifications();
        }

    };

})();

pos.init();
