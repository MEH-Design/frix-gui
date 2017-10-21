const exec = require('child_process').exec;
const appRoot = require('app-root-path');

module.exports = () => {
  exec(`node-file-manager -p 61825 -d ${appRoot}/frix/resources >> filemanager.log`)
  return true;
}
