var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var exec = require('child_process').exec;

gulp.task('nodemon', ['build'], function(callback) {
  exec('nodemon server.js --exec node_modules/babel-cli/bin/babel-node.js --presets es2015,stage-2,react', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });

  callback();
});