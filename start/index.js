const exec = require('child_process').exec;

exec("gulp --gulpfile " + require('app-root-path') + "/node_modules/frix-gui/gulpfile.js");
