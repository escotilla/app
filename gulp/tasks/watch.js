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
    browserSync.init(null, config.browserSync);

    gulp.watch('src/sass/*.scss', ['sass']);
    gulp.watch(['server.js', 'src/*.js', 'src/**/*.js'], ['build']);
  }
});