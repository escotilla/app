'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides methods to format strings according to a pattern
 */
var Formatter = function () {
  function Formatter() {
    _classCallCheck(this, Formatter);
  }

  _createClass(Formatter, null, [{
    key: 'tokenize',


    /**
     * Separates a pattern of inputs and constants into array of tokens
     *
     * e.g. '(999)999-9999' for numbers
     *      'a9a 9a9' for letters and numbers
     *      '****-****-****-****' for letters or numbers
     *
     * @param pattern
     * @param letter Character to represent letter input
     * @param number Character to represent number input
     * @param either Character to represent number/letter input
     * @return {Array}
     */
    value: function tokenize(pattern) {
      var letter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'a';

      var _this = this;

      var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '9';
      var either = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '*';

      return pattern.split('').map(function (character) {
        switch (character) {
          case letter:
            return _this.getToken('input', 'letter');
          case number:
            return _this.getToken('input', 'number');
          case either:
            return _this.getToken('input', 'either');
          default:
            return _this.getToken('constant', character);
        }
      });
    }
  }, {
    key: 'getToken',
    value: function getToken(type, value) {
      return { type: type, value: value };
    }
    /**
     * @param {string} input
     * @param {Array <object>} tokens
     * @return {string} Formatted string
     *
     * Construct a formatted string using an array of tokens
     */

  }, {
    key: 'construct',
    value: function construct(input, tokens) {
      var _this2 = this;

      return tokens.reduce(function (formatted, token, index) {
        if (token.type === 'constant' && formatted.length > index - 1) {
          formatted += token.value;
        } else if (token.type === 'input') {
          input = _this2.removeJunk(input, token.value);

          if (input.length > 0) {
            formatted += input[0];
            input = input.substring(1, input.length);
          }
        }

        return formatted;
      }, '');
    }

    /**
     * Iterate through string and remove junk chars, stops when target is found
     */

  }, {
    key: 'removeJunk',
    value: function removeJunk(str, target) {
      while (!this.validateStringByType(str[0], target) && str.length > 0) {
        str = str.substring(1, str.length);
      }

      return str;
    }
  }, {
    key: 'format',
    value: function format(str, _format) {
      return this.construct(str, this.tokenize(_format));
    }
  }, {
    key: 'reverse',
    value: function reverse(str) {
      return str.split('').reverse().join('');
    }
  }, {
    key: 'formatPhone',
    value: function formatPhone(str) {
      return this.format(str, '(999)999-9999');
    }
  }, {
    key: 'formatDate',
    value: function formatDate(str) {
      return this.format(str, '99/99/9999');
    }
  }, {
    key: 'stringEmpty',
    value: function stringEmpty(str) {
      return typeof str === 'undefined' || str.length === 0 || str.toString().replace(/[^\d]+/gi, '').length === 0;
    }

    /**
     * Formats a string into its readable number representation
     *
     * ie. a pattern of unknown length
     */

  }, {
    key: 'formatNumber',
    value: function formatNumber(str) {
      if (this.stringEmpty(str)) {
        return '';
      }

      str = str.toString().replace(/[^\d]+/gi, '');

      var pattern = '999';

      for (var i = 1; i < str.length / 3; i++) {
        pattern += ',999';
      }

      return this.reverse(this.format(this.reverse(str), pattern));
    }
  }, {
    key: 'formatDollars',
    value: function formatDollars(str) {
      if (this.stringEmpty(str)) {
        return '';
      }

      return '$' + this.formatNumber(str);
    }
  }, {
    key: 'isLetter',
    value: function isLetter(str) {
      return !/[^a-z]/i.test(str);
    }
  }, {
    key: 'isNumber',
    value: function isNumber(str) {
      return !/[^\d]/i.test(str);
    }
  }, {
    key: 'isEither',
    value: function isEither(str) {
      return !/[^a-z0-9]/i.test(str);
    }
  }, {
    key: 'validateStringByType',
    value: function validateStringByType(str, type) {
      if (!str || str.length === 0) {
        return false;
      }

      switch (type) {
        case 'number':
          return this.isNumber(str);
        case 'letter':
          return this.isLetter(str);
        case 'either':
          return this.isEither(str);
        default:
          return false;
      }
    }
  }]);

  return Formatter;
}();

exports.default = Formatter;