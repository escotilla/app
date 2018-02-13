'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tokenize = tokenize;
exports.getToken = getToken;
exports.construct = construct;
exports.removeJunk = removeJunk;
exports.format = format;
exports.reverse = reverse;
exports.formatPhone = formatPhone;
exports.formatDate = formatDate;
exports.stringEmpty = stringEmpty;
exports.formatNumber = formatNumber;
exports.formatDollars = formatDollars;
exports.isLetter = isLetter;
exports.isNumber = isNumber;
exports.isEither = isEither;
exports.validateStringByType = validateStringByType;
/**
 * Provides methods to format strings according to a pattern
 */

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
function tokenize(pattern) {
  var letter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'a';
  var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '9';
  var either = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '*';

  return pattern.split('').map(function (character) {
    switch (character) {
      case letter:
        return getToken('input', 'letter');
      case number:
        return getToken('input', 'number');
      case either:
        return getToken('input', 'either');
      default:
        return getToken('constant', character);
    }
  });
}

function getToken(type, value) {
  return { type: type, value: value };
}
/**
 * @param {string} input
 * @param {Array <object>} tokens
 * @return {string} Formatted string
 *
 * Construct a formatted string using an array of tokens
 */
function construct(input, tokens) {
  return tokens.reduce(function (formatted, token, index) {
    if (token.type === 'constant' && formatted.length > index - 1) {
      formatted += token.value;
    } else if (token.type === 'input') {
      input = removeJunk(input, token.value);

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
function removeJunk(str, target) {
  while (!validateStringByType(str[0], target) && str.length > 0) {
    str = str.substring(1, str.length);
  }

  return str;
}

function format(str, format) {
  return construct(str, tokenize(format));
}

function reverse(str) {
  return str.split('').reverse().join('');
}

function formatPhone(str) {
  return format(str, '(999)999-9999');
}

function formatDate(str) {
  return format(str, '99/99/9999');
}

function stringEmpty(str) {
  return typeof str === 'undefined' || str.length === 0 || str.toString().replace(/[^\d]+/gi, '').length === 0;
}

/**
 * Formats a string into its readable number representation
 *
 * ie. a pattern of unknown length
 */
function formatNumber(str) {
  if (stringEmpty(str)) {
    return '';
  }

  str = str.toString().replace(/[^\d]+/gi, '');

  var pattern = '999';

  for (var i = 1; i < str.length / 3; i++) {
    pattern += ',999';
  }

  return reverse(format(reverse(str), pattern));
}

function formatDollars(str) {
  if (stringEmpty(str)) {
    return '';
  }

  return '$' + formatNumber(str);
}

function isLetter(str) {
  return !/[^a-z]/i.test(str);
}

function isNumber(str) {
  return !/[^\d]/i.test(str);
}

function isEither(str) {
  return !/[^a-z0-9]/i.test(str);
}

function validateStringByType(str, type) {
  if (!str || str.length === 0) {
    return false;
  }

  switch (type) {
    case 'number':
      return isNumber(str);
    case 'letter':
      return isLetter(str);
    case 'either':
      return isEither(str);
    default:
      return false;
  }
}