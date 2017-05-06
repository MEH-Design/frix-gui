const path = require('path');
const gulp = require('gulp');
const keva = require('keva');
const decb = require('decb');
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
  fs.readFile(frix.api.getOpt().root + 'redirects.json')
    .then(JSON.parse)
    .then(redirects => {
      redirects.urls.forEach(url => {
        app.get(url.from, function(req, res) {
          res.redirect(url.to);
        });
      });
    });
  let app = express();
  frix.render().then((requestHandler) => {
    app.use(requestHandler);
  });
  app.listen(80);
});

gulp.task('watch', () => {
  for (let [key, val] of keva(watch)) {
    gulp.watch(val, [key]);
  }
});

gulp.task('default', ['connect'], () => {
  gulp.start('css', 'html', 'js', 'watch');
});
