const gitconfProps = ['user', 'pass', 'remote', 'message', 'email', 'name', 'timeout'];
const exec = require('child_process').exec;

var pushTimeout;
var firstCommit = true;

module.exports = (gitconf) => {
    if(gitconfProps.every((x) => x in gitconf)) {
      let file = frix.api.getOpt().root + 'content/' +  frix.api.keys[data.render.key].content;
      exec(`git add ${file}`);
      if(firstCommit) {
        exec(`git config user.name ${gitconf.name}`);
        exec(`git config user.email ${gitconf.email}`);
        exec(`git commit -m "${gitconf.message}"`);
      } else {
        exec('git commit --amend --no-edit');
      }
      gutil.log(`auto commit ${file}`);
      firstCommit = false;
      if(pushTimeout) clearTimeout(pushTimeout);
      pushTimeout = setTimeout(() => {
        exec(`git push https://${gitconf.user}:${gitconf.pass}@${gitconf.remote} --all`);
        gutil.log(`auto push to ${gitconf.remote}`);
        firstCommit = true;
      }, gitconf.timeout);
    } else {
      gutil.log(gutil.colors.yellow('some properties in gitconf.js not found. Valid properties are ' + gitconfProps));
    }
};
