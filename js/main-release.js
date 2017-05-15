/*
 * The following code relies on the existence and correct functioning of a
 * CGI script implementing logic similar to the following:
 
#!/bin/bash
set -f
echo "Content-Type: text/plain"
echo

args=$(echo $QUERY_STRING | sed "s/%20/ /g")
VBoxManage $args 2>&1

 * (You may cut and paste above code if required into a file) - the filename
 * and location should be set to match the location shown below
 */

const CGI = '/~karl/cgi-bin/vbox.cgi'; // path to your vboxmanage cgi script

// constants for the vboxmanage commands
const HOSTINFO = 'list hostinfo';
const GLOBALEXTRAS = 'getextradata global enumerate';
const GETVMLIST = 'list vms';
const GETVMINFO = 'showvminfo #MACHINE# --machinereadable';
const GETALLGUESTPROPS = 'guestproperty enumerate #MACHINE#';
const GETALLEXTRADATA = 'getextradata #MACHINE# enumerate';
const SETGUESTPROP = 'guestproperty set #MACHINE# #KEY# #VALUE#';
const SETEXTRAPROP = 'setextradata  #MACHINE# #KEY# #VALUE#';
const GETGUESTPROP = 'guestproperty get #MACHINE# #KEY#';
const GETEXTRAPROP = 'getextradata  #MACHINE# #KEY#';
const STARTVM = 'startvm #MACHINE# --type headless';
const PAUSEVM = 'controlvm #MACHINE# pause';
const RESUMEVM = 'controlvm #MACHINE# resume';
const POWERDOWNVM = 'controlvm #MACHINE# acpipowerbutton';  

const STARTSTATS = "metrics setup --period 5 --samples 1 host CPU/Load,RAM/Usage";;;;
const GETSTATS = "metrics query host";

// And some of the more useful properties
const CREDENTIALS = 'credentials';
const IPADDR = "/VirtualBox/GuestInfo/Net/0/V4/IP";
const IPALT = 'ip-addr';
const HOSTOS = 'Operating system';
const HOSTOSVER = 'Operating system version';
const HOSTCPUS = 'Processor count';
const HOSTMHZ = 'Processor#0 speed';
const HOSTMEMSIZE = 'Memory size';
const HOSTMEMAVAIL = 'Memory available';
const HOSTUSER = 'Host user';
const GUESTOS = 'ostype';
const GUESTDESC = 'description';
const GUESTSTATE = 'VMState';
const RDESKTOPPORT = 'vrdeports';
// including those for stats monitoring
const CPUUSER = 'CPU/Load/User:avg';
const CPUSYS = 'CPU/Load/Kernel:avg';
const CPUIDLE = 'CPU/Load/Idle:avg';
const RAMTOTAL = 'RAM/Usage/Total:avg';
const RAMUSED = 'RAM/Usage/Used:avg';
const RAMFREE = 'RAM/Usage/Free:avg';

const NOTSET = 'n/a';

const LINESPLITS = /\r?\n/g;
const PROPSPLITS = /[:,] +/;
const EXTRASPLITS = /=/;
const STATSSPLITS = /  +/; // two or more spaces;

const NORMAL = 'normal';
const WARNING = 'warning';
const ALERT = 'alert';

var hostname;
var url;
var machineNames;
var hostProps;
var hostStats;
var guestProps;

function initGlobals() {
    url = '';
    machineNames = [];  
    hostProps = {};
    guestProps = {};
}

function encodeCommand(command, machine = null, key = null, value = null) {
    line = command;
    if (machine !== null && machine !== '') {
        line = line.replace('#MACHINE#', machine);
    }
    if (key !== null && key !== '') {
        line = line.replace('#KEY#', key);
    }
    if (value !== null && value !== '') {
        line = line.replace('#VALUE#', value);
    } 
    return encodeURI(line);
}

