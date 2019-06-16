const electron = require('electron');
const moment = require('moment');
const {
    remote,
    ipcRenderer
} = electron;

let employeeReturnFunc = null;

const GREETINGS = [
    'Welcome back, %name!',
    'Hello again, %name.',
    'Hope you\'re ready for a good day, %name.',
    'Get enough sleep, %name?',
    'Ah shit, here we go again, %name',
    'Hi, welcome to Smittys! May I take your order?'
];

const GOODBYES = [
    'Don\'t worry, the restaurant will still be here when you get back...',
    'We\'ll miss you!',
    'See ya next time, %name!'
];

$(document).ready(() => {

    ipcRenderer.send('package:get-version');

    ipcRenderer.on('package:get-version', (event, data) => setVersion(data));
    ipcRenderer.on('employee:return', (event, data) => {
        if(!employeeReturnFunc) return false;
        if(data.error) {
            sendAlert(data.error);
            employeeReturnFunc = null;
            return false;
        }
        employeeReturnFunc(data);
    });

    $('#minimize-button').click(() => remote.getCurrentWindow().minimize());

    $('#reload-button').click(() => {});

    $('#exit-button').click(() => remote.app.quit());

    $('.number').click(function() {
        let current = $('#text-bar').html();
        if($(this).prop('id') == 'backspace') {
            if(!current) return false;
            current = current.substring(0, current.length-1);
            $('#text-bar').html(current);
            return false;
        }
        let number = $(this).find('span').html();
        let maxLength = 6;
        if((number+current).length > 6) {
            sendAlert('Too many characters!');
            return false;
        }
        $('#text-bar').html(current+number);
    });


    $('.index-btn[data-name="clock"]').click(function() {
        let extra = $(this).data('extra');
        employeeReturnFunc = (employee) => clock(employee, extra);
        let id = parseInt($('#text-bar').html());
        ipcRenderer.send('employee:get-with-id', id);
    });

    function clock(employee, extra) {
        console.log(employee);
        const arr = extra == 'in' ? GREETINGS : GOODBYES;
        let response = arr[Math.floor(Math.random() * arr.length)];
        sendAlert(response.replace('%name', employee.first_name));
    }

    function sendAlert(text) {
        var n = noty({
            text: text,
            layout: 'topRight',
            timeout: 5000,
            theme: 'cryogen'
        });
    }

    function setVersion(version) {
        $('#version').html('Version: '+version+' Made by Cody Thompson');
    }

    function updateDateAndTime() {
        let date = moment();
        $('#date').html(date.format('dddd, MMMM DD, YYYY'));
        $('#time').html(date.format('h:mm:ss A'));
    }

    setInterval(updateDateAndTime, 1000);

});
