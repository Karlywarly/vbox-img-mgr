#!/bin/bash
set -f
echo "Content-Type: text/plain"
echo

args=$(echo $QUERY_STRING | sed "s/%20/ /g")
if [[ args == startvboxsrv ]]; then
    if pgrep vboxwebsrv ; then
        echo vboxwebsrv is already running
    else
            echo Starting vboxwebsrv...
            nohup /usr/bin/vboxwebsrv 2>&1  > ~karl/logs/vboxwebsrv.log &
    fi
else
    VBoxManage $args 2>&1
fi


