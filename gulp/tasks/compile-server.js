var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('compile-server', function () {
  return gulp.src('./server.js')
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest('./dist'));
});