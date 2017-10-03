const frix = require('frix');
const appRoot = require('app-root-path');
const gutil = require('gulp-util');
const shell = require('shelljs');
const optional = require('optional');
const gitconf = optional(`${appRoot}/gitconf.js`);
const autocommit = require('autocommit');

module.exports = () => {
  frix.api.getOpt().root += 'frix/';
  frix.api.watchReRender((data) => {
    gutil.log(`${data.render.key} rendered`);
    if(gitconf) {
      autocommit(gitconf);
    } else {
      gutil.log(gutil.colors.yellow('gitconf.js not found, no autocommits will be made'));
    }
  });
  return frix.render().then((requestHandler) => {
    // temporary workaround
    frix.api.requestHandler = requestHandler;
  });
};
