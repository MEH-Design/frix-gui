const appRoot = require('app-root-path');
const gulp = require('gulp');
const keva = require('keva');
const decb = require('decb');
const crypto = require('crypto');
const escape = require('escape-html');
const fs = decb(require('fs'), {
  use: ['readFile', 'writeFile']
});
const postcss = require('gulp-postcss');
const express = require('express');
const Handlebars = require('handlebars');
const handlebars = require('gulp-compile-handlebars');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const posthtml = require('gulp-posthtml');
const inline = require('gulp-inline');
const frix = require('frix');
const watch = {
  css: 'src/style/**/*.css',
  html: 'src/markup/**/*.hbs',
  js: 'src/script/**/*.js',
  content: frix.api.getOpt().root + 'frix/content/**/*.json',
  templates: frix.api.getOpt().root + 'frix/content/**/*.*'
};
frix.api.getOpt().root += 'frix/';

// authentication
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const pass = require('./build/pass');

Handlebars.registerHelper('tree', (context, options) => {
  return '<ul class="tree">' +tree(context, '', 'ul');
});

function tree(context, dev, ...closeTags) {
  let ret = '';
  for (let [key, val] of keva(context)) {
    if(val.value) {
      ret += `<li class="link" data-value="${val.value}" data-type="${val.type}" data-dev="${dev} ${key}"><span>${key}</span></li>`;
    } else {
      ret += `<li><span>${key}</span><ul>`;
      ret += tree(val, `${dev} ${key}`, 'ul', 'li');
    }
  }
  ret += closeTags.map(tag => `</${tag}>`).join('');
  return ret;
}

gulp.task('html', function (done) {
  let data = {};

  frix.render({dev: true}).then(() => {

    let promises = [];
    data.pages = frix.api.getAllPages();
    data.content = {};
    for ([key, val] of keva(data.pages)) {
      (function(key, val) {
        promises.push(fs.readFile(val.filename).then((file) => {
          data.pages[key].html = file.toString();
          data.content[key] = frix.api.getContentStructure(key);
        }));
      })(key, val);
    }

    Promise.all(promises).then(() => {

      let bemData = {
            elemPrefix: '__',
            modPrefix: '--',
            modDlmtr: '_'
      };

      gulp.src(watch.html)
        .pipe(posthtml([
              require('posthtml-bem')(bemData)
        ]))
        .pipe(handlebars(data, {
          ignorePartials: true
        }))
        .pipe(rename({
          extname: '.html'
        }))
        .pipe(inline({
          base: 'src/images'
        }))
        .pipe(gulp.dest('build'));

      gulp.src('frix/bin/**/*.*')
        .pipe(gulp.dest('build/bin'));

      done();
    });
  });
});

gulp.task('css', () => {
  gulp.src(watch.css)
    .pipe(postcss([
      require('postcss-cssnext')
    ]))
    .pipe(gulp.dest('build'));
});

gulp.task('js', () => {
  gulp.src(watch.js)
    .pipe(gulp.dest('build'));
});

gulp.task('content', ['html']);
gulp.task('templates', ['html']);

gulp.task('connect', () => {
  let app = express();
  // www redirect
  function wwwRedirect(req, res, next) {
      if (req.headers.host.slice(0, 4) === 'www.') {
          var newHost = req.headers.host.slice(4);
          return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
      }
      next();
  };

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
  frix.render().then((requestHandler) => {
    app.use(requestHandler);
  });

  app.listen(80);

  let appAdmin = express();
  appAdmin.use(require('cookie-parser')());
  appAdmin.use(require('body-parser').urlencoded({ extended: true }));
  appAdmin.use(require('express-session')({ secret: '|=|2!><', resave: false, saveUninitialized: false }));

  passport.use(new Strategy((id, password, cb) => {
    pass.getRecord(id, function(pass) {
      return cb(null, pass);
    });
  }));

  passport.serializeUser(function(_, cb) {
    cb(null, 1); // id is irrelevant
  });

  passport.deserializeUser(function(id, cb) {
    pass.getRecord(id, function(pass) {
      cb(null, pass);
    });
  });


  appAdmin.set('trust proxy', true);
  appAdmin.use(wwwRedirect);
  appAdmin.use(passport.initialize());
  appAdmin.use(passport.session());

  appAdmin.get('/login', (req, res) => {
    res.sendFile(`${appRoot}/build/login.html`);
  });

  appAdmin.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

  appAdmin.get('/',
  //require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.sendFile(`${appRoot}/build/index.html`);
  });

  appAdmin.listen(61824);
});

gulp.task('watch', () => {
  for (let [key, val] of keva(watch)) {
    gulp.watch(val, [key]);
  }
});

gulp.task('default', ['connect'], () => {
  gulp.start('css', 'html', 'js', 'watch');
});
