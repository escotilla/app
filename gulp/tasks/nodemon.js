var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var config = require('../config');

gulp.task('nodemon', function(callback) {
  var called = false;

  return nodemon(config.nodemon)
    .on('start', function() {
      if (!called) {
        called = true;
        callback();
      }
    })
});