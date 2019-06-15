const electron = require('electron');
const moment = require('moment');
const {
    remote,
    ipcRenderer
} = electron;

$(document).ready(() => {

    ipcRenderer.send('package:get-version');

    ipcRenderer.on('package:get-version', (event, data) => setVersion(data));

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
