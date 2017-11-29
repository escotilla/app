import Formatter from '../../src/utilities/formatter';
import should from 'should';

describe('Formatter', function () {
  describe('validateStringByType', function() {
    it('should return true if string matches type (letter, number, either)', function() {
      should.ok(Formatter.validateStringByType('flowerpunk', 'letter'));
      should.ok(Formatter.validateStringByType('asY', 'letter'));
      should.ok(Formatter.validateStringByType('324', 'number'));
      should.ok(Formatter.validateStringByType('a', 'letter'));
      should.ok(Formatter.validateStringByType('200motels', 'either'));
      should.ok(Formatter.validateStringByType('1', 'either'));
    });

    it('should return false if string does not match specified type', function() {
      should.ifError(Formatter.validateStringByType('1', 'letter'));
      should.ifError(Formatter.validateStringByType('12Q', 'number'));
      should.ifError(Formatter.validateStringByType('s2&i', 'either'));
      should.ifError(Formatter.validateStringByType('aa%', 'letter'));
      should.ifError(Formatter.validateStringByType('', 'either'));
    });
  });

  describe('removeJunk', function() {
    it('should remove characters from the begining of a string until a target char is found', function() {
      should.deepEqual(Formatter.removeJunk('asd11', 'number'), '11');
      should.deepEqual(Formatter.removeJunk('82 _!32Q22', 'letter'), 'Q22');
      should.deepEqual(Formatter.removeJunk('!!!a1', 'either'), 'a1');
    });
  });

  describe('construct', function() {
    var construct = Formatter.construct('23as2s2-dw2', Formatter.tokenize('999-99-9999'), '23as2s2-dw2');
    var constructAlien = Formatter.construct('aaa23232', Formatter.tokenize('a-999999', 'b'));
    var constructDob = Formatter.construct('12261991', Formatter.tokenize('99/99/9999'));
    var constructEmpty = Formatter.construct('', Formatter.tokenize('999-99-9999'));

    it('should format a string according to an array of tokens', function() {
      should.deepEqual(construct, '232-22-');
      should.deepEqual(constructAlien, 'a-23232');
      should.deepEqual(constructDob, '12/26/1991');
      should.deepEqual(constructEmpty, '');
    });
  });

  describe('format', function() {
    it('should format a string according to a pattern', function() {
      should.deepEqual(Formatter.format('111111111', '999-99-9999'), '111-11-1111');
      should.deepEqual(Formatter.format('123-4-aasdd.56_789', '999-99-9999'), '123-45-6789');
      should.deepEqual(Formatter.format('1234567890a', 'td-9999999a'), 'td-1234567a');
      should.deepEqual(Formatter.format('1234567890', '(999)999-9999'), '(123)456-7890');
      should.deepEqual(Formatter.format('(123)456-7890', '999 999 9999'), '123 456 7890');
      should.deepEqual(Formatter.format('kjlw32!a', '****-****'), 'kjlw-32a');
      should.deepEqual(Formatter.format('qwerty', 'aaa'), 'qwe');
      should.deepEqual(Formatter.format('d233x', ''), '');
      should.deepEqual(Formatter.format('12/26/1991', '99/99/9999'), '12/26/1991');
      should.deepEqual(Formatter.format('','001 999 999 9999'), '001 ');

      var formatCreditCard = (str) => Formatter.format(str, '9999 9999 9999 9999');
      should.deepEqual(formatCreditCard('1234567890'), '1234 5678 90');
    });
  });

  describe('formatDollars', function() {
    it('should correctly format sting into dollar representation', function() {
      should.deepEqual(Formatter.formatDollars('sd400000a'), '$400,000');
      should.deepEqual(Formatter.formatDollars('sd40000000a'), '$40,000,000');
      should.deepEqual(Formatter.formatDollars('sda'), '');
      should.deepEqual(Formatter.formatDollars('sd400a'), '$400');
    });
  });
});
