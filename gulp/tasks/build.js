var gulp = require('gulp');
var runSequence = require('run-sequence');
var babel = require('gulp-babel');
var config = require('../config');

gulp.task('build', ['buildServer', 'buildModules', 'buildTests'], function (callback) {
  runSequence(
    'mocha',
    'browserify',
    'sass',
    callback
  )
});

gulp.task('buildServer', function () {
  return gulp.src(['server.js'])
    .pipe(babel({
      presets: config.presets
    }))
    .pipe(gulp.dest(config.dest));
});

gulp.task('buildModules', function () {
  return gulp.src(['./src/*.js', './src/**/*.js'])
    .pipe(babel({
      presets: config.presets
    }))
    .pipe(gulp.dest(config.dest + '/src'));
});

gulp.task('buildTests', function () {
  return gulp.src(['tests/**/*.js'])
    .pipe(babel({
      presets: config.presets
    }))
    .pipe(gulp.dest(config.dest + '/tests'));
});