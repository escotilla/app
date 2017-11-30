'use strict';

var _formatter = require('../../src/utilities/formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Formatter', function () {
  describe('validateStringByType', function () {
    it('should return true if string matches type (letter, number, either)', function () {
      _should2.default.ok(_formatter2.default.validateStringByType('flowerpunk', 'letter'));
      _should2.default.ok(_formatter2.default.validateStringByType('asY', 'letter'));
      _should2.default.ok(_formatter2.default.validateStringByType('324', 'number'));
      _should2.default.ok(_formatter2.default.validateStringByType('a', 'letter'));
      _should2.default.ok(_formatter2.default.validateStringByType('200motels', 'either'));
      _should2.default.ok(_formatter2.default.validateStringByType('1', 'either'));
    });

    it('should return false if string does not match specified type', function () {
      _should2.default.ifError(_formatter2.default.validateStringByType('1', 'letter'));
      _should2.default.ifError(_formatter2.default.validateStringByType('12Q', 'number'));
      _should2.default.ifError(_formatter2.default.validateStringByType('s2&i', 'either'));
      _should2.default.ifError(_formatter2.default.validateStringByType('aa%', 'letter'));
      _should2.default.ifError(_formatter2.default.validateStringByType('', 'either'));
    });
  });

  describe('removeJunk', function () {
    it('should remove characters from the begining of a string until a target char is found', function () {
      _should2.default.deepEqual(_formatter2.default.removeJunk('asd11', 'number'), '11');
      _should2.default.deepEqual(_formatter2.default.removeJunk('82 _!32Q22', 'letter'), 'Q22');
      _should2.default.deepEqual(_formatter2.default.removeJunk('!!!a1', 'either'), 'a1');
    });
  });

  describe('construct', function () {
    var construct = _formatter2.default.construct('23as2s2-dw2', _formatter2.default.tokenize('999-99-9999'), '23as2s2-dw2');
    var constructAlien = _formatter2.default.construct('aaa23232', _formatter2.default.tokenize('a-999999', 'b'));
    var constructDob = _formatter2.default.construct('12261991', _formatter2.default.tokenize('99/99/9999'));
    var constructEmpty = _formatter2.default.construct('', _formatter2.default.tokenize('999-99-9999'));

    it('should format a string according to an array of tokens', function () {
      _should2.default.deepEqual(construct, '232-22-');
      _should2.default.deepEqual(constructAlien, 'a-23232');
      _should2.default.deepEqual(constructDob, '12/26/1991');
      _should2.default.deepEqual(constructEmpty, '');
    });
  });

  describe('format', function () {
    it('should format a string according to a pattern', function () {
      _should2.default.deepEqual(_formatter2.default.format('111111111', '999-99-9999'), '111-11-1111');
      _should2.default.deepEqual(_formatter2.default.format('123-4-aasdd.56_789', '999-99-9999'), '123-45-6789');
      _should2.default.deepEqual(_formatter2.default.format('1234567890a', 'td-9999999a'), 'td-1234567a');
      _should2.default.deepEqual(_formatter2.default.format('1234567890', '(999)999-9999'), '(123)456-7890');
      _should2.default.deepEqual(_formatter2.default.format('(123)456-7890', '999 999 9999'), '123 456 7890');
      _should2.default.deepEqual(_formatter2.default.format('kjlw32!a', '****-****'), 'kjlw-32a');
      _should2.default.deepEqual(_formatter2.default.format('qwerty', 'aaa'), 'qwe');
      _should2.default.deepEqual(_formatter2.default.format('d233x', ''), '');
      _should2.default.deepEqual(_formatter2.default.format('12/26/1991', '99/99/9999'), '12/26/1991');
      _should2.default.deepEqual(_formatter2.default.format('', '001 999 999 9999'), '001 ');

      var formatCreditCard = function formatCreditCard(str) {
        return _formatter2.default.format(str, '9999 9999 9999 9999');
      };
      _should2.default.deepEqual(formatCreditCard('1234567890'), '1234 5678 90');
    });
  });

  describe('formatDollars', function () {
    it('should correctly format sting into dollar representation', function () {
      _should2.default.deepEqual(_formatter2.default.formatDollars('sd400000a'), '$400,000');
      _should2.default.deepEqual(_formatter2.default.formatDollars('sd40000000a'), '$40,000,000');
      _should2.default.deepEqual(_formatter2.default.formatDollars('sda'), '');
      _should2.default.deepEqual(_formatter2.default.formatDollars('sd400a'), '$400');
    });
  });
});