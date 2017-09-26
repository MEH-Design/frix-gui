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
        shell.exec(`git commit ${if(firstCommit) --amend} -c "user.name=${gitconf.name}" -c "user.email=${gitconf.email}" -m "${gitconf.message}"`);
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
