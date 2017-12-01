exports.config = {
  framework: 'jasmine2',
  specs: ['tests/e2e/*.js'],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: [ "--headless" ]
    }
  },
  baseUrl: 'http://localhost:8000'
};