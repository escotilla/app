'use strict';

var should = require('should');

describe('react router app', function () {
  beforeEach(function () {
    browser.waitForAngularEnabled(false);
  });

  it('should navigate through all routes', function () {
    browser.get('');
    var homeHeader = element(by.id('home-header-text'));

    homeHeader.getText().then(function (text) {
      should.equal(text, 'Home page');
    });

    element(by.id('/examples')).click();
    var header = element(by.id('select-example-text'));

    header.getText().then(function (text) {
      should.equal(text, 'Select an example');
    });
  });
});