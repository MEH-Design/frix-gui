const frix = require('frix');
const appRoot = require('app-root-path');
const gutil = require('gulp-util');
const shell = require('shelljs');
const gitconf = require(`${appRoot}/gitconf.js`);

var pushTimeout;

module.exports = () => {
  frix.api.getOpt().root += 'frix/';
  frix.api.watchReRender((data) => {
    gutil.log(`${data.render.key} rendered`);
    if(gitconf) {
      let file = frix.api.getOpt().root + 'content/' +  frix.api.keys[data.render.key].content;
      shell.exec(`git add ${file} && git commit -m "${gitconf.message}"`);
      gutil.log(`auto commit ${file}`);
      if(pushTimeout) clearTimeout(pushTimeout);
      pushTimeout = setTimeout(() => {
        shell.exec(`git push https://${gitconf.user}:${gitconf.pass}@${gitconf.remote} --all`);
        gutil.log(`auto push to ${gitconf.remote}`);
      }, gitconf.timeout);
    }
  });
  return frix.render().then((requestHandler) => {
    // temporary workaround
    frix.api.requestHandler = requestHandler;
  });
};
