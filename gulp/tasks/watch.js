var gulp = require('gulp');
var browserSync = require('browser-sync');
var config = require('../config');
var runSequence = require('run-sequence');

gulp.task('watch', function (callback) {

  runSequence(
    'build',
    'nodemon',
    'browsersync',
    callback
  );

  if (!config.production) {
    gulp.watch('src/sass/*.scss', ['sass']);
  }
});

gulp.task('browsersync', function () {
  if (!config.production) {
    return browserSync.init(config.browserSync);
  }
});