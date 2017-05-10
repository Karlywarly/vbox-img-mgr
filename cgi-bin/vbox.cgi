#!/bin/bash
set -f
echo "Content-Type: text/plain"
echo

args=$(echo $QUERY_STRING | sed "s/%20/ /g")
VBoxManage $args 2>&1

