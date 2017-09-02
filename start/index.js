const shell = require("shelljs");

shell.exec("gulp --gulpfile " + require('app-root-path') + "/node_modules/frix-gui/gulpfile.js");
