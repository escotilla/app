/**
 * Provides methods to format strings according to a pattern
 */
export default class Formatter {

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
  static tokenize(pattern,
                  letter = 'a',
                  number = '9',
                  either = '*') {
    return pattern.split('').map((character) => {
      switch (character) {
        case letter:
          return this.getToken('input', 'letter');
        case number:
          return this.getToken('input', 'number');
        case either:
          return this.getToken('input', 'either');
        default:
          return this.getToken('constant', character);
      }
    });
  }

  static getToken(type, value) {
    return {type: type, value: value};
  }
  /**
   * @param {string} input
   * @param {Array <object>} tokens
   * @return {string} Formatted string
   *
   * Construct a formatted string using an array of tokens
   */
  static construct(input, tokens) {
    return tokens.reduce((formatted, token, index) => {
      if (token.type === 'constant' && formatted.length > index - 1) {
        formatted += token.value;
      } else if (token.type === 'input') {
        input = this.removeJunk(input, token.value);

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
  static removeJunk(str, target) {
    while (!this.validateStringByType(str[0], target) && str.length > 0) {
      str = str.substring(1, str.length);
    }

    return str;
  }

  static format(str, format) {
    return this.construct(str, this.tokenize(format));
  }

  static reverse(str) {
    return str.split('').reverse().join('');
  }

  static formatPhone(str) {
    return this.format(str, '(999)999-9999');
  }

  static formatDate(str) {
    return this.format(str, '99/99/9999');
  }


  static stringEmpty(str) {
    return typeof str === 'undefined' || str.length === 0 || str.toString().replace(/[^\d]+/gi, '').length === 0;
  }

  /**
   * Formats a string into its readable number representation
   *
   * ie. a pattern of unknown length
   */
  static formatNumber(str) {
    if (this.stringEmpty(str)) {
      return '';
    }

    str = str.toString().replace(/[^\d]+/gi, '');

    let pattern = '999';

    for (let i = 1; i < str.length / 3; i++) {
      pattern += ',999';
    }

    return this.reverse(this.format(this.reverse(str), pattern));
  }

  static formatDollars(str) {
    if (this.stringEmpty(str)) {
      return '';
    }

    return '$' + this.formatNumber(str);
  }

  static isLetter(str) {
    return !/[^a-z]/i.test(str);
  }

  static isNumber(str) {
    return !/[^\d]/i.test(str);
  }

  static isEither(str) {
    return !/[^a-z0-9]/i.test(str);
  }

  static validateStringByType(str, type) {
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
}
