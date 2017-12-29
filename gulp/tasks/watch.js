var gulp = require('gulp');
var browserSync = require('browser-sync');
var config = require('../config');
var runSequence = require('run-sequence');

gulp.task('watch', function (callback) {

  runSequence(
    'build',
    'nodemon',
    callback
  );

  if (!config.production) {
    browserSync.init(config.browserSync);

    gulp.watch('src/sass/*.scss', ['sass']);
    gulp.watch(['src/*.js', 'src/**/*.js'], ['browserify']);
    gulp.watch(['server.js'], ['buildServer']);
  }
});