function control(command, machine) {
    switch (command) {
        case 'start':
            arg = 'startvm ' + machine + ' --type headless';
            break;
        case 'pause':
            arg = 'controlvm ' + machine + ' pause';
            break;
        case 'resume':
            arg = 'controlvm ' + machine + ' resume';
            break;
        case 'stop':
            arg = 'controlvm ' + machine + ' acpipowerbutton';
        break;
        default:
    }
    if (typeof arg !== 'undefined' && arg !== null) {
        $.get({ url: url,
                data: encodeURI(arg),
                success: function(data) {
                    $('#results pre').text(data);
                },
                dataType: 'text'
            });
    }
    return false;
}

function arbitrary() {
    arg = $('#arbitrary').val();
    if (typeof arg !== 'undefined' && arg !== null) {
        $.get({ url: url,
                data: encodeURI(arg),
                success: function(data) {
                    $('#results pre').text(data);
                },
                dataType: 'text'
            });
    }    
}

function getHostnameInput() {
    let hostInput = $('input#host-name').val();
    if (hostInput.length > 0) {
        hostname = hostInput;
        var expires = new Date();
        expires.setTime(expires.getTime() + 31536000000);
        document.cookie = 'previousHost=' + hostInput + ';expires=' +expires.toUTCString();
        return hostInput;
    }
    return false;
}

function getHostProps() {
    $.get({ url: url,
         data: encodeCommand(GLOBALEXTRAS),
         success: function(data) {
            let lines = data.split(LINESPLITS);
            for (let line in lines) {
                let parts = lines[line].split(PROPSPLITS);
                if ( parts.length > 3) {
                    hostProps[parts[1]] = parts[3];
                }
            }
         },
         dataType: 'text'
     }); 
    $.get({ url: url,
         data: encodeCommand(HOSTINFO),
         success: function(data) {
            let lines = data.split(LINESPLITS);
            for (let line in lines) {
                let parts = lines[line].split(PROPSPLITS);
                if ( parts.length > 1) {
                    hostProps[parts[0]] = parts[1];
                }
            }
            populateHostRow();
         },
         dataType: 'text'
     }); 
}

function populateHostRow() {
    let user = '?????';
    let weblink = NOTSET;
    let sshlink = NOTSET;
    let ftplink = NOTSET;
    $('td.host-name').text(hostname);
    var description = hostProps[HOSTOS] + ' ' +
            hostProps[HOSTOSVER] + ' ' +
            hostProps[HOSTCPUS] + ' CPUs at ' +
            hostProps[HOSTMHZ] + ' ' +
            hostProps[HOSTMEMSIZE] + 'RAM';
    $('td.host-desc').text(description); 
    if (HOSTUSER in hostProps) {
        user = hostProps[HOSTUSER];
        ssh = 'ssh://' + user + '@' + hostname;
        sshlink = '<a href="' + ssh + '">' + ssh + '</a>';
        ftp = 'ftp://' + user + '@' + hostname;
        ftplink = '<a href="' + ftp + '">' + ftp + '</a>';
    }
    $('tr.host-links-row td.vm-cred').text(user);
    weblink = '<a href="http://' + hostname + '">http://' + hostname + '</a>';
    let vnc = 'vnc://' + hostname;
    let vnclink = '<a href="' + vnc + '">' + vnc + '</a>';
    // Link fields
    $('tr.host-links-row td.vm-web').html(weblink);
    $('tr.host-links-row td.vm-cred').text(user + '/??????' );
    $('tr.host-links-row td.vm-ssh').html(sshlink);
    $('tr.host-links-row td.vm-ftp').html(ftplink);
    $('tr.host-links-row td.vm-vnc').html(vnclink);
}

