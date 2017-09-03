const express = require('express');
const wwwRedirect = require('../wwwRedirect');
const fs = require('then-fs');
const frix = require('frix');

module.exports = () => {
  let app = express();

  app.set('trust proxy', true);
  app.use(wwwRedirect);
  // old website urls redirect
  fs.readFile(frix.api.getOpt().root + 'redirects.json')
  .then(JSON.parse)
  .then(redirects => {
    redirects.urls.forEach(url => {
      app.get(url.from, function(req, res) {
        res.redirect(url.to);
      });
    });
  });
  // sitemap
  app.get('/sitemap.xml', function(req, res) {
    res.sendFile(frix.api.getOpt().root + 'sitemap.xml');
  });
  // frix core
  app.use(frix.api.requestHandler);

  app.listen(80);
};
