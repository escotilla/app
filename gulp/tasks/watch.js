var gulp = require('gulp');
var browserSync = require('browser-sync');
var config = require('../config');

gulp.task('watch', ['build', 'nodemon'], function () {
  if (!config.production) {
    browserSync.init(null, config.browserSync);

    gulp.watch('./src/sass/*.scss', ['sass']);
  }
});