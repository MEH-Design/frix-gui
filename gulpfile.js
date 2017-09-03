const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('frix', require('./tasks/frix'));
gulp.task('login', require('./tasks/login'));
gulp.task('connect', require('./tasks/connect'));

// default
gulp.task('default', ['frix'], () => {
  gulp.start(['connect', 'login']);
});
