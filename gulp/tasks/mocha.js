var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('mocha', function() {
  return gulp.src(['dist/tests/unit/*.js'], { read: false })
    .pipe(mocha());
});