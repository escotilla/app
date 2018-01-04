const gulp = require('gulp');
const image = require('gulp-image');

gulp.task('image', function () {
  return gulp.src('./src/images/*')
    .pipe(image())
    .pipe(gulp.dest('./dist/public/images'));
});