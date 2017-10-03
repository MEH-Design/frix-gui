const gitconfProps = ['user', 'pass', 'remote', 'message', 'email', 'name', 'timeout'];

var pushTimeout;
var firstCommit = true;

module.exports = (gitconf) => {
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
};
