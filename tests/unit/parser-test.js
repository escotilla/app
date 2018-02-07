import {parseSearch} from '../../src/utilities/environment';
import should from 'should';

describe('Dashboard', function () {
  describe('parseSearch', function() {
    it('should correctly parse URL query into JSON', function() {
      should.deepEqual(parseSearch("?success=true&paymentId=PAY-3056224555203623NLJVW3YY&token=EC-6JA21626M2695722C&PayerID=VS2ZS9BGB2C5U", 'letter'),
        {
          success: "true",
          paymentId: "PAY-3056224555203623NLJVW3YY",
          token: "EC-6JA21626M2695722C",
          PayerID: "VS2ZS9BGB2C5U"
        }
        );
    });
  });
});
  ``