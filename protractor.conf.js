exports.config = {
  framework: 'jasmine2',
  specs: ['tests/e2e/*.js'],
  capabilities: {
    browserName: 'chrome'
  },
  baseUrl: 'http://localhost:8000'
};