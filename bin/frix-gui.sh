#!/usr/bin/env sh

SHELL_PATH=`dirname $0`
cd $SHELL_PATH/../lib/node_modules/frix-gui/start

node --harmony index.js $*
