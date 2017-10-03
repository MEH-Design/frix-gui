const frix = require('frix');
const appRoot = require('app-root-path');
const gutil = require('gulp-util');
const shell = require('shelljs');
const optional = require('optional');
const gitconf = optional(`${appRoot}/gitconf.js`);
const gitconfProps = ['user', 'pass', 'remote', 'message', 'email', 'name', 'timeout'];

var pushTimeout;
var firstCommit = true;

module.exports = () => {
  frix.api.getOpt().root += 'frix/';
  frix.api.watchReRender((data) => {
    gutil.log(`${data.render.key} rendered`);
    if(gitconf) {
      if(gitconfProps.every((x) => x in gitconf)) {
        let file = frix.api.getOpt().root + 'content/' +  frix.api.keys[data.render.key].content;
        shell.exec(`git add ${file}`);
        if(firstCommit) {
          shell.exec(`git config user.name ${gitconf.name}`);
          shell.exec(`git config user.email ${gitconf.email}`);
          shell.exec(`git commit -m "${gitconf.message}"`);
        } else {
          shell.exec('git commit --amend --no-edit');
        }
        gutil.log(`auto commit ${file}`);
        firstCommit = false;
        if(pushTimeout) clearTimeout(pushTimeout);
        pushTimeout = setTimeout(() => {
          shell.exec(`git push https://${gitconf.user}:${gitconf.pass}@${gitconf.remote} --all`);
          gutil.log(`auto push to ${gitconf.remote}`);
          firstCommit = true;
        }, gitconf.timeout);
      } else {
        gutil.log(gutil.colors.yellow('some properties in gitconf.js not found. Valid properties are ' + gitconfProps));
      }
    } else {
      gutil.log(gutil.colors.yellow('gitconf.js not found, no autocommits will be made'));
    }
  });
  return frix.render().then((requestHandler) => {
    // temporary workaround
    frix.api.requestHandler = requestHandler;
  });
};
