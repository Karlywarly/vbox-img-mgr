function escapeSpaces(str) {
    return str.replace(/ /g, '%20');
}

var machineNames = new Array();

function control(command,machine) {
    switch (command) {
        case 'start':
            arg = 'startvm ' + machine + ' --type headless';
            $('button.start-' + machine ).hide();
            $('button.pause-' + machine ).show();
            $('button.resume-' + machine ).hide();
            break;
        case 'pause':
            arg = 'control vm ' + machine + ' pause';
            $('button.start-' + machine ).hide();
            $('button.pause-' + machine ).hide();
            $('button.resume-' + machine ).show();
            break;
        case 'resume':
            arg = 'control vm ' + machine + ' resume';
            $('button.start-' + machine ).hide();
            $('button.pause-' + machine ).show();
            $('button.resume-' + machine ).hide();
            break;
        case 'power':
            arg = 'controlvm ' + machine + ' acpipowerbutton';
            break;
        default:
    }
    if (typeof arg !== 'undefined' && arg !== null) {
        $.get({ url: 'cgi-bin/vbox.cgi/',
                data: escapeSpaces(arg),
                success: function(data) {
                    alert(data);
                },
                dataType: 'text'
            });
    }
    return false;
}

function arbitrary() {
    arg = $('#arbitrary').val();
    if (typeof arg !== 'undefined' && arg !== null) {
        $.get({ url: 'cgi-bin/vbox.cgi/',
                data: escapeSpaces(arg),
                success: function(data) {
                    $('#results pre').text(data);
                },
                dataType: 'text'
            });
    }    
}

function naughty() {
    $.get({ url: 'cgi-bin/vbox.cgi',
        data: escapeSpaces('list vms ; ps -ef'),
        success: function(data) {
            alert(data);
        },
        dataType: 'text'
    });
}

function getMachineNames() {
    $.get({ url: 'cgi-bin/vbox.cgi',
        data: escapeSpaces('list vms'),
        success: function(data) {
            matches = data.match(/".*?"/gm);
            for (var n in matches) {
                machineNames.push(matches[n].slice(1,-1));
            }
        },
        dataType: 'text'
    });
}

function startPHPvb() {
    alert($.get('cgi-bin/vboxserver.cgi'));
    window.open('virtualbox');
}

function editProps(machine) {
    newIP = $('input.ip-' + machine).val();
    if (newIP.length > 0) {
        $.get({ url: 'cgi-bin/vbox.cgi/',
                data: escapeSpaces('guestproperty set ' + machine + ' ip-addr ' + newIP),
                success: function(data) {
                    $('#results pre').text(data);
                },
                dataType: 'text'
            });
    }
    newCreds = $('input.cred-' + machine).val();
    if (newCreds.length > 0) {
        $.get({ url: 'cgi-bin/vbox.cgi/',
                data: escapeSpaces('setextradata ' + machine + ' credentials ' + newCreds),
                success: function(data) {
                    oldData = $('#results pre').text();
                    $('results pre').text(oldData + data);
                },
                dataType: 'text'
            });
    }
}

function init() {
}

//$(document).ready(init);