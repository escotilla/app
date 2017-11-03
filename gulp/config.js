var port = 3002;
var dest = './public';

var arguments = process.argv.slice(2);
var production = false;

if (arguments[0] === '--production') {
  process.env.NODE_ENV = 'production';
  production = true;
}

if (arguments.length > 1) {
  port = arguments[1];
}

process.env.PORT = port;

module.exports = {
  production: production,
  dest: dest,
  browserSync: {
    files: [dest + '/**'],
    proxy: 'localhost:' + port
  },
  browserify: {
    entries: './src/components/App.js',
    cache: {},
    packageCache: {},
    debug: !production
  },
  nodemon: {
    script: 'server.js',
    ignore: [
      'gulpfile.js',
      'gulp/',
      'node_modules/',
      'public/'
    ]
  }
};