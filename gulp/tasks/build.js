var gulp = require('gulp');
var runSequence = require('run-sequence');
var babel = require('gulp-babel');
var config = require('../config');
var Cache = require('gulp-file-cache');

var cache = new Cache();

gulp.task('build', ['buildServer', 'buildModules', 'buildTests'], function (callback) {
  runSequence(
    'mocha',
    'browserify',
    'sass',
    'image',
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
  return gulp.src(['src/*.js', 'src/**/*.js'])
    .pipe(cache.filter())
    .pipe(babel({
      presets: config.presets
    }))
    .pipe(cache.cache())
    .pipe(gulp.dest(config.dest + '/src'));
});

gulp.task('buildTests', function () {
  return gulp.src(['tests/**/*.js'])
    .pipe(babel({
      presets: config.presets
    }))
    .pipe(gulp.dest(config.dest + '/tests'));
});