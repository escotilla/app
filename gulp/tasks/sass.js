var gulp = require('gulp');
var sass = require('gulp-sass');
var config = require('../config');

gulp.task('sass', function () {
  var sassConfig = {};

  if (!config.debug) {
    sassConfig = {outputStyle: 'compressed'};
  }

  return gulp.src('./src/sass/*.scss')
    .pipe(sass(sassConfig).on('error', sass.logError))
    .pipe(gulp.dest(config.dest));
});