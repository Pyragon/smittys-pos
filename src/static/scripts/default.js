const electron = require("electron");
const moment = require("moment");
const {
    remote,
    ipcRenderer
} = electron;

let employeeReturnFunc = null;
let n = null;

const GREETINGS = [
    "Welcome back, %name!",
    "Hello again, %name.",
    "Hope you're ready for a good day, %name.",
    "Get enough sleep, %name?",
    "Ah shit, here we go again.",
    "Hi, welcome to Smittys! May I take your order?"
];

const GOODBYES = [
    "Don't worry, the restaurant will still be here when you get back...",
    "We'll miss you!",
    "See ya next time, %name!"
];

let serverId = -1;

$(document).ready(() => {
    $("body").keydown(e => {
        let key = e.which;
        let current = $("#text-bar").html();
        if (key == 8) {
            if (!current) return false;
            current = current.substring(0, current.length - 1);
            $("#text-bar").html(current);
        } else if (key >= 96 && key <= 105) {
            let number = key - 96;
            if ((number + current).length > 6)
                return false;
            $("#text-bar").html(current + number);
        }
        return false;
    });

    ipcRenderer.send("package:get-version");

    ipcRenderer.on("menu:click-option", (event, data) => clickMenuOption(data));
    ipcRenderer.on("package:get-version", (event, data) => setVersion(data));
    ipcRenderer.on("employee:return", (event, data) => {
        if (!employeeReturnFunc) return false;
        if (data.error) {
            sendAlert(data.error);
            employeeReturnFunc = null;
            return false;
        }
        employeeReturnFunc(data);
    });
    ipcRenderer.on("menu:open", (event, data) => {
        n = noty({
            text: data.title,
            type: "confirm",
            layout: "center",
            dismissQueue: false,
            template: data.html,
            theme: "cryogen",
            buttons: [{
                addClass: "btn btn-danger",
                text: "Cancel",
                onClick: closeNoty
            }]
        });
        sendAlert(data.rolePriveliges);
    });

    $("#minimize-button").click(() => remote.getCurrentWindow().minimize());

    $("#reload-button").click(() => {});

    $("#exit-button").click(() => remote.app.quit());

    $(".number").click(function () {
        if (n) return false;
        let current = $("#text-bar").html();
        if ($(this).prop("id") == "backspace") {
            if (!current) return false;
            current = current.substring(0, current.length - 1);
            $("#text-bar").html(current);
            return false;
        }
        let number = $(this)
            .find("span")
            .html();
        if ((number + current).length > 6) return false;
        $("#text-bar").html(current + number);
    });

    $('.index-btn[data-name="function"]').click(() => {
        if (n) return false;
        let val = $("#text-bar").html();
        if (!val) {
            sendAlert("Please enter your ID or swipe your card first.");
            return false;
        }
        let id = parseInt(val);
        openMenu("function", "Functions", id);
    });

    $('.index-btn[data-name="clock"]').click(function () {
        if (n) return false;
        let extra = $(this).data("extra");
        let val = $("#text-bar").html();
        if (!val) {
            sendAlert("Please enter your ID or swipe your card first.");
            return false;
        }
        let id = parseInt(val);
        employeeReturnFunc = employee => clock(employee, extra);
        ipcRenderer.send("employee:get-with-id", id);
    });

    $('.index-btn[data-name="table"]').click(function() {
        if (n) return false;
        let val = $("#text-bar").html();
        if (!val) {
            sendAlert("Please enter your ID or swipe your card first.");
            return false;
        }
        let id = parseInt(val);
        openMenu("table", "Table", id);
    });

    function openMenu(menu, title, id) {
        ipcRenderer.send("menu:open", {
            menu,
            title,
            id
        });
    }

    function clickMenuOption(command) {
        console.log(command);
        window[command]();
    }

    function openManagerMenu() {
        openMenu('manager', 'Manager Menu', -1);
    }

    function clock(employee, extra) {
        const arr = extra == "in" ? GREETINGS : GOODBYES;
        let response = arr[Math.floor(Math.random() * arr.length)];
        sendAlert(response.replace("%name", employee.first_name));
    }

    function sendAlert(text) {
        var n = noty({
            text: text,
            layout: "topRight",
            timeout: 5000,
            theme: "cryogen"
        });
    }

    function setVersion(version) {
        $("#version").html("Version: " + version + " Made by Cody Thompson");
    }

    function updateDateAndTime() {
        let date = moment();
        $("#date").html(date.format("dddd, MMMM DD, YYYY"));
        $("#time").html(date.format("h:mm:ss A"));
    }

    function handleTab(e) {
        if (e.keyCode === 9) document.body.classList.add("user-is-tabbing");
    }

    function handleClick() {
        document.body.classList.remove("user-is-tabbing");
    }

    function closeNoty($noty) {
        $noty.close();
        if (n) n = null;
    }

    $(document).click(function (e) {
        var target = e.target;
        if (n == null) return;
        var id = n.options.id;
        if ($(e.target).closest("#" + id).length) {} else {
            n.close();
            n = null;
        }
    });

    setInterval(updateDateAndTime, 1000);
    window.addEventListener("keydown", handleTab);
    window.addEventListener("mousedown", handleClick);
});