function populateGuestRow(name) {
    let props = guestProps[name];
    // Some default values
    let ip_addr = NOTSET;
    let weblink = NOTSET;
    let sshlink = NOTSET;
    let ftplink = NOTSET;
    let description = props[GUESTOS];
    let state = 'unknown';
    let user = '??????';
    let password = '********';
    if (GUESTSTATE in props) {
        state = props[GUESTSTATE];
    }
    if (GUESTDESC in props) {
        description = props[GUESTDESC];
    }
    let vnc = 'vnc://' + hostname + ':' + props[RDESKTOPPORT];
    let vnclink = '<a href="' + vnc + '">' + vnc + '</a>';
    if (IPADDR in props) {
        ip_addr = props[IPADDR];
    } else if (IPALT in props) {
        ip_addr = props[IPALT];
    }
    if ( ip_addr !== NOTSET) {
        weblink = '<a href="http://' + ip_addr + '">http://' + ip_addr + '</a>';
        if (CREDENTIALS in props) {
            let creds = props[CREDENTIALS].split(/\//);
            user = creds[0];
            if ( creds.length > 1) {
                password = creds[1];
            }
            ssh = 'ssh://' + user + '@' + ip_addr;
            sshlink = '<a href="' + ssh + '">' + ssh + '</a>';
            ftp = 'ftp://' + user + '@' + ip_addr;
            ftplink = '<a href="' + ftp + '">' + ftp + '</a>';
        }
    }
    // Link fields
    $('tr.' + name + '-description-row td.vm-desc').text(description);
    $('tr.' + name + '-links-row td.vm-web').html(weblink);
    $('tr.' + name + '-links-row td.vm-cred').text(user + '/' + password);
    $('tr.' + name + '-links-row td.vm-ssh').html(sshlink);
    $('tr.' + name + '-links-row td.vm-ftp').html(ftplink);
    $('tr.' + name + '-links-row td.vm-vnc').html(vnclink);
    // button actions
    $('.' + name + '-button-row .edit-button').on('click',function(){editProps(name);});
    $('.' + name + '-button-row .start-button').on('click',function(){control('start',name);});
    $('.' + name + '-button-row .resume-button').on('click',function(){control('resume',name);});
    $('.' + name + '-button-row .pause-button').on('click',function(){control('pause',name);});
    $('.' + name + '-button-row .stop-button').on('click',function(){control('stop',name);});
    showState(name,state);
}

function getGuestInfo1(name, chained = true) {
    $.get({ url: url,
        data: encodeCommand(GETVMINFO, name),
        success: function(data) {
            let lines = data.split(LINESPLITS);
            for (let line in lines) {
                let parts = lines[line].split(EXTRASPLITS);
                let key = parts[0];
                let value = parts[1];
                if (typeof value !== 'undefined' && value.startsWith('"')) {
                    value = value.slice(1,-1);
                }
                guestProps[name][key] = value;
            }
            if ( chained ) {
                getGuestInfo2(name);
            }
        },
        dataType: 'text'
    });
}

function getGuestInfo2(name) {
    $.get({ url: url,
        data: encodeCommand(GETALLGUESTPROPS, name),
        success: function(data) {
            let lines = data.split(LINESPLITS);
            for (let line in lines) {
                let parts = lines[line].split(PROPSPLITS);
                if ( parts.length > 3) {
                    guestProps[name][parts[1]] = parts[3];
                }
            }
            getGuestInfo3(name);
        },
        dataType: 'text'
    });
}

function getGuestInfo3(name) {
    $.get({ url: url,
        data: encodeCommand(GETALLEXTRADATA, name),
        success: function(data) {
            let lines = data.split(LINESPLITS);
            for (let line in lines) {
                let parts = lines[line].split(PROPSPLITS);
                if ( parts.length > 3) {
                    guestProps[name][parts[1]] = parts[3];
                }
            }
            populateGuestRow(name);
        },
        dataType: 'text'
    });
}

function createGuestRow(name) {
    $('#guest-description-row').clone(false).
            addClass(name + '-description-row delete-on-restart')
            .removeAttr("id")
            .show()
            .appendTo('.mainTable');
    $('tr.' + name + '-description-row td.vm-name' ).text(name);
    $('#guest-links-row').clone(false)
            .addClass(name + '-links-row delete-on-restart')
            .removeAttr("id")
            .show()
            .appendTo('.mainTable');
    $('#guest-button-row').clone(false)
            .addClass(name + '-button-row delete-on-restart')
            .removeAttr("id")
            .show()
            .appendTo('.mainTable');
}

function getMachineNames() {
    $.get({ url: url,
        data: encodeCommand(GETVMLIST),
        success: function(data) {
            matches = data.match(/".*?"/gm);
            for (let n in matches) {
                let name = matches[n].slice(1,-1);
                machineNames.push(name);
                createGuestRow(name);
                guestProps[name] = {};
                getGuestInfo1(name);
            }
        },
        dataType: 'text'
    });
}

function editProps(name) {
    let newIP = $('.' + name + '-button-row .ip-edit').val();
    let newCreds = $('.' + name + '-button-row .cred-edit').val();
    if (typeof newIP !== 'undefined' && newIP !== '') {
        let data = encodeCommand(SETGUESTPROP,name,IPALT,newIP);
        $.get(url,data);
    }
        if (typeof newIP !== 'undefined' && newIP !== '') {
        let data = encodeCommand(SETGUESTPROP,name,CREDENTIALS,newIP);
        $.get(url,data);
    }
}

function showState(machine,state) {
    if (typeof state === 'undefined' ) {
        state = 'unknown';
    }
    $('tr.' + machine + '-links-row td.vm-state')
            .removeClass('running paused poweroff unknown')
            .addClass(state)
            .text(state);
    switch (state) {
        case 'running':
            $('.' + machine + '-button-row .start-button' ).hide();
            $('.' + machine + '-button-row .pause-button' ).show();
            $('.' + machine + '-button-row .resume-button' ).hide();
            break;
        case 'paused':
            $('.' + machine + '-button-row .start-button' ).hide();
            $('.' + machine + '-button-row .pause-button' ).hide();
            $('.' + machine + '-button-row .resume-button' ).show();
            break;
        case 'poweroff':
            $('.' + machine + '-button-row .start-button' ).show();
            $('.' + machine + '-button-row .pause-button' ).hide();
            $('.' + machine + '-button-row .resume-button' ).hide();
        break;
        default:
    }
}

function updateStatus() {
    for (let n in machineNames) {
        machine = machineNames[n];
        getGuestInfo1(machine, false);
        let state = guestProps[machine][GUESTSTATE];
        showState(machine,state);
    }
}

function startHostStats() {
    hostStats = {};
    $.get({
        url: url,
        data: STARTSTATS,
        // no response
        textType: 'text'
        });
}

function showHostStats() {
    let cpuStats = hostStats[CPUUSER] + '/' +
                    hostStats[CPUSYS] + '/' +
                    hostStats[CPUIDLE];
    let ramStats = hostStats[RAMTOTAL] + '/' +
                    hostStats[RAMUSED] + '/' +
                    hostStats[RAMFREE];
    let cpuWarn = NORMAL;
    let percent = parseInt(hostStats[CPUIDLE],10);
    if (percent < 20) {
        cpuWarn = ALERT;
    } else if (percent < 40) {
        cpuWarn = WARNING;
    }
    let ramWarn = NORMAL;
    percent = parseInt(hostStats[RAMFREE],10);
    if (percent < 20) {
        ramWarn = ALERT;
    } else if (percent < 40) {
        ramWarn = WARNING;
    }
    $('#host-cpu').removeClass(NORMAL + ' ' + ALERT + ' ' + WARNING )
            .addClass(cpuWarn)
            .text(cpuStats);
    $('#host-ram').removeClass(NORMAL + ' ' + ALERT + ' ' + WARNING )
            .addClass(ramWarn)
            .text(ramStats);
}

function getHostStats() {
    $.get({
        url: url,
        data: GETSTATS,
         success: function(data) {
            let lines = data.split(LINESPLITS);
            for (let line in lines) {
                // skip title lines
                if (line < 2) {
                    continue;
                }
                let parts = lines[line].split(STATSSPLITS);
                if ( parts.length > 2) {
                    hostStats[parts[1]] = parts[2];
                }
            }
            showHostStats();
         },            
         textType: 'text'
        });    
}

function startVMManager() {
    let hostname = getHostnameInput();
    if (hostname !== false) {
        initGlobals();
        $('tr.delete-on-restart').remove();
        url = 'http://' + hostname + CGI;
        getHostProps();
        getMachineNames();
        setInterval(updateStatus,5000);
        startHostStats();
        setInterval(getHostStats,6000);
    }
}



function init() {
    $('tr.template').hide();
    let prevName = document.cookie.match('(^|;) ?previousHost=([^;]*)(;|$)');
    if (prevName) {
        $('input#host-name').val(prevName[2]);
    }
}

$(document).ready(init);