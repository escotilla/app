var glob = require('glob');
var port = 8000;
var dest = './dist/';

var args = process.argv.slice(2);
var production = false;
var testFiles = glob.sync('./tests/unit/*.js');

if (args[0] === '--production') {
  process.env.NODE_ENV = 'production';
  production = true;
}

if (args.length > 1) {
  port = args[1];
}

process.env.PORT = port;

module.exports = {
  production: production,
  dest: dest,
  presets: ['react', 'stage-2', 'env'],
  browserSync: {
    proxy: 'localhost:' + port,
    ui: {
      port: 3007
    }
  },
  browserify: {
    entries: './src/client.js',
    cache: {},
    packageCache: {},
    debug: !production
  },
  server: {
    entries: './server.js',
    cache: {},
    packageCache: {},
    debug: !production
  },
  tests: {
    entries: testFiles,
    cache: {},
    packageCache: {},
    debug: !production
  },
  nodemon: {
    script: 'dist/server.js'
  }
};