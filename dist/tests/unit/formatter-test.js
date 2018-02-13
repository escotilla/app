'use strict';

var _formatter = require('../../src/utilities/formatter');

var Formatter = _interopRequireWildcard(_formatter);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

describe('Formatter', function () {
  describe('validateStringByType', function () {
    it('should return true if string matches type (letter, number, either)', function () {
      _should2.default.ok(Formatter.validateStringByType('flowerpunk', 'letter'));
      _should2.default.ok(Formatter.validateStringByType('asY', 'letter'));
      _should2.default.ok(Formatter.validateStringByType('324', 'number'));
      _should2.default.ok(Formatter.validateStringByType('a', 'letter'));
      _should2.default.ok(Formatter.validateStringByType('200motels', 'either'));
      _should2.default.ok(Formatter.validateStringByType('1', 'either'));
    });

    it('should return false if string does not match specified type', function () {
      _should2.default.ifError(Formatter.validateStringByType('1', 'letter'));
      _should2.default.ifError(Formatter.validateStringByType('12Q', 'number'));
      _should2.default.ifError(Formatter.validateStringByType('s2&i', 'either'));
      _should2.default.ifError(Formatter.validateStringByType('aa%', 'letter'));
      _should2.default.ifError(Formatter.validateStringByType('', 'either'));
    });
  });

  describe('removeJunk', function () {
    it('should remove characters from the begining of a string until a target char is found', function () {
      _should2.default.deepEqual(Formatter.removeJunk('asd11', 'number'), '11');
      _should2.default.deepEqual(Formatter.removeJunk('82 _!32Q22', 'letter'), 'Q22');
      _should2.default.deepEqual(Formatter.removeJunk('!!!a1', 'either'), 'a1');
    });
  });

  describe('construct', function () {
    var construct = Formatter.construct('23as2s2-dw2', Formatter.tokenize('999-99-9999'), '23as2s2-dw2');
    var constructAlien = Formatter.construct('aaa23232', Formatter.tokenize('a-999999', 'b'));
    var constructDob = Formatter.construct('12261991', Formatter.tokenize('99/99/9999'));
    var constructEmpty = Formatter.construct('', Formatter.tokenize('999-99-9999'));

    it('should format a string according to an array of tokens', function () {
      _should2.default.deepEqual(construct, '232-22-');
      _should2.default.deepEqual(constructAlien, 'a-23232');
      _should2.default.deepEqual(constructDob, '12/26/1991');
      _should2.default.deepEqual(constructEmpty, '');
    });
  });

  describe('format', function () {
    it('should format a string according to a pattern', function () {
      _should2.default.deepEqual(Formatter.format('111111111', '999-99-9999'), '111-11-1111');
      _should2.default.deepEqual(Formatter.format('123-4-aasdd.56_789', '999-99-9999'), '123-45-6789');
      _should2.default.deepEqual(Formatter.format('1234567890a', 'td-9999999a'), 'td-1234567a');
      _should2.default.deepEqual(Formatter.format('1234567890', '(999)999-9999'), '(123)456-7890');
      _should2.default.deepEqual(Formatter.format('(123)456-7890', '999 999 9999'), '123 456 7890');
      _should2.default.deepEqual(Formatter.format('kjlw32!a', '****-****'), 'kjlw-32a');
      _should2.default.deepEqual(Formatter.format('qwerty', 'aaa'), 'qwe');
      _should2.default.deepEqual(Formatter.format('d233x', ''), '');
      _should2.default.deepEqual(Formatter.format('12/26/1991', '99/99/9999'), '12/26/1991');
      _should2.default.deepEqual(Formatter.format('', '001 999 999 9999'), '001 ');

      var formatCreditCard = function formatCreditCard(str) {
        return Formatter.format(str, '9999 9999 9999 9999');
      };
      _should2.default.deepEqual(formatCreditCard('1234567890'), '1234 5678 90');
    });
  });

  describe('formatDollars', function () {
    it('should correctly format sting into dollar representation', function () {
      _should2.default.deepEqual(Formatter.formatDollars('sd400000a'), '$400,000');
      _should2.default.deepEqual(Formatter.formatDollars('sd40000000a'), '$40,000,000');
      _should2.default.deepEqual(Formatter.formatDollars('sda'), '');
      _should2.default.deepEqual(Formatter.formatDollars('sd400a'), '$400');
    });
  });
});