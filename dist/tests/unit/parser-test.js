'use strict';

var _environment = require('../../src/utilities/environment');

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Dashboard', function () {
  describe('parseSearch', function () {
    it('should correctly parse URL query into JSON', function () {
      _should2.default.deepEqual((0, _environment.parseSearch)("?success=true&paymentId=PAY-3056224555203623NLJVW3YY&token=EC-6JA21626M2695722C&PayerID=VS2ZS9BGB2C5U", 'letter'), {
        success: "true",
        paymentId: "PAY-3056224555203623NLJVW3YY",
        token: "EC-6JA21626M2695722C",
        PayerID: "VS2ZS9BGB2C5U"
      });
    });
  });
});
'';