const gulp = require('gulp');
const image = require('gulp-image');

gulp.task('image', function () {
  return gulp.src('./src/images/*')
    .pipe(image({
      jpegRecompress: false
    }))
    .pipe(gulp.dest('./dist/public/images'));
});