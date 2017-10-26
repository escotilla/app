var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

function rebundle(bundle) {
  bundle.bundle()
    .on('error', function (err) {
      console.error(err);
      this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./public'));
}

function production(bundle) {
  bundle.bundle()
    .on('error', function (err) {
      console.error(err);
      this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./public'));
}

function build(watch) {
  var bundle = browserify('./src/components/App.js')
      .transform(babel.configure({presets: ['es2015', 'react', 'stage-2']}));

  if (watch) {
    bundle = watchify(bundle);
    bundle.on('update', function () {
      console.log('rebundling...');
      rebundle(bundle);
    });
  } else {
    return production(bundle);
  }

  return rebundle(bundle);
}

function bundleSass() {
  return gulp.src('./src/sass/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./public'));
}

gulp.task('serve', function() {
  browserSync.init(null, {
      files: ['public'],
      proxy: "localhost:3002"
  });

  gulp.watch(['*.html', '*.css', '*.js'], {cwd: 'public'}, reload);
});

gulp.task('sass', function () {
  return bundleSass();
});

gulp.task('watch-sass', ['sass'], function() {
  gulp.watch('./src/sass/*.scss', ['sass']);
});

gulp.task('build', ['sass'], function () {
  return build(false);
});

gulp.task('watch', ['serve'], function () {
  return build(true);
});