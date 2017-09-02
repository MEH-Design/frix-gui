const frix = require('frix');

module.exports = () => {
  frix.api.getOpt().root += 'frix/';
  frix.api.watchReRender((data) => {
    gutil.log(`${data.render.key} rendered`);
  });
  return frix.render().then((requestHandler) => {
    // temporary workaround
    frix.api.requestHandler = requestHandler;
  });
};
