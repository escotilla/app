var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var config = require('../config');

gulp.task('nodemon', function() {
  if (!config.production) {
    return nodemon(config.nodemon)
  }
});