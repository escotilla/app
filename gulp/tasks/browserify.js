var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var uglify = require('gulp-uglify');
var config = require('../config');

function production(bundler) {
  return bundler.bundle()
    .on('error', function (err) {
      console.error(err);
      this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(config.dest));
}

function rebundle(bundler) {
  return bundler.bundle()
    .on('error', function (err) {
      console.error(err);
      this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(config.dest));
}

gulp.task('browserify', function () {
  var bundler = browserify(config.browserify)
    .transform(babel.configure({presets: ['es2015', 'react', 'stage-2']}));

  if (!config.production) {
    bundler = watchify(bundler);
    bundler.on('update', function () {
      console.log('rebundling...');
      rebundle(bundler);
    });
  } else {
    return production(bundler);
  }

  return rebundle(bundler);
});