var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var config = require('../config');

gulp.task('nodemon', function() {
  return nodemon(config.nodemon)
});