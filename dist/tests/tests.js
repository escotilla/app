(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":1,"ieee754":4,"isarray":3}],3:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var t = _interopDefault(require('should-type'));

function format(msg) {
  var args = arguments;
  for (var i = 1, l = args.length; i < l; i++) {
    msg = msg.replace(/%s/, args[i]);
  }
  return msg;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

function EqualityFail(a, b, reason, path) {
  this.a = a;
  this.b = b;
  this.reason = reason;
  this.path = path;
}

function typeToString(tp) {
  return tp.type + (tp.cls ? "(" + tp.cls + (tp.sub ? " " + tp.sub : "") + ")" : "");
}

var PLUS_0_AND_MINUS_0 = "+0 is not equal to -0";
var DIFFERENT_TYPES = "A has type %s and B has type %s";
var EQUALITY = "A is not equal to B";
var EQUALITY_PROTOTYPE = "A and B have different prototypes";
var WRAPPED_VALUE = "A wrapped value is not equal to B wrapped value";
var FUNCTION_SOURCES = "function A is not equal to B by source code value (via .toString call)";
var MISSING_KEY = "%s has no key %s";
var SET_MAP_MISSING_KEY = "Set/Map missing key %s";

var DEFAULT_OPTIONS = {
  checkProtoEql: true,
  checkSubType: true,
  plusZeroAndMinusZeroEqual: true,
  collectAllFails: false
};

function setBooleanDefault(property, obj, opts, defaults) {
  obj[property] = typeof opts[property] !== "boolean" ? defaults[property] : opts[property];
}

var METHOD_PREFIX = "_check_";

function EQ(opts, a, b, path) {
  opts = opts || {};

  setBooleanDefault("checkProtoEql", this, opts, DEFAULT_OPTIONS);
  setBooleanDefault("plusZeroAndMinusZeroEqual", this, opts, DEFAULT_OPTIONS);
  setBooleanDefault("checkSubType", this, opts, DEFAULT_OPTIONS);
  setBooleanDefault("collectAllFails", this, opts, DEFAULT_OPTIONS);

  this.a = a;
  this.b = b;

  this._meet = opts._meet || [];

  this.fails = opts.fails || [];

  this.path = path || [];
}

function ShortcutError(fail) {
  this.name = "ShortcutError";
  this.message = "fail fast";
  this.fail = fail;
}

ShortcutError.prototype = Object.create(Error.prototype);

EQ.checkStrictEquality = function(a, b) {
  this.collectFail(a !== b, EQUALITY);
};

EQ.add = function add(type, cls, sub, f) {
  var args = Array.prototype.slice.call(arguments);
  f = args.pop();
  EQ.prototype[METHOD_PREFIX + args.join("_")] = f;
};

EQ.prototype = {
  check: function() {
    try {
      this.check0();
    } catch (e) {
      if (e instanceof ShortcutError) {
        return [e.fail];
      }
      throw e;
    }
    return this.fails;
  },

  check0: function() {
    var a = this.a;
    var b = this.b;

    // equal a and b exit early
    if (a === b) {
      // check for +0 !== -0;
      return this.collectFail(a === 0 && 1 / a !== 1 / b && !this.plusZeroAndMinusZeroEqual, PLUS_0_AND_MINUS_0);
    }

    var typeA = t(a);
    var typeB = t(b);

    // if objects has different types they are not equal
    if (typeA.type !== typeB.type || typeA.cls !== typeB.cls || typeA.sub !== typeB.sub) {
      return this.collectFail(true, format(DIFFERENT_TYPES, typeToString(typeA), typeToString(typeB)));
    }

    // as types the same checks type specific things
    var name1 = typeA.type,
      name2 = typeA.type;
    if (typeA.cls) {
      name1 += "_" + typeA.cls;
      name2 += "_" + typeA.cls;
    }
    if (typeA.sub) {
      name2 += "_" + typeA.sub;
    }

    var f =
      this[METHOD_PREFIX + name2] ||
      this[METHOD_PREFIX + name1] ||
      this[METHOD_PREFIX + typeA.type] ||
      this.defaultCheck;

    f.call(this, this.a, this.b);
  },

  collectFail: function(comparison, reason, showReason) {
    if (comparison) {
      var res = new EqualityFail(this.a, this.b, reason, this.path);
      res.showReason = !!showReason;

      this.fails.push(res);

      if (!this.collectAllFails) {
        throw new ShortcutError(res);
      }
    }
  },

  checkPlainObjectsEquality: function(a, b) {
    // compare deep objects and arrays
    // stacks contain references only
    //
    var meet = this._meet;
    var m = this._meet.length;
    while (m--) {
      var st = meet[m];
      if (st[0] === a && st[1] === b) {
        return;
      }
    }

    // add `a` and `b` to the stack of traversed objects
    meet.push([a, b]);

    // TODO maybe something else like getOwnPropertyNames
    var key;
    for (key in b) {
      if (hasOwnProperty.call(b, key)) {
        if (hasOwnProperty.call(a, key)) {
          this.checkPropertyEquality(key);
        } else {
          this.collectFail(true, format(MISSING_KEY, "A", key));
        }
      }
    }

    // ensure both objects have the same number of properties
    for (key in a) {
      if (hasOwnProperty.call(a, key)) {
        this.collectFail(!hasOwnProperty.call(b, key), format(MISSING_KEY, "B", key));
      }
    }

    meet.pop();

    if (this.checkProtoEql) {
      //TODO should i check prototypes for === or use eq?
      this.collectFail(Object.getPrototypeOf(a) !== Object.getPrototypeOf(b), EQUALITY_PROTOTYPE, true);
    }
  },

  checkPropertyEquality: function(propertyName) {
    var _eq = new EQ(this, this.a[propertyName], this.b[propertyName], this.path.concat([propertyName]));
    _eq.check0();
  },

  defaultCheck: EQ.checkStrictEquality
};

EQ.add(t.NUMBER, function(a, b) {
  this.collectFail((a !== a && b === b) || (b !== b && a === a) || (a !== b && a === a && b === b), EQUALITY);
});

[t.SYMBOL, t.BOOLEAN, t.STRING].forEach(function(tp) {
  EQ.add(tp, EQ.checkStrictEquality);
});

EQ.add(t.FUNCTION, function(a, b) {
  // functions are compared by their source code
  this.collectFail(a.toString() !== b.toString(), FUNCTION_SOURCES);
  // check user properties
  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.REGEXP, function(a, b) {
  // check regexp flags
  var flags = ["source", "global", "multiline", "lastIndex", "ignoreCase", "sticky", "unicode"];
  while (flags.length) {
    this.checkPropertyEquality(flags.shift());
  }
  // check user properties
  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.DATE, function(a, b) {
  //check by timestamp only (using .valueOf)
  this.collectFail(+a !== +b, EQUALITY);
  // check user properties
  this.checkPlainObjectsEquality(a, b);
});

[t.NUMBER, t.BOOLEAN, t.STRING].forEach(function(tp) {
  EQ.add(t.OBJECT, tp, function(a, b) {
    //primitive type wrappers
    this.collectFail(a.valueOf() !== b.valueOf(), WRAPPED_VALUE);
    // check user properties
    this.checkPlainObjectsEquality(a, b);
  });
});

EQ.add(t.OBJECT, function(a, b) {
  this.checkPlainObjectsEquality(a, b);
});

[t.ARRAY, t.ARGUMENTS, t.TYPED_ARRAY].forEach(function(tp) {
  EQ.add(t.OBJECT, tp, function(a, b) {
    this.checkPropertyEquality("length");

    this.checkPlainObjectsEquality(a, b);
  });
});

EQ.add(t.OBJECT, t.ARRAY_BUFFER, function(a, b) {
  this.checkPropertyEquality("byteLength");

  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.ERROR, function(a, b) {
  this.checkPropertyEquality("name");
  this.checkPropertyEquality("message");

  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.BUFFER, function(a) {
  this.checkPropertyEquality("length");

  var l = a.length;
  while (l--) {
    this.checkPropertyEquality(l);
  }

  //we do not check for user properties because
  //node Buffer have some strange hidden properties
});

function checkMapByKeys(a, b) {
  var iteratorA = a.keys();

  for (var nextA = iteratorA.next(); !nextA.done; nextA = iteratorA.next()) {
    var key = nextA.value;
    var hasKey = b.has(key);
    this.collectFail(!hasKey, format(SET_MAP_MISSING_KEY, key));

    if (hasKey) {
      var valueB = b.get(key);
      var valueA = a.get(key);

      eq(valueA, valueB, this);
    }
  }
}

function checkSetByKeys(a, b) {
  var iteratorA = a.keys();

  for (var nextA = iteratorA.next(); !nextA.done; nextA = iteratorA.next()) {
    var key = nextA.value;
    var hasKey = b.has(key);
    this.collectFail(!hasKey, format(SET_MAP_MISSING_KEY, key));
  }
}

EQ.add(t.OBJECT, t.MAP, function(a, b) {
  this._meet.push([a, b]);

  checkMapByKeys.call(this, a, b);
  checkMapByKeys.call(this, b, a);

  this._meet.pop();

  this.checkPlainObjectsEquality(a, b);
});
EQ.add(t.OBJECT, t.SET, function(a, b) {
  this._meet.push([a, b]);

  checkSetByKeys.call(this, a, b);
  checkSetByKeys.call(this, b, a);

  this._meet.pop();

  this.checkPlainObjectsEquality(a, b);
});

function eq(a, b, opts) {
  return new EQ(opts, a, b).check();
}

eq.EQ = EQ;

module.exports = eq;
},{"should-type":8}],6:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var t = _interopDefault(require('should-type'));
var shouldTypeAdaptors = require('should-type-adaptors');

function looksLikeANumber(n) {
  return !!n.match(/\d+/);
}

function keyCompare(a, b) {
  var aNum = looksLikeANumber(a);
  var bNum = looksLikeANumber(b);
  if (aNum && bNum) {
    return 1*a - 1*b;
  } else if (aNum && !bNum) {
    return -1;
  } else if (!aNum && bNum) {
    return 1;
  } else {
    return a.localeCompare(b);
  }
}

function genKeysFunc(f) {
  return function(value) {
    var k = f(value);
    k.sort(keyCompare);
    return k;
  };
}

function Formatter(opts) {
  opts = opts || {};

  this.seen = [];

  var keysFunc;
  if (typeof opts.keysFunc === 'function') {
    keysFunc = opts.keysFunc;
  } else if (opts.keys === false) {
    keysFunc = Object.getOwnPropertyNames;
  } else {
    keysFunc = Object.keys;
  }

  this.getKeys = genKeysFunc(keysFunc);

  this.maxLineLength = typeof opts.maxLineLength === 'number' ? opts.maxLineLength : 60;
  this.propSep = opts.propSep || ',';

  this.isUTCdate = !!opts.isUTCdate;
}



Formatter.prototype = {
  constructor: Formatter,

  format: function(value) {
    var tp = t(value);

    if (this.alreadySeen(value)) {
      return '[Circular]';
    }

    var tries = tp.toTryTypes();
    var f = this.defaultFormat;
    while (tries.length) {
      var toTry = tries.shift();
      var name = Formatter.formatterFunctionName(toTry);
      if (this[name]) {
        f = this[name];
        break;
      }
    }
    return f.call(this, value).trim();
  },

  defaultFormat: function(obj) {
    return String(obj);
  },

  alreadySeen: function(value) {
    return this.seen.indexOf(value) >= 0;
  }

};

Formatter.addType = function addType(tp, f) {
  Formatter.prototype[Formatter.formatterFunctionName(tp)] = f;
};

Formatter.formatterFunctionName = function formatterFunctionName(tp) {
  return '_format_' + tp.toString('_');
};

var EOL = '\n';

function indent(v, indentation) {
  return v
    .split(EOL)
    .map(function(vv) {
      return indentation + vv;
    })
    .join(EOL);
}

function pad(str, value, filler) {
  str = String(str);
  var isRight = false;

  if (value < 0) {
    isRight = true;
    value = -value;
  }

  if (str.length < value) {
    var padding = new Array(value - str.length + 1).join(filler);
    return isRight ? str + padding : padding + str;
  } else {
    return str;
  }
}

function pad0(str, value) {
  return pad(str, value, '0');
}

var functionNameRE = /^\s*function\s*(\S*)\s*\(/;

function functionName(f) {
  if (f.name) {
    return f.name;
  }
  var matches = f.toString().match(functionNameRE);
  if (matches === null) {
    // `functionNameRE` doesn't match arrow functions.
    return '';
  }
  var name = matches[1];
  return name;
}

function constructorName(obj) {
  while (obj) {
    var descriptor = Object.getOwnPropertyDescriptor(obj, 'constructor');
    if (descriptor !== undefined &&  typeof descriptor.value === 'function') {
      var name = functionName(descriptor.value);
      if (name !== '') {
        return name;
      }
    }

    obj = Object.getPrototypeOf(obj);
  }
}

var INDENT = '  ';

function addSpaces(str) {
  return indent(str, INDENT);
}

function typeAdaptorForEachFormat(obj, opts) {
  opts = opts || {};
  var filterKey = opts.filterKey || function() { return true; };

  var formatKey = opts.formatKey || this.format;
  var formatValue = opts.formatValue || this.format;

  var keyValueSep = typeof opts.keyValueSep !== 'undefined' ? opts.keyValueSep : ': ';

  this.seen.push(obj);

  var formatLength = 0;
  var pairs = [];

  shouldTypeAdaptors.forEach(obj, function(value, key) {
    if (!filterKey(key)) {
      return;
    }

    var formattedKey = formatKey.call(this, key);
    var formattedValue = formatValue.call(this, value, key);

    var pair = formattedKey ? (formattedKey + keyValueSep + formattedValue) : formattedValue;

    formatLength += pair.length;
    pairs.push(pair);
  }, this);

  this.seen.pop();

  (opts.additionalKeys || []).forEach(function(keyValue) {
    var pair = keyValue[0] + keyValueSep + this.format(keyValue[1]);
    formatLength += pair.length;
    pairs.push(pair);
  }, this);

  var prefix = opts.prefix || constructorName(obj) || '';
  if (prefix.length > 0) {
    prefix += ' ';
  }

  var lbracket, rbracket;
  if (Array.isArray(opts.brackets)) {
    lbracket = opts.brackets[0];
    rbracket = opts.brackets[1];
  } else {
    lbracket = '{';
    rbracket = '}';
  }

  var rootValue = opts.value || '';

  if (pairs.length === 0) {
    return rootValue || (prefix + lbracket + rbracket);
  }

  if (formatLength <= this.maxLineLength) {
    return prefix + lbracket + ' ' + (rootValue ? rootValue + ' ' : '') + pairs.join(this.propSep + ' ') + ' ' + rbracket;
  } else {
    return prefix + lbracket + '\n' + (rootValue ? '  ' + rootValue + '\n' : '') + pairs.map(addSpaces).join(this.propSep + '\n') + '\n' + rbracket;
  }
}

function formatPlainObjectKey(key) {
  return typeof key === 'string' && key.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/) ? key : this.format(key);
}

function getPropertyDescriptor(obj, key) {
  var desc;
  try {
    desc = Object.getOwnPropertyDescriptor(obj, key) || { value: obj[key] };
  } catch (e) {
    desc = { value: e };
  }
  return desc;
}

function formatPlainObjectValue(obj, key) {
  var desc = getPropertyDescriptor(obj, key);
  if (desc.get && desc.set) {
    return '[Getter/Setter]';
  }
  if (desc.get) {
    return '[Getter]';
  }
  if (desc.set) {
    return '[Setter]';
  }

  return this.format(desc.value);
}

function formatPlainObject(obj, opts) {
  opts = opts || {};
  opts.keyValueSep = ': ';
  opts.formatKey = opts.formatKey || formatPlainObjectKey;
  opts.formatValue = opts.formatValue || function(value, key) {
    return formatPlainObjectValue.call(this, obj, key);
  };
  return typeAdaptorForEachFormat.call(this, obj, opts);
}

function formatWrapper1(value) {
  return formatPlainObject.call(this, value, {
    additionalKeys: [['[[PrimitiveValue]]', value.valueOf()]]
  });
}


function formatWrapper2(value) {
  var realValue = value.valueOf();

  return formatPlainObject.call(this, value, {
    filterKey: function(key) {
      //skip useless indexed properties
      return !(key.match(/\d+/) && parseInt(key, 10) < realValue.length);
    },
    additionalKeys: [['[[PrimitiveValue]]', realValue]]
  });
}

function formatRegExp(value) {
  return formatPlainObject.call(this, value, {
    value: String(value)
  });
}

function formatFunction(value) {
  return formatPlainObject.call(this, value, {
    prefix: 'Function',
    additionalKeys: [['name', functionName(value)]]
  });
}

function formatArray(value) {
  return formatPlainObject.call(this, value, {
    formatKey: function(key) {
      if (!key.match(/\d+/)) {
        return formatPlainObjectKey.call(this, key);
      }
    },
    brackets: ['[', ']']
  });
}

function formatArguments(value) {
  return formatPlainObject.call(this, value, {
    formatKey: function(key) {
      if (!key.match(/\d+/)) {
        return formatPlainObjectKey.call(this, key);
      }
    },
    brackets: ['[', ']'],
    prefix: 'Arguments'
  });
}

function _formatDate(value, isUTC) {
  var prefix = isUTC ? 'UTC' : '';

  var date = value['get' + prefix + 'FullYear']() +
    '-' +
    pad0(value['get' + prefix + 'Month']() + 1, 2) +
    '-' +
    pad0(value['get' + prefix + 'Date'](), 2);

  var time = pad0(value['get' + prefix + 'Hours'](), 2) +
    ':' +
    pad0(value['get' + prefix + 'Minutes'](), 2) +
    ':' +
    pad0(value['get' + prefix + 'Seconds'](), 2) +
    '.' +
    pad0(value['get' + prefix + 'Milliseconds'](), 3);

  var to = value.getTimezoneOffset();
  var absTo = Math.abs(to);
  var hours = Math.floor(absTo / 60);
  var minutes = absTo - hours * 60;
  var tzFormat = (to < 0 ? '+' : '-') + pad0(hours, 2) + pad0(minutes, 2);

  return date + ' ' + time + (isUTC ? '' : ' ' + tzFormat);
}

function formatDate(value) {
  return formatPlainObject.call(this, value, { value: _formatDate(value, this.isUTCdate) });
}

function formatError(value) {
  return formatPlainObject.call(this, value, {
    prefix: value.name,
    additionalKeys: [['message', value.message]]
  });
}

function generateFormatForNumberArray(lengthProp, name, padding) {
  return function(value) {
    var max = this.byteArrayMaxLength || 50;
    var length = value[lengthProp];
    var formattedValues = [];
    var len = 0;
    for (var i = 0; i < max && i < length; i++) {
      var b = value[i] || 0;
      var v = pad0(b.toString(16), padding);
      len += v.length;
      formattedValues.push(v);
    }
    var prefix = value.constructor.name || name || '';
    if (prefix) {
      prefix += ' ';
    }

    if (formattedValues.length === 0) {
      return prefix + '[]';
    }

    if (len <= this.maxLineLength) {
      return prefix + '[ ' + formattedValues.join(this.propSep + ' ') + ' ' + ']';
    } else {
      return prefix + '[\n' + formattedValues.map(addSpaces).join(this.propSep + '\n') + '\n' + ']';
    }
  };
}

function formatMap(obj) {
  return typeAdaptorForEachFormat.call(this, obj, {
    keyValueSep: ' => '
  });
}

function formatSet(obj) {
  return typeAdaptorForEachFormat.call(this, obj, {
    keyValueSep: '',
    formatKey: function() { return ''; }
  });
}

function genSimdVectorFormat(constructorName, length) {
  return function(value) {
    var Constructor = value.constructor;
    var extractLane = Constructor.extractLane;

    var len = 0;
    var props = [];

    for (var i = 0; i < length; i ++) {
      var key = this.format(extractLane(value, i));
      len += key.length;
      props.push(key);
    }

    if (len <= this.maxLineLength) {
      return constructorName + ' [ ' + props.join(this.propSep + ' ') + ' ]';
    } else {
      return constructorName + ' [\n' + props.map(addSpaces).join(this.propSep + '\n') + '\n' + ']';
    }
  };
}

function defaultFormat(value, opts) {
  return new Formatter(opts).format(value);
}

defaultFormat.Formatter = Formatter;
defaultFormat.addSpaces = addSpaces;
defaultFormat.pad0 = pad0;
defaultFormat.functionName = functionName;
defaultFormat.constructorName = constructorName;
defaultFormat.formatPlainObjectKey = formatPlainObjectKey;
defaultFormat.formatPlainObject = formatPlainObject;
defaultFormat.typeAdaptorForEachFormat = typeAdaptorForEachFormat;
// adding primitive types
Formatter.addType(new t.Type(t.UNDEFINED), function() {
  return 'undefined';
});
Formatter.addType(new t.Type(t.NULL), function() {
  return 'null';
});
Formatter.addType(new t.Type(t.BOOLEAN), function(value) {
  return value ? 'true': 'false';
});
Formatter.addType(new t.Type(t.SYMBOL), function(value) {
  return value.toString();
});
Formatter.addType(new t.Type(t.NUMBER), function(value) {
  if (value === 0 && 1 / value < 0) {
    return '-0';
  }
  return String(value);
});

Formatter.addType(new t.Type(t.STRING), function(value) {
  return '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
      .replace(/'/g, "\\'")
      .replace(/\\"/g, '"') + '\'';
});

Formatter.addType(new t.Type(t.FUNCTION), formatFunction);

// plain object
Formatter.addType(new t.Type(t.OBJECT), formatPlainObject);

// type wrappers
Formatter.addType(new t.Type(t.OBJECT, t.NUMBER), formatWrapper1);
Formatter.addType(new t.Type(t.OBJECT, t.BOOLEAN), formatWrapper1);
Formatter.addType(new t.Type(t.OBJECT, t.STRING), formatWrapper2);

Formatter.addType(new t.Type(t.OBJECT, t.REGEXP), formatRegExp);
Formatter.addType(new t.Type(t.OBJECT, t.ARRAY), formatArray);
Formatter.addType(new t.Type(t.OBJECT, t.ARGUMENTS), formatArguments);
Formatter.addType(new t.Type(t.OBJECT, t.DATE), formatDate);
Formatter.addType(new t.Type(t.OBJECT, t.ERROR), formatError);
Formatter.addType(new t.Type(t.OBJECT, t.SET), formatSet);
Formatter.addType(new t.Type(t.OBJECT, t.MAP), formatMap);
Formatter.addType(new t.Type(t.OBJECT, t.WEAK_MAP), formatMap);
Formatter.addType(new t.Type(t.OBJECT, t.WEAK_SET), formatSet);

Formatter.addType(new t.Type(t.OBJECT, t.BUFFER), generateFormatForNumberArray('length', 'Buffer', 2));

Formatter.addType(new t.Type(t.OBJECT, t.ARRAY_BUFFER), generateFormatForNumberArray('byteLength', 'ArrayBuffer', 2));

Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'int8'), generateFormatForNumberArray('length', 'Int8Array', 2));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint8'), generateFormatForNumberArray('length', 'Uint8Array', 2));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint8clamped'), generateFormatForNumberArray('length', 'Uint8ClampedArray', 2));

Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'int16'), generateFormatForNumberArray('length', 'Int16Array', 4));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint16'), generateFormatForNumberArray('length', 'Uint16Array', 4));

Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'int32'), generateFormatForNumberArray('length', 'Int32Array', 8));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint32'), generateFormatForNumberArray('length', 'Uint32Array', 8));

Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'bool16x8'), genSimdVectorFormat('Bool16x8', 8));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'bool32x4'), genSimdVectorFormat('Bool32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'bool8x16'), genSimdVectorFormat('Bool8x16', 16));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'float32x4'), genSimdVectorFormat('Float32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'int16x8'), genSimdVectorFormat('Int16x8', 8));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'int32x4'), genSimdVectorFormat('Int32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'int8x16'), genSimdVectorFormat('Int8x16', 16));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'uint16x8'), genSimdVectorFormat('Uint16x8', 8));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'uint32x4'), genSimdVectorFormat('Uint32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'uint8x16'), genSimdVectorFormat('Uint8x16', 16));


Formatter.addType(new t.Type(t.OBJECT, t.PROMISE), function() {
  return '[Promise]';//TODO it could be nice to inspect its state and value
});

Formatter.addType(new t.Type(t.OBJECT, t.XHR), function() {
  return '[XMLHttpRequest]';//TODO it could be nice to inspect its state
});

Formatter.addType(new t.Type(t.OBJECT, t.HTML_ELEMENT), function(value) {
  return value.outerHTML;
});

Formatter.addType(new t.Type(t.OBJECT, t.HTML_ELEMENT, '#text'), function(value) {
  return value.nodeValue;
});

Formatter.addType(new t.Type(t.OBJECT, t.HTML_ELEMENT, '#document'), function(value) {
  return value.documentElement.outerHTML;
});

Formatter.addType(new t.Type(t.OBJECT, t.HOST), function() {
  return '[Host]';
});

module.exports = defaultFormat;
},{"should-type":8,"should-type-adaptors":7}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var shouldUtil = require('should-util');
var t = _interopDefault(require('should-type'));

// TODO in future add generators instead of forEach and iterator implementation


function ObjectIterator(obj) {
  this._obj = obj;
}

ObjectIterator.prototype = {
  __shouldIterator__: true, // special marker

  next: function() {
    if (this._done) {
      throw new Error('Iterator already reached the end');
    }

    if (!this._keys) {
      this._keys = Object.keys(this._obj);
      this._index = 0;
    }

    var key = this._keys[this._index];
    this._done = this._index === this._keys.length;
    this._index += 1;

    return {
      value: this._done ? void 0: [key, this._obj[key]],
      done: this._done
    };
  }
};

if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
  ObjectIterator.prototype[Symbol.iterator] = function() {
    return this;
  };
}


function TypeAdaptorStorage() {
  this._typeAdaptors = [];
  this._iterableTypes = {};
}

TypeAdaptorStorage.prototype = {
  add: function(type, cls, sub, adaptor) {
    return this.addType(new t.Type(type, cls, sub), adaptor);
  },

  addType: function(type, adaptor) {
    this._typeAdaptors[type.toString()] = adaptor;
  },

  getAdaptor: function(tp, funcName) {
    var tries = tp.toTryTypes();
    while (tries.length) {
      var toTry = tries.shift();
      var ad = this._typeAdaptors[toTry];
      if (ad && ad[funcName]) {
        return ad[funcName];
      }
    }
  },

  requireAdaptor: function(tp, funcName) {
    var a = this.getAdaptor(tp, funcName);
    if (!a) {
      throw new Error('There is no type adaptor `' + funcName + '` for ' + tp.toString());
    }
    return a;
  },

  addIterableType: function(tp) {
    this._iterableTypes[tp.toString()] = true;
  },

  isIterableType: function(tp) {
    return !!this._iterableTypes[tp.toString()];
  }
};

var defaultTypeAdaptorStorage = new TypeAdaptorStorage();

var objectAdaptor = {
  forEach: function(obj, f, context) {
    for (var prop in obj) {
      if (shouldUtil.hasOwnProperty(obj, prop) && shouldUtil.propertyIsEnumerable(obj, prop)) {
        if (f.call(context, obj[prop], prop, obj) === false) {
          return;
        }
      }
    }
  },

  has: function(obj, prop) {
    return shouldUtil.hasOwnProperty(obj, prop);
  },

  get: function(obj, prop) {
    return obj[prop];
  },

  iterator: function(obj) {
    return new ObjectIterator(obj);
  }
};

// default for objects
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT), objectAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.FUNCTION), objectAdaptor);

var mapAdaptor = {
  has: function(obj, key) {
    return obj.has(key);
  },

  get: function(obj, key) {
    return obj.get(key);
  },

  forEach: function(obj, f, context) {
    var iter = obj.entries();
    forEach(iter, function(value) {
      return f.call(context, value[1], value[0], obj);
    });
  },

  size: function(obj) {
    return obj.size;
  },

  isEmpty: function(obj) {
    return obj.size === 0;
  },

  iterator: function(obj) {
    return obj.entries();
  }
};

var setAdaptor = shouldUtil.merge({}, mapAdaptor);
setAdaptor.get = function(obj, key) {
  if (obj.has(key)) {
    return key;
  }
};

defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.MAP), mapAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.SET), setAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.WEAK_SET), setAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.WEAK_MAP), mapAdaptor);

defaultTypeAdaptorStorage.addType(new t.Type(t.STRING), {
  isEmpty: function(obj) {
    return obj === '';
  },

  size: function(obj) {
    return obj.length;
  }
});

defaultTypeAdaptorStorage.addIterableType(new t.Type(t.OBJECT, t.ARRAY));
defaultTypeAdaptorStorage.addIterableType(new t.Type(t.OBJECT, t.ARGUMENTS));

function forEach(obj, f, context) {
  if (shouldUtil.isGeneratorFunction(obj)) {
    return forEach(obj(), f, context);
  } else if (shouldUtil.isIterator(obj)) {
    var value = obj.next();
    while (!value.done) {
      if (f.call(context, value.value, 'value', obj) === false) {
        return;
      }
      value = obj.next();
    }
  } else {
    var type = t(obj);
    var func = defaultTypeAdaptorStorage.requireAdaptor(type, 'forEach');
    func(obj, f, context);
  }
}


function size(obj) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.getAdaptor(type, 'size');
  if (func) {
    return func(obj);
  } else {
    var len = 0;
    forEach(obj, function() {
      len += 1;
    });
    return len;
  }
}

function isEmpty(obj) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.getAdaptor(type, 'isEmpty');
  if (func) {
    return func(obj);
  } else {
    var res = true;
    forEach(obj, function() {
      res = false;
      return false;
    });
    return res;
  }
}

// return boolean if obj has such 'key'
function has(obj, key) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.requireAdaptor(type, 'has');
  return func(obj, key);
}

// return value for given key
function get(obj, key) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.requireAdaptor(type, 'get');
  return func(obj, key);
}

function reduce(obj, f, initialValue) {
  var res = initialValue;
  forEach(obj, function(value, key) {
    res = f(res, value, key, obj);
  });
  return res;
}

function some(obj, f, context) {
  var res = false;
  forEach(obj, function(value, key) {
    if (f.call(context, value, key, obj)) {
      res = true;
      return false;
    }
  }, context);
  return res;
}

function every(obj, f, context) {
  var res = true;
  forEach(obj, function(value, key) {
    if (!f.call(context, value, key, obj)) {
      res = false;
      return false;
    }
  }, context);
  return res;
}

function isIterable(obj) {
  return defaultTypeAdaptorStorage.isIterableType(t(obj));
}

function iterator(obj) {
  return defaultTypeAdaptorStorage.requireAdaptor(t(obj), 'iterator')(obj);
}

exports.defaultTypeAdaptorStorage = defaultTypeAdaptorStorage;
exports.forEach = forEach;
exports.size = size;
exports.isEmpty = isEmpty;
exports.has = has;
exports.get = get;
exports.reduce = reduce;
exports.some = some;
exports.every = every;
exports.isIterable = isIterable;
exports.iterator = iterator;
},{"should-type":8,"should-util":9}],8:[function(require,module,exports){
(function (Buffer){
'use strict';

var types = {
  NUMBER: 'number',
  UNDEFINED: 'undefined',
  STRING: 'string',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  FUNCTION: 'function',
  NULL: 'null',
  ARRAY: 'array',
  REGEXP: 'regexp',
  DATE: 'date',
  ERROR: 'error',
  ARGUMENTS: 'arguments',
  SYMBOL: 'symbol',
  ARRAY_BUFFER: 'array-buffer',
  TYPED_ARRAY: 'typed-array',
  DATA_VIEW: 'data-view',
  MAP: 'map',
  SET: 'set',
  WEAK_SET: 'weak-set',
  WEAK_MAP: 'weak-map',
  PROMISE: 'promise',

// node buffer
  BUFFER: 'buffer',

// dom html element
  HTML_ELEMENT: 'html-element',
  HTML_ELEMENT_TEXT: 'html-element-text',
  DOCUMENT: 'document',
  WINDOW: 'window',
  FILE: 'file',
  FILE_LIST: 'file-list',
  BLOB: 'blob',

  HOST: 'host',

  XHR: 'xhr',

  // simd
  SIMD: 'simd'
};

/*
 * Simple data function to store type information
 * @param {string} type Usually what is returned from typeof
 * @param {string} cls  Sanitized @Class via Object.prototype.toString
 * @param {string} sub  If type and cls the same, and need to specify somehow
 * @private
 * @example
 *
 * //for null
 * new Type('null');
 *
 * //for Date
 * new Type('object', 'date');
 *
 * //for Uint8Array
 *
 * new Type('object', 'typed-array', 'uint8');
 */
function Type(type, cls, sub) {
  if (!type) {
    throw new Error('Type class must be initialized at least with `type` information');
  }
  this.type = type;
  this.cls = cls;
  this.sub = sub;
}

Type.prototype = {
  toString: function(sep) {
    sep = sep || ';';
    var str = [this.type];
    if (this.cls) {
      str.push(this.cls);
    }
    if (this.sub) {
      str.push(this.sub);
    }
    return str.join(sep);
  },

  toTryTypes: function() {
    var _types = [];
    if (this.sub) {
      _types.push(new Type(this.type, this.cls, this.sub));
    }
    if (this.cls) {
      _types.push(new Type(this.type, this.cls));
    }
    _types.push(new Type(this.type));

    return _types;
  }
};

var toString = Object.prototype.toString;



/**
 * Function to store type checks
 * @private
 */
function TypeChecker() {
  this.checks = [];
}

TypeChecker.prototype = {
  add: function(func) {
    this.checks.push(func);
    return this;
  },

  addBeforeFirstMatch: function(obj, func) {
    var match = this.getFirstMatch(obj);
    if (match) {
      this.checks.splice(match.index, 0, func);
    } else {
      this.add(func);
    }
  },

  addTypeOf: function(type, res) {
    return this.add(function(obj, tpeOf) {
      if (tpeOf === type) {
        return new Type(res);
      }
    });
  },

  addClass: function(cls, res, sub) {
    return this.add(function(obj, tpeOf, objCls) {
      if (objCls === cls) {
        return new Type(types.OBJECT, res, sub);
      }
    });
  },

  getFirstMatch: function(obj) {
    var typeOf = typeof obj;
    var cls = toString.call(obj);

    for (var i = 0, l = this.checks.length; i < l; i++) {
      var res = this.checks[i].call(this, obj, typeOf, cls);
      if (typeof res !== 'undefined') {
        return { result: res, func: this.checks[i], index: i };
      }
    }
  },

  getType: function(obj) {
    var match = this.getFirstMatch(obj);
    return match && match.result;
  }
};

var main = new TypeChecker();

//TODO add iterators

main
  .addTypeOf(types.NUMBER, types.NUMBER)
  .addTypeOf(types.UNDEFINED, types.UNDEFINED)
  .addTypeOf(types.STRING, types.STRING)
  .addTypeOf(types.BOOLEAN, types.BOOLEAN)
  .addTypeOf(types.FUNCTION, types.FUNCTION)
  .addTypeOf(types.SYMBOL, types.SYMBOL)
  .add(function(obj) {
    if (obj === null) {
      return new Type(types.NULL);
    }
  })
  .addClass('[object String]', types.STRING)
  .addClass('[object Boolean]', types.BOOLEAN)
  .addClass('[object Number]', types.NUMBER)
  .addClass('[object Array]', types.ARRAY)
  .addClass('[object RegExp]', types.REGEXP)
  .addClass('[object Error]', types.ERROR)
  .addClass('[object Date]', types.DATE)
  .addClass('[object Arguments]', types.ARGUMENTS)

  .addClass('[object ArrayBuffer]', types.ARRAY_BUFFER)
  .addClass('[object Int8Array]', types.TYPED_ARRAY, 'int8')
  .addClass('[object Uint8Array]', types.TYPED_ARRAY, 'uint8')
  .addClass('[object Uint8ClampedArray]', types.TYPED_ARRAY, 'uint8clamped')
  .addClass('[object Int16Array]', types.TYPED_ARRAY, 'int16')
  .addClass('[object Uint16Array]', types.TYPED_ARRAY, 'uint16')
  .addClass('[object Int32Array]', types.TYPED_ARRAY, 'int32')
  .addClass('[object Uint32Array]', types.TYPED_ARRAY, 'uint32')
  .addClass('[object Float32Array]', types.TYPED_ARRAY, 'float32')
  .addClass('[object Float64Array]', types.TYPED_ARRAY, 'float64')

  .addClass('[object Bool16x8]', types.SIMD, 'bool16x8')
  .addClass('[object Bool32x4]', types.SIMD, 'bool32x4')
  .addClass('[object Bool8x16]', types.SIMD, 'bool8x16')
  .addClass('[object Float32x4]', types.SIMD, 'float32x4')
  .addClass('[object Int16x8]', types.SIMD, 'int16x8')
  .addClass('[object Int32x4]', types.SIMD, 'int32x4')
  .addClass('[object Int8x16]', types.SIMD, 'int8x16')
  .addClass('[object Uint16x8]', types.SIMD, 'uint16x8')
  .addClass('[object Uint32x4]', types.SIMD, 'uint32x4')
  .addClass('[object Uint8x16]', types.SIMD, 'uint8x16')

  .addClass('[object DataView]', types.DATA_VIEW)
  .addClass('[object Map]', types.MAP)
  .addClass('[object WeakMap]', types.WEAK_MAP)
  .addClass('[object Set]', types.SET)
  .addClass('[object WeakSet]', types.WEAK_SET)
  .addClass('[object Promise]', types.PROMISE)
  .addClass('[object Blob]', types.BLOB)
  .addClass('[object File]', types.FILE)
  .addClass('[object FileList]', types.FILE_LIST)
  .addClass('[object XMLHttpRequest]', types.XHR)
  .add(function(obj) {
    if ((typeof Promise === types.FUNCTION && obj instanceof Promise) ||
        (typeof obj.then === types.FUNCTION)) {
          return new Type(types.OBJECT, types.PROMISE);
        }
  })
  .add(function(obj) {
    if (typeof Buffer !== 'undefined' && obj instanceof Buffer) {// eslint-disable-line no-undef
      return new Type(types.OBJECT, types.BUFFER);
    }
  })
  .add(function(obj) {
    if (typeof Node !== 'undefined' && obj instanceof Node) {
      return new Type(types.OBJECT, types.HTML_ELEMENT, obj.nodeName);
    }
  })
  .add(function(obj) {
    // probably at the begginging should be enough these checks
    if (obj.Boolean === Boolean && obj.Number === Number && obj.String === String && obj.Date === Date) {
      return new Type(types.OBJECT, types.HOST);
    }
  })
  .add(function() {
    return new Type(types.OBJECT);
  });

/**
 * Get type information of anything
 *
 * @param  {any} obj Anything that could require type information
 * @return {Type}    type info
 * @private
 */
function getGlobalType(obj) {
  return main.getType(obj);
}

getGlobalType.checker = main;
getGlobalType.TypeChecker = TypeChecker;
getGlobalType.Type = Type;

Object.keys(types).forEach(function(typeName) {
  getGlobalType[typeName] = types[typeName];
});

module.exports = getGlobalType;
}).call(this,require("buffer").Buffer)

},{"buffer":2}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

function hasOwnProperty(obj, key) {
  return _hasOwnProperty.call(obj, key);
}

function propertyIsEnumerable(obj, key) {
  return _propertyIsEnumerable.call(obj, key);
}

function merge(a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
}

function isIterator(obj) {
  if (!obj) {
    return false;
  }

  if (obj.__shouldIterator__) {
    return true;
  }

  return typeof obj.next === 'function' &&
    typeof Symbol === 'function' &&
    typeof Symbol.iterator === 'symbol' &&
    typeof obj[Symbol.iterator] === 'function' &&
    obj[Symbol.iterator]() === obj;
}

//TODO find better way
function isGeneratorFunction(f) {
  return typeof f === 'function' && /^function\s*\*\s*/.test(f.toString());
}

exports.hasOwnProperty = hasOwnProperty;
exports.propertyIsEnumerable = propertyIsEnumerable;
exports.merge = merge;
exports.isIterator = isIterator;
exports.isGeneratorFunction = isGeneratorFunction;
},{}],10:[function(require,module,exports){
(function (global){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var getType = _interopDefault(require('should-type'));
var eql = _interopDefault(require('should-equal'));
var sformat$1 = _interopDefault(require('should-format'));
var shouldTypeAdaptors = require('should-type-adaptors');
var shouldUtil = require('should-util');

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
function isWrapperType(obj) {
  return obj instanceof Number || obj instanceof String || obj instanceof Boolean;
}

// XXX make it more strict: numbers, strings, symbols - and nothing else
function convertPropertyName(name) {
  return typeof name === "symbol" ? name : String(name);
}

var functionName = sformat$1.functionName;

function isPlainObject(obj) {
  if (typeof obj == "object" && obj !== null) {
    var proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }

  return false;
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var config = {
  typeAdaptors: shouldTypeAdaptors.defaultTypeAdaptorStorage,

  getFormatter: function(opts) {
    return new sformat$1.Formatter(opts || config);
  }
};

function format(value, opts) {
  return config.getFormatter(opts).format(value);
}

function formatProp(value) {
  var formatter = config.getFormatter();
  return sformat$1.formatPlainObjectKey.call(formatter, value);
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
/**
 * should AssertionError
 * @param {Object} options
 * @constructor
 * @memberOf should
 * @static
 */
function AssertionError(options) {
  shouldUtil.merge(this, options);

  if (!options.message) {
    Object.defineProperty(this, "message", {
      get: function() {
        if (!this._message) {
          this._message = this.generateMessage();
          this.generatedMessage = true;
        }
        return this._message;
      },
      configurable: true,
      enumerable: false
    });
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      if (this.stackStartFunction) {
        // try to strip useless frames
        var fn_name = functionName(this.stackStartFunction);
        var idx = out.indexOf("\n" + fn_name);
        if (idx >= 0) {
          // once we have located the function frame
          // we need to strip out everything before it (and its line)
          var next_line = out.indexOf("\n", idx + 1);
          out = out.substring(next_line + 1);
        }
      }

      this.stack = out;
    }
  }
}

var indent = "    ";
function prependIndent(line) {
  return indent + line;
}

function indentLines(text) {
  return text
    .split("\n")
    .map(prependIndent)
    .join("\n");
}

// assert.AssertionError instanceof Error
AssertionError.prototype = Object.create(Error.prototype, {
  name: {
    value: "AssertionError"
  },

  generateMessage: {
    value: function() {
      if (!this.operator && this.previous) {
        return this.previous.message;
      }
      var actual = format(this.actual);
      var expected = "expected" in this ? " " + format(this.expected) : "";
      var details =
        "details" in this && this.details ? " (" + this.details + ")" : "";

      var previous = this.previous
        ? "\n" + indentLines(this.previous.message)
        : "";

      return (
        "expected " +
        actual +
        (this.negate ? " not " : " ") +
        this.operator +
        expected +
        details +
        previous
      );
    }
  }
});

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

// a bit hacky way how to get error to do not have stack
function LightAssertionError(options) {
  shouldUtil.merge(this, options);

  if (!options.message) {
    Object.defineProperty(this, "message", {
      get: function() {
        if (!this._message) {
          this._message = this.generateMessage();
          this.generatedMessage = true;
        }
        return this._message;
      }
    });
  }
}

LightAssertionError.prototype = {
  generateMessage: AssertionError.prototype.generateMessage
};

/**
 * should Assertion
 * @param {*} obj Given object for assertion
 * @constructor
 * @memberOf should
 * @static
 */
function Assertion(obj) {
  this.obj = obj;

  this.anyOne = false;
  this.negate = false;

  this.params = { actual: obj };
}

Assertion.prototype = {
  constructor: Assertion,

  /**
   * Base method for assertions.
   *
   * Before calling this method need to fill Assertion#params object. This method usually called from other assertion methods.
   * `Assertion#params` can contain such properties:
   * * `operator` - required string containing description of this assertion
   * * `obj` - optional replacement for this.obj, it usefull if you prepare more clear object then given
   * * `message` - if this property filled with string any others will be ignored and this one used as assertion message
   * * `expected` - any object used when you need to assert relation between given object and expected. Like given == expected (== is a relation)
   * * `details` - additional string with details to generated message
   *
   * @memberOf Assertion
   * @category assertion
   * @param {*} expr Any expression that will be used as a condition for asserting.
   * @example
   *
   * var a = new should.Assertion(42);
   *
   * a.params = {
   *  operator: 'to be magic number',
   * }
   *
   * a.assert(false);
   * //throws AssertionError: expected 42 to be magic number
   */
  assert: function(expr) {
    if (expr) {
      return this;
    }

    var params = this.params;

    if ("obj" in params && !("actual" in params)) {
      params.actual = params.obj;
    } else if (!("obj" in params) && !("actual" in params)) {
      params.actual = this.obj;
    }

    params.stackStartFunction = params.stackStartFunction || this.assert;
    params.negate = this.negate;

    params.assertion = this;

    if (this.light) {
      throw new LightAssertionError(params);
    } else {
      throw new AssertionError(params);
    }
  },

  /**
   * Shortcut for `Assertion#assert(false)`.
   *
   * @memberOf Assertion
   * @category assertion
   * @example
   *
   * var a = new should.Assertion(42);
   *
   * a.params = {
   *  operator: 'to be magic number',
   * }
   *
   * a.fail();
   * //throws AssertionError: expected 42 to be magic number
   */
  fail: function() {
    return this.assert(false);
  },

  assertZeroArguments: function(args) {
    if (args.length !== 0) {
      throw new TypeError("This assertion does not expect any arguments. You may need to check your code");
    }
  }
};

/**
 * Assertion used to delegate calls of Assertion methods inside of Promise.
 * It has almost all methods of Assertion.prototype
 *
 * @param {Promise} obj
 */
function PromisedAssertion(/* obj */) {
  Assertion.apply(this, arguments);
}

/**
 * Make PromisedAssertion to look like promise. Delegate resolve and reject to given promise.
 *
 * @private
 * @returns {Promise}
 */
PromisedAssertion.prototype.then = function(resolve, reject) {
  return this.obj.then(resolve, reject);
};

/**
 * Way to extend Assertion function. It uses some logic
 * to define only positive assertions and itself rule with negative assertion.
 *
 * All actions happen in subcontext and this method take care about negation.
 * Potentially we can add some more modifiers that does not depends from state of assertion.
 *
 * @memberOf Assertion
 * @static
 * @param {String} name Name of assertion. It will be used for defining method or getter on Assertion.prototype
 * @param {Function} func Function that will be called on executing assertion
 * @example
 *
 * Assertion.add('asset', function() {
 *      this.params = { operator: 'to be asset' }
 *
 *      this.obj.should.have.property('id').which.is.a.Number()
 *      this.obj.should.have.property('path')
 * })
 */
Assertion.add = function(name, func) {
  Object.defineProperty(Assertion.prototype, name, {
    enumerable: true,
    configurable: true,
    value: function() {
      var context = new Assertion(this.obj, this, name);
      context.anyOne = this.anyOne;
      context.onlyThis = this.onlyThis;
      // hack
      context.light = true;

      try {
        func.apply(context, arguments);
      } catch (e) {
        // check for fail
        if (e instanceof AssertionError || e instanceof LightAssertionError) {
          // negative fail
          if (this.negate) {
            this.obj = context.obj;
            this.negate = false;
            return this;
          }

          if (context !== e.assertion) {
            context.params.previous = e;
          }

          // positive fail
          context.negate = false;
          // hack
          context.light = false;
          context.fail();
        }
        // throw if it is another exception
        throw e;
      }

      // negative pass
      if (this.negate) {
        context.negate = true; // because .fail will set negate
        context.params.details = "false negative fail";
        // hack
        context.light = false;
        context.fail();
      }

      // positive pass
      if (!this.params.operator) {
        this.params = context.params; // shortcut
      }
      this.obj = context.obj;
      this.negate = false;
      return this;
    }
  });

  Object.defineProperty(PromisedAssertion.prototype, name, {
    enumerable: true,
    configurable: true,
    value: function() {
      var args = arguments;
      this.obj = this.obj.then(function(a) {
        return a[name].apply(a, args);
      });

      return this;
    }
  });
};

/**
 * Add chaining getter to Assertion like .a, .which etc
 *
 * @memberOf Assertion
 * @static
 * @param  {string} name   name of getter
 * @param  {function} [onCall] optional function to call
 */
Assertion.addChain = function(name, onCall) {
  onCall = onCall || function() {};
  Object.defineProperty(Assertion.prototype, name, {
    get: function() {
      onCall.call(this);
      return this;
    },
    enumerable: true
  });

  Object.defineProperty(PromisedAssertion.prototype, name, {
    enumerable: true,
    configurable: true,
    get: function() {
      this.obj = this.obj.then(function(a) {
        return a[name];
      });

      return this;
    }
  });
};

/**
 * Create alias for some `Assertion` property
 *
 * @memberOf Assertion
 * @static
 * @param {String} from Name of to map
 * @param {String} to Name of alias
 * @example
 *
 * Assertion.alias('true', 'True')
 */
Assertion.alias = function(from, to) {
  var desc = Object.getOwnPropertyDescriptor(Assertion.prototype, from);
  if (!desc) {
    throw new Error("Alias " + from + " -> " + to + " could not be created as " + from + " not defined");
  }
  Object.defineProperty(Assertion.prototype, to, desc);

  var desc2 = Object.getOwnPropertyDescriptor(PromisedAssertion.prototype, from);
  if (desc2) {
    Object.defineProperty(PromisedAssertion.prototype, to, desc2);
  }
};
/**
 * Negation modifier. Current assertion chain become negated. Each call invert negation on current assertion.
 *
 * @name not
 * @property
 * @memberOf Assertion
 * @category assertion
 */
Assertion.addChain("not", function() {
  this.negate = !this.negate;
});

/**
 * Any modifier - it affect on execution of sequenced assertion to do not `check all`, but `check any of`.
 *
 * @name any
 * @property
 * @memberOf Assertion
 * @category assertion
 */
Assertion.addChain("any", function() {
  this.anyOne = true;
});

/**
 * Only modifier - currently used with .keys to check if object contains only exactly this .keys
 *
 * @name only
 * @property
 * @memberOf Assertion
 * @category assertion
 */
Assertion.addChain("only", function() {
  this.onlyThis = true;
});

// implement assert interface using already written peaces of should.js

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = ok;
// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.
/**
 * Node.js standard [`assert.fail`](http://nodejs.org/api/assert.html#assert_assert_fail_actual_expected_message_operator).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual Actual object
 * @param {*} expected Expected object
 * @param {string} message Message for assertion
 * @param {string} operator Operator text
 */
function fail(actual, expected, message, operator, stackStartFunction) {
  var a = new Assertion(actual);
  a.params = {
    operator: operator,
    expected: expected,
    message: message,
    stackStartFunction: stackStartFunction || fail
  };

  a.fail();
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.
/**
 * Node.js standard [`assert.ok`](http://nodejs.org/api/assert.html#assert_assert_value_message_assert_ok_value_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} value
 * @param {string} [message]
 */
function ok(value, message) {
  if (!value) {
    fail(value, true, message, "==", assert.ok);
  }
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

/**
 * Node.js standard [`assert.equal`](http://nodejs.org/api/assert.html#assert_assert_equal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.equal = function equal(actual, expected, message) {
  if (actual != expected) {
    fail(actual, expected, message, "==", assert.equal);
  }
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.notEqual`](http://nodejs.org/api/assert.html#assert_assert_notequal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, "!=", assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.deepEqual`](http://nodejs.org/api/assert.html#assert_assert_deepequal_actual_expected_message).
 * But uses should.js .eql implementation instead of Node.js own deepEqual.
 *
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.deepEqual = function deepEqual(actual, expected, message) {
  if (eql(actual, expected).length !== 0) {
    fail(actual, expected, message, "deepEqual", assert.deepEqual);
  }
};

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.notDeepEqual`](http://nodejs.org/api/assert.html#assert_assert_notdeepequal_actual_expected_message).
 * But uses should.js .eql implementation instead of Node.js own deepEqual.
 *
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (eql(actual, expected).result) {
    fail(actual, expected, message, "notDeepEqual", assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.strictEqual`](http://nodejs.org/api/assert.html#assert_assert_strictequal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, "===", assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.notStrictEqual`](http://nodejs.org/api/assert.html#assert_assert_notstrictequal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, "!==", assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == "[object RegExp]") {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected == "string") {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message =
    (expected && expected.name ? " (" + expected.name + ")" : ".") +
    (message ? " " + message : ".");

  if (shouldThrow && !actual) {
    fail(actual, expected, "Missing expected exception" + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, "Got unwanted exception" + message);
  }

  if (
    (shouldThrow &&
      actual &&
      expected &&
      !expectedException(actual, expected)) ||
    (!shouldThrow && actual)
  ) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);
/**
 * Node.js standard [`assert.throws`](http://nodejs.org/api/assert.html#assert_assert_throws_block_error_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {Function} block
 * @param {Function} [error]
 * @param {String} [message]
 */
assert.throws = function(/*block, error, message*/) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
/**
 * Node.js standard [`assert.doesNotThrow`](http://nodejs.org/api/assert.html#assert_assert_doesnotthrow_block_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {Function} block
 * @param {String} [message]
 */
assert.doesNotThrow = function(/*block, message*/) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

/**
 * Node.js standard [`assert.ifError`](http://nodejs.org/api/assert.html#assert_assert_iferror_value).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {Error} err
 */
assert.ifError = function(err) {
  if (err) {
    throw err;
  }
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var assertExtensions = function(should) {
  var i = should.format;

  /*
   * Expose assert to should
   *
   * This allows you to do things like below
   * without require()ing the assert module.
   *
   *    should.equal(foo.bar, undefined);
   *
   */
  shouldUtil.merge(should, assert);

  /**
   * Assert _obj_ exists, with optional message.
   *
   * @static
   * @memberOf should
   * @category assertion assert
   * @alias should.exists
   * @param {*} obj
   * @param {String} [msg]
   * @example
   *
   * should.exist(1);
   * should.exist(new Date());
   */
  should.exist = should.exists = function(obj, msg) {
    if (null == obj) {
      throw new AssertionError({
        message: msg || "expected " + i(obj) + " to exist",
        stackStartFunction: should.exist
      });
    }
  };

  should.not = {};
  /**
   * Asserts _obj_ does not exist, with optional message.
   *
   * @name not.exist
   * @static
   * @memberOf should
   * @category assertion assert
   * @alias should.not.exists
   * @param {*} obj
   * @param {String} [msg]
   * @example
   *
   * should.not.exist(null);
   * should.not.exist(void 0);
   */
  should.not.exist = should.not.exists = function(obj, msg) {
    if (null != obj) {
      throw new AssertionError({
        message: msg || "expected " + i(obj) + " to not exist",
        stackStartFunction: should.not.exist
      });
    }
  };
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var chainAssertions = function(should, Assertion) {
  /**
   * Simple chaining to improve readability. Does nothing.
   *
   * @memberOf Assertion
   * @name be
   * @property {should.Assertion} be
   * @alias Assertion#an
   * @alias Assertion#of
   * @alias Assertion#a
   * @alias Assertion#and
   * @alias Assertion#been
   * @alias Assertion#have
   * @alias Assertion#has
   * @alias Assertion#with
   * @alias Assertion#is
   * @alias Assertion#which
   * @alias Assertion#the
   * @alias Assertion#it
   * @category assertion chaining
   */
  [
    "an",
    "of",
    "a",
    "and",
    "be",
    "been",
    "has",
    "have",
    "with",
    "is",
    "which",
    "the",
    "it"
  ].forEach(function(name) {
    Assertion.addChain(name);
  });
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var booleanAssertions = function(should, Assertion) {
  /**
   * Assert given object is exactly `true`.
   *
   * @name true
   * @memberOf Assertion
   * @category assertion bool
   * @alias Assertion#True
   * @param {string} [message] Optional message
   * @example
   *
   * (true).should.be.true();
   * false.should.not.be.true();
   *
   * ({ a: 10}).should.not.be.true();
   */
  Assertion.add("true", function(message) {
    this.is.exactly(true, message);
  });

  Assertion.alias("true", "True");

  /**
   * Assert given object is exactly `false`.
   *
   * @name false
   * @memberOf Assertion
   * @category assertion bool
   * @alias Assertion#False
   * @param {string} [message] Optional message
   * @example
   *
   * (true).should.not.be.false();
   * false.should.be.false();
   */
  Assertion.add("false", function(message) {
    this.is.exactly(false, message);
  });

  Assertion.alias("false", "False");

  /**
   * Assert given object is truthy according javascript type conversions.
   *
   * @name ok
   * @memberOf Assertion
   * @category assertion bool
   * @example
   *
   * (true).should.be.ok();
   * ''.should.not.be.ok();
   * should(null).not.be.ok();
   * should(void 0).not.be.ok();
   *
   * (10).should.be.ok();
   * (0).should.not.be.ok();
   */
  Assertion.add("ok", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be truthy" };

    this.assert(this.obj);
  });
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var numberAssertions = function(should, Assertion) {
  /**
   * Assert given object is NaN
   * @name NaN
   * @memberOf Assertion
   * @category assertion numbers
   * @example
   *
   * (10).should.not.be.NaN();
   * NaN.should.be.NaN();
   */
  Assertion.add("NaN", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be NaN" };

    this.assert(this.obj !== this.obj);
  });

  /**
   * Assert given object is not finite (positive or negative)
   *
   * @name Infinity
   * @memberOf Assertion
   * @category assertion numbers
   * @example
   *
   * (10).should.not.be.Infinity();
   * NaN.should.not.be.Infinity();
   */
  Assertion.add("Infinity", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be Infinity" };

    this.is.a
      .Number()
      .and.not.a.NaN()
      .and.assert(!isFinite(this.obj));
  });

  /**
   * Assert given number between `start` and `finish` or equal one of them.
   *
   * @name within
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} start Start number
   * @param {number} finish Finish number
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.within(0, 20);
   */
  Assertion.add("within", function(start, finish, description) {
    this.params = {
      operator: "to be within " + start + ".." + finish,
      message: description
    };

    this.assert(this.obj >= start && this.obj <= finish);
  });

  /**
   * Assert given number near some other `value` within `delta`
   *
   * @name approximately
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} value Center number
   * @param {number} delta Radius
   * @param {string} [description] Optional message
   * @example
   *
   * (9.99).should.be.approximately(10, 0.1);
   */
  Assertion.add("approximately", function(value, delta, description) {
    this.params = {
      operator: "to be approximately " + value + " ±" + delta,
      message: description
    };

    this.assert(Math.abs(this.obj - value) <= delta);
  });

  /**
   * Assert given number above `n`.
   *
   * @name above
   * @alias Assertion#greaterThan
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.above(0);
   */
  Assertion.add("above", function(n, description) {
    this.params = { operator: "to be above " + n, message: description };

    this.assert(this.obj > n);
  });

  /**
   * Assert given number below `n`.
   *
   * @name below
   * @alias Assertion#lessThan
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (0).should.be.below(10);
   */
  Assertion.add("below", function(n, description) {
    this.params = { operator: "to be below " + n, message: description };

    this.assert(this.obj < n);
  });

  Assertion.alias("above", "greaterThan");
  Assertion.alias("below", "lessThan");

  /**
   * Assert given number above `n`.
   *
   * @name aboveOrEqual
   * @alias Assertion#greaterThanOrEqual
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.aboveOrEqual(0);
   * (10).should.be.aboveOrEqual(10);
   */
  Assertion.add("aboveOrEqual", function(n, description) {
    this.params = {
      operator: "to be above or equal " + n,
      message: description
    };

    this.assert(this.obj >= n);
  });

  /**
   * Assert given number below `n`.
   *
   * @name belowOrEqual
   * @alias Assertion#lessThanOrEqual
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (0).should.be.belowOrEqual(10);
   * (0).should.be.belowOrEqual(0);
   */
  Assertion.add("belowOrEqual", function(n, description) {
    this.params = {
      operator: "to be below or equal " + n,
      message: description
    };

    this.assert(this.obj <= n);
  });

  Assertion.alias("aboveOrEqual", "greaterThanOrEqual");
  Assertion.alias("belowOrEqual", "lessThanOrEqual");
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var typeAssertions = function(should, Assertion) {
  /**
   * Assert given object is number
   * @name Number
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Number", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a number" };

    this.have.type("number");
  });

  /**
   * Assert given object is arguments
   * @name arguments
   * @alias Assertion#Arguments
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("arguments", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be arguments" };

    this.have.class("Arguments");
  });

  Assertion.alias("arguments", "Arguments");

  /**
   * Assert given object has some type using `typeof`
   * @name type
   * @memberOf Assertion
   * @param {string} type Type name
   * @param {string} [description] Optional message
   * @category assertion types
   */
  Assertion.add("type", function(type, description) {
    this.params = { operator: "to have type " + type, message: description };

    should(typeof this.obj).be.exactly(type);
  });

  /**
   * Assert given object is instance of `constructor`
   * @name instanceof
   * @alias Assertion#instanceOf
   * @memberOf Assertion
   * @param {Function} constructor Constructor function
   * @param {string} [description] Optional message
   * @category assertion types
   */
  Assertion.add("instanceof", function(constructor, description) {
    this.params = {
      operator: "to be an instance of " + functionName(constructor),
      message: description
    };

    this.assert(Object(this.obj) instanceof constructor);
  });

  Assertion.alias("instanceof", "instanceOf");

  /**
   * Assert given object is function
   * @name Function
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Function", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a function" };

    this.have.type("function");
  });

  /**
   * Assert given object is object
   * @name Object
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Object", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be an object" };

    this.is.not.null().and.have.type("object");
  });

  /**
   * Assert given object is string
   * @name String
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("String", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a string" };

    this.have.type("string");
  });

  /**
   * Assert given object is array
   * @name Array
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Array", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be an array" };

    this.have.class("Array");
  });

  /**
   * Assert given object is boolean
   * @name Boolean
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Boolean", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a boolean" };

    this.have.type("boolean");
  });

  /**
   * Assert given object is error
   * @name Error
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Error", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be an error" };

    this.have.instanceOf(Error);
  });

  /**
   * Assert given object is a date
   * @name Date
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Date", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a date" };

    this.have.instanceOf(Date);
  });

  /**
   * Assert given object is null
   * @name null
   * @alias Assertion#Null
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("null", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be null" };

    this.assert(this.obj === null);
  });

  Assertion.alias("null", "Null");

  /**
   * Assert given object has some internal [[Class]], via Object.prototype.toString call
   * @name class
   * @alias Assertion#Class
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("class", function(cls) {
    this.params = { operator: "to have [[Class]] " + cls };

    this.assert(Object.prototype.toString.call(this.obj) === "[object " + cls + "]");
  });

  Assertion.alias("class", "Class");

  /**
   * Assert given object is undefined
   * @name undefined
   * @alias Assertion#Undefined
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("undefined", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be undefined" };

    this.assert(this.obj === void 0);
  });

  Assertion.alias("undefined", "Undefined");

  /**
   * Assert given object supports es6 iterable protocol (just check
   * that object has property Symbol.iterator, which is a function)
   * @name iterable
   * @memberOf Assertion
   * @category assertion es6
   */
  Assertion.add("iterable", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be iterable" };

    should(this.obj)
      .have.property(Symbol.iterator)
      .which.is.a.Function();
  });

  /**
   * Assert given object supports es6 iterator protocol (just check
   * that object has property next, which is a function)
   * @name iterator
   * @memberOf Assertion
   * @category assertion es6
   */
  Assertion.add("iterator", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be iterator" };

    should(this.obj)
      .have.property("next")
      .which.is.a.Function();
  });

  /**
   * Assert given object is a generator object
   * @name generator
   * @memberOf Assertion
   * @category assertion es6
   */
  Assertion.add("generator", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be generator" };

    should(this.obj).be.iterable.and.iterator.and.it.is.equal(this.obj[Symbol.iterator]());
  });
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function formatEqlResult(r, a, b) {
  return ((r.path.length > 0
    ? "at " + r.path.map(formatProp).join(" -> ")
    : "") +
    (r.a === a ? "" : ", A has " + format(r.a)) +
    (r.b === b ? "" : " and B has " + format(r.b)) +
    (r.showReason ? " because " + r.reason : "")).trim();
}

var equalityAssertions = function(should, Assertion) {
  /**
   * Deep object equality comparison. For full spec see [`should-equal tests`](https://github.com/shouldjs/equal/blob/master/test.js).
   *
   * @name eql
   * @memberOf Assertion
   * @category assertion equality
   * @alias Assertion#eqls
   * @alias Assertion#deepEqual
   * @param {*} val Expected value
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.eql(10);
   * ('10').should.not.be.eql(10);
   * (-0).should.not.be.eql(+0);
   *
   * NaN.should.be.eql(NaN);
   *
   * ({ a: 10}).should.be.eql({ a: 10 });
   * [ 'a' ].should.not.be.eql({ '0': 'a' });
   */
  Assertion.add("eql", function(val, description) {
    this.params = { operator: "to equal", expected: val, message: description };
    var obj = this.obj;
    var fails = eql(this.obj, val, should.config);
    this.params.details = fails
      .map(function(fail) {
        return formatEqlResult(fail, obj, val);
      })
      .join(", ");

    this.params.showDiff = eql(getType(obj), getType(val)).length === 0;

    this.assert(fails.length === 0);
  });

  /**
   * Exact comparison using ===.
   *
   * @name equal
   * @memberOf Assertion
   * @category assertion equality
   * @alias Assertion#equals
   * @alias Assertion#exactly
   * @param {*} val Expected value
   * @param {string} [description] Optional message
   * @example
   *
   * 10.should.be.equal(10);
   * 'a'.should.be.exactly('a');
   *
   * should(null).be.exactly(null);
   */
  Assertion.add("equal", function(val, description) {
    this.params = { operator: "to be", expected: val, message: description };

    this.params.showDiff = eql(getType(this.obj), getType(val)).length === 0;

    this.assert(val === this.obj);
  });

  Assertion.alias("equal", "equals");
  Assertion.alias("equal", "exactly");
  Assertion.alias("eql", "eqls");
  Assertion.alias("eql", "deepEqual");

  function addOneOf(name, message, method) {
    Assertion.add(name, function(vals) {
      if (arguments.length !== 1) {
        vals = Array.prototype.slice.call(arguments);
      } else {
        should(vals).be.Array();
      }

      this.params = { operator: message, expected: vals };

      var obj = this.obj;
      var found = false;

      shouldTypeAdaptors.forEach(vals, function(val) {
        try {
          should(val)[method](obj);
          found = true;
          return false;
        } catch (e) {
          if (e instanceof should.AssertionError) {
            return; //do nothing
          }
          throw e;
        }
      });

      this.assert(found);
    });
  }

  /**
   * Exact comparison using === to be one of supplied objects.
   *
   * @name equalOneOf
   * @memberOf Assertion
   * @category assertion equality
   * @param {Array|*} vals Expected values
   * @example
   *
   * 'ab'.should.be.equalOneOf('a', 10, 'ab');
   * 'ab'.should.be.equalOneOf(['a', 10, 'ab']);
   */
  addOneOf("equalOneOf", "to be equals one of", "equal");

  /**
   * Exact comparison using .eql to be one of supplied objects.
   *
   * @name oneOf
   * @memberOf Assertion
   * @category assertion equality
   * @param {Array|*} vals Expected values
   * @example
   *
   * ({a: 10}).should.be.oneOf('a', 10, 'ab', {a: 10});
   * ({a: 10}).should.be.oneOf(['a', 10, 'ab', {a: 10}]);
   */
  addOneOf("oneOf", "to be one of", "eql");
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var promiseAssertions = function(should, Assertion$$1) {
  /**
   * Assert given object is a Promise
   *
   * @name Promise
   * @memberOf Assertion
   * @category assertion promises
   * @example
   *
   * promise.should.be.Promise()
   * (new Promise(function(resolve, reject) { resolve(10); })).should.be.a.Promise()
   * (10).should.not.be.a.Promise()
   */
  Assertion$$1.add("Promise", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be promise" };

    var obj = this.obj;

    should(obj)
      .have.property("then")
      .which.is.a.Function();
  });

  /**
   * Assert given promise will be fulfilled. Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name fulfilled
   * @memberOf Assertion
   * @alias Assertion#resolved
   * @returns {Promise}
   * @category assertion promises
   * @example
   *
   * // don't forget to handle async nature
   * (new Promise(function(resolve, reject) { resolve(10); })).should.be.fulfilled();
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise(resolve => resolve(10))
   *      .should.be.fulfilled();
   * });
   */
  Assertion$$1.prototype.fulfilled = function Assertion$fulfilled() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be fulfilled" };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function next$onResolve(value) {
        if (that.negate) {
          that.fail();
        }
        return value;
      },
      function next$onReject(err) {
        if (!that.negate) {
          that.params.operator += ", but it was rejected with " + should.format(err);
          that.fail();
        }
        return err;
      }
    );
  };

  Assertion$$1.prototype.resolved = Assertion$$1.prototype.fulfilled;

  /**
   * Assert given promise will be rejected. Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name rejected
   * @memberOf Assertion
   * @category assertion promises
   * @returns {Promise}
   * @example
   *
   * // don't forget to handle async nature
   * (new Promise(function(resolve, reject) { resolve(10); }))
   *    .should.not.be.rejected();
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise((resolve, reject) => reject(new Error('boom')))
   *      .should.be.rejected();
   * });
   */
  Assertion$$1.prototype.rejected = function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be rejected" };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function(value) {
        if (!that.negate) {
          that.params.operator += ", but it was fulfilled";
          if (arguments.length != 0) {
            that.params.operator += " with " + should.format(value);
          }
          that.fail();
        }
        return value;
      },
      function next$onError(err) {
        if (that.negate) {
          that.fail();
        }
        return err;
      }
    );
  };

  /**
   * Assert given promise will be fulfilled with some expected value (value compared using .eql).
   * Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name fulfilledWith
   * @memberOf Assertion
   * @alias Assertion#resolvedWith
   * @category assertion promises
   * @returns {Promise}
   * @example
   *
   * // don't forget to handle async nature
   * (new Promise(function(resolve, reject) { resolve(10); }))
   *    .should.be.fulfilledWith(10);
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise((resolve, reject) => resolve(10))
   *       .should.be.fulfilledWith(10);
   * });
   */
  Assertion$$1.prototype.fulfilledWith = function(expectedValue) {
    this.params = {
      operator: "to be fulfilled with " + should.format(expectedValue)
    };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function(value) {
        if (that.negate) {
          that.fail();
        }
        should(value).eql(expectedValue);
        return value;
      },
      function next$onError(err) {
        if (!that.negate) {
          that.params.operator += ", but it was rejected with " + should.format(err);
          that.fail();
        }
        return err;
      }
    );
  };

  Assertion$$1.prototype.resolvedWith = Assertion$$1.prototype.fulfilledWith;

  /**
   * Assert given promise will be rejected with some sort of error. Arguments is the same for Assertion#throw.
   * Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name rejectedWith
   * @memberOf Assertion
   * @category assertion promises
   * @returns {Promise}
   * @example
   *
   * function failedPromise() {
   *   return new Promise(function(resolve, reject) {
   *     reject(new Error('boom'))
   *   })
   * }
   * failedPromise().should.be.rejectedWith(Error);
   * failedPromise().should.be.rejectedWith('boom');
   * failedPromise().should.be.rejectedWith(/boom/);
   * failedPromise().should.be.rejectedWith(Error, { message: 'boom' });
   * failedPromise().should.be.rejectedWith({ message: 'boom' });
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return failedPromise().should.be.rejectedWith({ message: 'boom' });
   * });
   */
  Assertion$$1.prototype.rejectedWith = function(message, properties) {
    this.params = { operator: "to be rejected" };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function(value) {
        if (!that.negate) {
          that.fail();
        }
        return value;
      },
      function next$onError(err) {
        if (that.negate) {
          that.fail();
        }

        var errorMatched = true;
        var errorInfo = "";

        if ("string" === typeof message) {
          errorMatched = message === err.message;
        } else if (message instanceof RegExp) {
          errorMatched = message.test(err.message);
        } else if ("function" === typeof message) {
          errorMatched = err instanceof message;
        } else if (message !== null && typeof message === "object") {
          try {
            should(err).match(message);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        if (!errorMatched) {
          if (typeof message === "string" || message instanceof RegExp) {
            errorInfo = " with a message matching " + should.format(message) + ", but got '" + err.message + "'";
          } else if ("function" === typeof message) {
            errorInfo = " of type " + functionName(message) + ", but got " + functionName(err.constructor);
          }
        } else if ("function" === typeof message && properties) {
          try {
            should(err).match(properties);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        that.params.operator += errorInfo;

        that.assert(errorMatched);

        return err;
      }
    );
  };

  /**
   * Assert given object is promise and wrap it in PromisedAssertion, which has all properties of Assertion.
   * That means you can chain as with usual Assertion.
   * Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name finally
   * @memberOf Assertion
   * @alias Assertion#eventually
   * @category assertion promises
   * @returns {PromisedAssertion} Like Assertion, but .then this.obj in Assertion
   * @example
   *
   * (new Promise(function(resolve, reject) { resolve(10); }))
   *    .should.be.eventually.equal(10);
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise(resolve => resolve(10))
   *      .should.be.finally.equal(10);
   * });
   */
  Object.defineProperty(Assertion$$1.prototype, "finally", {
    get: function() {
      should(this.obj).be.a.Promise();

      var that = this;

      return new PromisedAssertion(
        this.obj.then(function(obj) {
          var a = should(obj);

          a.negate = that.negate;
          a.anyOne = that.anyOne;

          return a;
        })
      );
    }
  });

  Assertion$$1.alias("finally", "eventually");
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var stringAssertions = function(should, Assertion) {
  /**
   * Assert given string starts with prefix
   * @name startWith
   * @memberOf Assertion
   * @category assertion strings
   * @param {string} str Prefix
   * @param {string} [description] Optional message
   * @example
   *
   * 'abc'.should.startWith('a');
   */
  Assertion.add("startWith", function(str, description) {
    this.params = {
      operator: "to start with " + should.format(str),
      message: description
    };

    this.assert(0 === this.obj.indexOf(str));
  });

  /**
   * Assert given string ends with prefix
   * @name endWith
   * @memberOf Assertion
   * @category assertion strings
   * @param {string} str Prefix
   * @param {string} [description] Optional message
   * @example
   *
   * 'abca'.should.endWith('a');
   */
  Assertion.add("endWith", function(str, description) {
    this.params = {
      operator: "to end with " + should.format(str),
      message: description
    };

    this.assert(this.obj.indexOf(str, this.obj.length - str.length) >= 0);
  });
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var containAssertions = function(should, Assertion) {
  var i = should.format;

  /**
   * Assert that given object contain something that equal to `other`. It uses `should-equal` for equality checks.
   * If given object is array it search that one of elements was equal to `other`.
   * If given object is string it checks if `other` is a substring - expected that `other` is a string.
   * If given object is Object it checks that `other` is a subobject - expected that `other` is a object.
   *
   * @name containEql
   * @memberOf Assertion
   * @category assertion contain
   * @param {*} other Nested object
   * @example
   *
   * [1, 2, 3].should.containEql(1);
   * [{ a: 1 }, 'a', 10].should.containEql({ a: 1 });
   *
   * 'abc'.should.containEql('b');
   * 'ab1c'.should.containEql(1);
   *
   * ({ a: 10, c: { d: 10 }}).should.containEql({ a: 10 });
   * ({ a: 10, c: { d: 10 }}).should.containEql({ c: { d: 10 }});
   * ({ a: 10, c: { d: 10 }}).should.containEql({ b: 10 });
   * // throws AssertionError: expected { a: 10, c: { d: 10 } } to contain { b: 10 }
   * //            expected { a: 10, c: { d: 10 } } to have property b
   */
  Assertion.add("containEql", function(other) {
    this.params = { operator: "to contain " + i(other) };

    this.is.not.null().and.not.undefined();

    var obj = this.obj;

    if (typeof obj == "string") {
      this.assert(obj.indexOf(String(other)) >= 0);
    } else if (shouldTypeAdaptors.isIterable(obj)) {
      this.assert(
        shouldTypeAdaptors.some(obj, function(v) {
          return eql(v, other).length === 0;
        })
      );
    } else {
      shouldTypeAdaptors.forEach(
        other,
        function(value, key) {
          should(obj).have.value(key, value);
        },
        this
      );
    }
  });

  /**
   * Assert that given object is contain equally structured object on the same depth level.
   * If given object is an array and `other` is an array it checks that the eql elements is going in the same sequence in given array (recursive)
   * If given object is an object it checks that the same keys contain deep equal values (recursive)
   * On other cases it try to check with `.eql`
   *
   * @name containDeepOrdered
   * @memberOf Assertion
   * @category assertion contain
   * @param {*} other Nested object
   * @example
   *
   * [ 1, 2, 3].should.containDeepOrdered([1, 2]);
   * [ 1, 2, [ 1, 2, 3 ]].should.containDeepOrdered([ 1, [ 2, 3 ]]);
   *
   * ({ a: 10, b: { c: 10, d: [1, 2, 3] }}).should.containDeepOrdered({a: 10});
   * ({ a: 10, b: { c: 10, d: [1, 2, 3] }}).should.containDeepOrdered({b: {c: 10}});
   * ({ a: 10, b: { c: 10, d: [1, 2, 3] }}).should.containDeepOrdered({b: {d: [1, 3]}});
   */
  Assertion.add("containDeepOrdered", function(other) {
    this.params = { operator: "to contain " + i(other) };

    var obj = this.obj;
    if (typeof obj == "string") {
      // expect other to be string
      this.is.equal(String(other));
    } else if (shouldTypeAdaptors.isIterable(obj) && shouldTypeAdaptors.isIterable(other)) {
      var objIterator = shouldTypeAdaptors.iterator(obj);
      var otherIterator = shouldTypeAdaptors.iterator(other);

      var nextObj = objIterator.next();
      var nextOther = otherIterator.next();
      while (!nextObj.done && !nextOther.done) {
        try {
          should(nextObj.value[1]).containDeepOrdered(nextOther.value[1]);
          nextOther = otherIterator.next();
        } catch (e) {
          if (!(e instanceof should.AssertionError)) {
            throw e;
          }
        }
        nextObj = objIterator.next();
      }

      this.assert(nextOther.done);
    } else if (obj != null && typeof obj == "object" && other != null && typeof other == "object") {
      //TODO compare types object contains object case
      shouldTypeAdaptors.forEach(other, function(value, key) {
        should(obj[key]).containDeepOrdered(value);
      });

      // if both objects is empty means we finish traversing - and we need to compare for hidden values
      if (shouldTypeAdaptors.isEmpty(other)) {
        this.eql(other);
      }
    } else {
      this.eql(other);
    }
  });

  /**
   * The same like `Assertion#containDeepOrdered` but all checks on arrays without order.
   *
   * @name containDeep
   * @memberOf Assertion
   * @category assertion contain
   * @param {*} other Nested object
   * @example
   *
   * [ 1, 2, 3].should.containDeep([2, 1]);
   * [ 1, 2, [ 1, 2, 3 ]].should.containDeep([ 1, [ 3, 1 ]]);
   */
  Assertion.add("containDeep", function(other) {
    this.params = { operator: "to contain " + i(other) };

    var obj = this.obj;
    if (typeof obj === "string" && typeof other === "string") {
      // expect other to be string
      this.is.equal(String(other));
    } else if (shouldTypeAdaptors.isIterable(obj) && shouldTypeAdaptors.isIterable(other)) {
      var usedKeys = {};
      shouldTypeAdaptors.forEach(
        other,
        function(otherItem) {
          this.assert(
            shouldTypeAdaptors.some(obj, function(item, index) {
              if (index in usedKeys) {
                return false;
              }

              try {
                should(item).containDeep(otherItem);
                usedKeys[index] = true;
                return true;
              } catch (e) {
                if (e instanceof should.AssertionError) {
                  return false;
                }
                throw e;
              }
            })
          );
        },
        this
      );
    } else if (obj != null && other != null && typeof obj == "object" && typeof other == "object") {
      // object contains object case
      shouldTypeAdaptors.forEach(other, function(value, key) {
        should(obj[key]).containDeep(value);
      });

      // if both objects is empty means we finish traversing - and we need to compare for hidden values
      if (shouldTypeAdaptors.isEmpty(other)) {
        this.eql(other);
      }
    } else {
      this.eql(other);
    }
  });
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var aSlice = Array.prototype.slice;

var propertyAssertions = function(should, Assertion) {
  var i = should.format;
  /**
   * Asserts given object has some descriptor. **On success it change given object to be value of property**.
   *
   * @name propertyWithDescriptor
   * @memberOf Assertion
   * @category assertion property
   * @param {string} name Name of property
   * @param {Object} desc Descriptor like used in Object.defineProperty (not required to add all properties)
   * @example
   *
   * ({ a: 10 }).should.have.propertyWithDescriptor('a', { enumerable: true });
   */
  Assertion.add("propertyWithDescriptor", function(name, desc) {
    this.params = {
      actual: this.obj,
      operator: "to have own property with descriptor " + i(desc)
    };
    var obj = this.obj;
    this.have.ownProperty(name);
    should(Object.getOwnPropertyDescriptor(Object(obj), name)).have.properties(desc);
  });

  /**
   * Asserts given object has property with optionally value. **On success it change given object to be value of property**.
   *
   * @name property
   * @memberOf Assertion
   * @category assertion property
   * @param {string} name Name of property
   * @param {*} [val] Optional property value to check
   * @example
   *
   * ({ a: 10 }).should.have.property('a');
   */
  Assertion.add("property", function(name, val) {
    name = convertPropertyName(name);
    if (arguments.length > 1) {
      var p = {};
      p[name] = val;
      this.have.properties(p);
    } else {
      this.have.properties(name);
    }
    this.obj = this.obj[name];
  });

  /**
   * Asserts given object has properties. On this method affect .any modifier, which allow to check not all properties.
   *
   * @name properties
   * @memberOf Assertion
   * @category assertion property
   * @param {Array|...string|Object} names Names of property
   * @example
   *
   * ({ a: 10 }).should.have.properties('a');
   * ({ a: 10, b: 20 }).should.have.properties([ 'a' ]);
   * ({ a: 10, b: 20 }).should.have.properties({ b: 20 });
   */
  Assertion.add("properties", function(names) {
    var values = {};
    if (arguments.length > 1) {
      names = aSlice.call(arguments);
    } else if (!Array.isArray(names)) {
      if (typeof names == "string" || typeof names == "symbol") {
        names = [names];
      } else {
        values = names;
        names = Object.keys(names);
      }
    }

    var obj = Object(this.obj),
      missingProperties = [];

    //just enumerate properties and check if they all present
    names.forEach(function(name) {
      if (!(name in obj)) {
        missingProperties.push(formatProp(name));
      }
    });

    var props = missingProperties;
    if (props.length === 0) {
      props = names.map(formatProp);
    } else if (this.anyOne) {
      props = names
        .filter(function(name) {
          return missingProperties.indexOf(formatProp(name)) < 0;
        })
        .map(formatProp);
    }

    var operator =
      (props.length === 1 ? "to have property " : "to have " + (this.anyOne ? "any of " : "") + "properties ") +
      props.join(", ");

    this.params = { obj: this.obj, operator: operator };

    //check that all properties presented
    //or if we request one of them that at least one them presented
    this.assert(missingProperties.length === 0 || (this.anyOne && missingProperties.length != names.length));

    // check if values in object matched expected
    var valueCheckNames = Object.keys(values);
    if (valueCheckNames.length) {
      var wrongValues = [];
      props = [];

      // now check values, as there we have all properties
      valueCheckNames.forEach(function(name) {
        var value = values[name];
        if (eql(obj[name], value).length !== 0) {
          wrongValues.push(formatProp(name) + " of " + i(value) + " (got " + i(obj[name]) + ")");
        } else {
          props.push(formatProp(name) + " of " + i(value));
        }
      });

      if ((wrongValues.length !== 0 && !this.anyOne) || (this.anyOne && props.length === 0)) {
        props = wrongValues;
      }

      operator =
        (props.length === 1 ? "to have property " : "to have " + (this.anyOne ? "any of " : "") + "properties ") +
        props.join(", ");

      this.params = { obj: this.obj, operator: operator };

      //if there is no not matched values
      //or there is at least one matched
      this.assert(wrongValues.length === 0 || (this.anyOne && wrongValues.length != valueCheckNames.length));
    }
  });

  /**
   * Asserts given object has property `length` with given value `n`
   *
   * @name length
   * @alias Assertion#lengthOf
   * @memberOf Assertion
   * @category assertion property
   * @param {number} n Expected length
   * @param {string} [description] Optional message
   * @example
   *
   * [1, 2].should.have.length(2);
   */
  Assertion.add("length", function(n, description) {
    this.have.property("length", n, description);
  });

  Assertion.alias("length", "lengthOf");

  /**
   * Asserts given object has own property. **On success it change given object to be value of property**.
   *
   * @name ownProperty
   * @alias Assertion#hasOwnProperty
   * @memberOf Assertion
   * @category assertion property
   * @param {string} name Name of property
   * @param {string} [description] Optional message
   * @example
   *
   * ({ a: 10 }).should.have.ownProperty('a');
   */
  Assertion.add("ownProperty", function(name, description) {
    name = convertPropertyName(name);
    this.params = {
      actual: this.obj,
      operator: "to have own property " + formatProp(name),
      message: description
    };

    this.assert(shouldUtil.hasOwnProperty(this.obj, name));

    this.obj = this.obj[name];
  });

  Assertion.alias("ownProperty", "hasOwnProperty");

  /**
   * Asserts given object is empty. For strings, arrays and arguments it checks .length property, for objects it checks keys.
   *
   * @name empty
   * @memberOf Assertion
   * @category assertion property
   * @example
   *
   * ''.should.be.empty();
   * [].should.be.empty();
   * ({}).should.be.empty();
   */
  Assertion.add(
    "empty",
    function() {
      this.params = { operator: "to be empty" };
      this.assert(shouldTypeAdaptors.isEmpty(this.obj));
    },
    true
  );

  /**
   * Asserts given object has such keys. Compared to `properties`, `keys` does not accept Object as a argument.
   * When calling via .key current object in assertion changed to value of this key
   *
   * @name keys
   * @alias Assertion#key
   * @memberOf Assertion
   * @category assertion property
   * @param {...*} keys Keys to check
   * @example
   *
   * ({ a: 10 }).should.have.keys('a');
   * ({ a: 10, b: 20 }).should.have.keys('a', 'b');
   * (new Map([[1, 2]])).should.have.key(1);
   *
   * json.should.have.only.keys('type', 'version')
   */
  Assertion.add("keys", function(keys) {
    keys = aSlice.call(arguments);

    var obj = Object(this.obj);

    // first check if some keys are missing
    var missingKeys = keys.filter(function(key) {
      return !shouldTypeAdaptors.has(obj, key);
    });

    var verb = "to have " + (this.onlyThis ? "only " : "") + (keys.length === 1 ? "key " : "keys ");

    this.params = { operator: verb + keys.join(", ") };

    if (missingKeys.length > 0) {
      this.params.operator += "\n\tmissing keys: " + missingKeys.join(", ");
    }

    this.assert(missingKeys.length === 0);

    if (this.onlyThis) {
      obj.should.have.size(keys.length);
    }
  });

  Assertion.add("key", function(key) {
    this.have.keys(key);
    this.obj = shouldTypeAdaptors.get(this.obj, key);
  });

  /**
   * Asserts given object has such value for given key
   *
   * @name value
   * @memberOf Assertion
   * @category assertion property
   * @param {*} key Key to check
   * @param {*} value Value to check
   * @example
   *
   * ({ a: 10 }).should.have.value('a', 10);
   * (new Map([[1, 2]])).should.have.value(1, 2);
   */
  Assertion.add("value", function(key, value) {
    this.have.key(key).which.is.eql(value);
  });

  /**
   * Asserts given object has such size.
   *
   * @name size
   * @memberOf Assertion
   * @category assertion property
   * @param {number} s Size to check
   * @example
   *
   * ({ a: 10 }).should.have.size(1);
   * (new Map([[1, 2]])).should.have.size(1);
   */
  Assertion.add("size", function(s) {
    this.params = { operator: "to have size " + s };
    shouldTypeAdaptors.size(this.obj).should.be.exactly(s);
  });

  /**
   * Asserts given object has nested property in depth by path. **On success it change given object to be value of final property**.
   *
   * @name propertyByPath
   * @memberOf Assertion
   * @category assertion property
   * @param {Array|...string} properties Properties path to search
   * @example
   *
   * ({ a: {b: 10}}).should.have.propertyByPath('a', 'b').eql(10);
   */
  Assertion.add("propertyByPath", function(properties) {
    properties = aSlice.call(arguments);

    var allProps = properties.map(formatProp);

    properties = properties.map(convertPropertyName);

    var obj = should(Object(this.obj));

    var foundProperties = [];

    var currentProperty;
    while (properties.length) {
      currentProperty = properties.shift();
      this.params = {
        operator: "to have property by path " + allProps.join(", ") + " - failed on " + formatProp(currentProperty)
      };
      obj = obj.have.property(currentProperty);
      foundProperties.push(currentProperty);
    }

    this.params = {
      obj: this.obj,
      operator: "to have property by path " + allProps.join(", ")
    };

    this.obj = obj.obj;
  });
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
var errorAssertions = function(should, Assertion) {
  var i = should.format;

  /**
   * Assert given function throws error with such message.
   *
   * @name throw
   * @memberOf Assertion
   * @category assertion errors
   * @alias Assertion#throwError
   * @param {string|RegExp|Function|Object|GeneratorFunction|GeneratorObject} [message] Message to match or properties
   * @param {Object} [properties] Optional properties that will be matched to thrown error
   * @example
   *
   * (function(){ throw new Error('fail') }).should.throw();
   * (function(){ throw new Error('fail') }).should.throw('fail');
   * (function(){ throw new Error('fail') }).should.throw(/fail/);
   *
   * (function(){ throw new Error('fail') }).should.throw(Error);
   * var error = new Error();
   * error.a = 10;
   * (function(){ throw error; }).should.throw(Error, { a: 10 });
   * (function(){ throw error; }).should.throw({ a: 10 });
   * (function*() {
   *   yield throwError();
   * }).should.throw();
   */
  Assertion.add("throw", function(message, properties) {
    var fn = this.obj;
    var err = {};
    var errorInfo = "";
    var thrown = false;

    if (shouldUtil.isGeneratorFunction(fn)) {
      return should(fn()).throw(message, properties);
    } else if (shouldUtil.isIterator(fn)) {
      return should(fn.next.bind(fn)).throw(message, properties);
    }

    this.is.a.Function();

    var errorMatched = true;

    try {
      fn();
    } catch (e) {
      thrown = true;
      err = e;
    }

    if (thrown) {
      if (message) {
        if ("string" == typeof message) {
          errorMatched = message == err.message;
        } else if (message instanceof RegExp) {
          errorMatched = message.test(err.message);
        } else if ("function" == typeof message) {
          errorMatched = err instanceof message;
        } else if (null != message) {
          try {
            should(err).match(message);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        if (!errorMatched) {
          if ("string" == typeof message || message instanceof RegExp) {
            errorInfo =
              " with a message matching " +
              i(message) +
              ", but got '" +
              err.message +
              "'";
          } else if ("function" == typeof message) {
            errorInfo =
              " of type " +
              functionName(message) +
              ", but got " +
              functionName(err.constructor);
          }
        } else if ("function" == typeof message && properties) {
          try {
            should(err).match(properties);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }
      } else {
        errorInfo = " (got " + i(err) + ")";
      }
    }

    this.params = { operator: "to throw exception" + errorInfo };

    this.assert(thrown);
    this.assert(errorMatched);
  });

  Assertion.alias("throw", "throwError");
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var matchingAssertions = function(should, Assertion) {
  var i = should.format;

  /**
   * Asserts if given object match `other` object, using some assumptions:
   * First object matched if they are equal,
   * If `other` is a regexp and given object is a string check on matching with regexp
   * If `other` is a regexp and given object is an array check if all elements matched regexp
   * If `other` is a regexp and given object is an object check values on matching regexp
   * If `other` is a function check if this function throws AssertionError on given object or return false - it will be assumed as not matched
   * If `other` is an object check if the same keys matched with above rules
   * All other cases failed.
   *
   * Usually it is right idea to add pre type assertions, like `.String()` or `.Object()` to be sure assertions will do what you are expecting.
   * Object iteration happen by keys (properties with enumerable: true), thus some objects can cause small pain. Typical example is js
   * Error - it by default has 2 properties `name` and `message`, but they both non-enumerable. In this case make sure you specify checking props (see examples).
   *
   * @name match
   * @memberOf Assertion
   * @category assertion matching
   * @param {*} other Object to match
   * @param {string} [description] Optional message
   * @example
   * 'foobar'.should.match(/^foo/);
   * 'foobar'.should.not.match(/^bar/);
   *
   * ({ a: 'foo', c: 'barfoo' }).should.match(/foo$/);
   *
   * ['a', 'b', 'c'].should.match(/[a-z]/);
   *
   * (5).should.not.match(function(n) {
   *   return n < 0;
   * });
   * (5).should.not.match(function(it) {
   *    it.should.be.an.Array();
   * });
   * ({ a: 10, b: 'abc', c: { d: 10 }, d: 0 }).should
   * .match({ a: 10, b: /c$/, c: function(it) {
   *    return it.should.have.property('d', 10);
   * }});
   *
   * [10, 'abc', { d: 10 }, 0].should
   * .match({ '0': 10, '1': /c$/, '2': function(it) {
   *    return it.should.have.property('d', 10);
   * }});
   *
   * var myString = 'abc';
   *
   * myString.should.be.a.String().and.match(/abc/);
   *
   * myString = {};
   *
   * myString.should.match(/abc/); //yes this will pass
   * //better to do
   * myString.should.be.an.Object().and.not.empty().and.match(/abc/);//fixed
   *
   * (new Error('boom')).should.match(/abc/);//passed because no keys
   * (new Error('boom')).should.not.match({ message: /abc/ });//check specified property
   */
  Assertion.add("match", function(other, description) {
    this.params = { operator: "to match " + i(other), message: description };

    if (eql(this.obj, other).length !== 0) {
      if (other instanceof RegExp) {
        // something - regex

        if (typeof this.obj == "string") {
          this.assert(other.exec(this.obj));
        } else if (null != this.obj && typeof this.obj == "object") {
          var notMatchedProps = [],
            matchedProps = [];
          shouldTypeAdaptors.forEach(
            this.obj,
            function(value, name) {
              if (other.exec(value)) {
                matchedProps.push(formatProp(name));
              } else {
                notMatchedProps.push(formatProp(name) + " (" + i(value) + ")");
              }
            },
            this
          );

          if (notMatchedProps.length) {
            this.params.operator += "\n    not matched properties: " + notMatchedProps.join(", ");
          }
          if (matchedProps.length) {
            this.params.operator += "\n    matched properties: " + matchedProps.join(", ");
          }

          this.assert(notMatchedProps.length === 0);
        } else {
          // should we try to convert to String and exec?
          this.assert(false);
        }
      } else if (typeof other == "function") {
        var res;

        res = other(this.obj);

        //if we throw exception ok - it is used .should inside
        if (typeof res == "boolean") {
          this.assert(res); // if it is just boolean function assert on it
        }
      } else if (typeof this.obj == "object" && this.obj != null && (isPlainObject(other) || Array.isArray(other))) {
        // try to match properties (for Object and Array)
        notMatchedProps = [];
        matchedProps = [];

        shouldTypeAdaptors.forEach(
          other,
          function(value, key) {
            try {
              should(this.obj)
                .have.property(key)
                .which.match(value);
              matchedProps.push(formatProp(key));
            } catch (e) {
              if (e instanceof should.AssertionError) {
                notMatchedProps.push(formatProp(key) + " (" + i(this.obj[key]) + ")");
              } else {
                throw e;
              }
            }
          },
          this
        );

        if (notMatchedProps.length) {
          this.params.operator += "\n    not matched properties: " + notMatchedProps.join(", ");
        }
        if (matchedProps.length) {
          this.params.operator += "\n    matched properties: " + matchedProps.join(", ");
        }

        this.assert(notMatchedProps.length === 0);
      } else {
        this.assert(false);
      }
    }
  });

  /**
   * Asserts if given object values or array elements all match `other` object, using some assumptions:
   * First object matched if they are equal,
   * If `other` is a regexp - matching with regexp
   * If `other` is a function check if this function throws AssertionError on given object or return false - it will be assumed as not matched
   * All other cases check if this `other` equal to each element
   *
   * @name matchEach
   * @memberOf Assertion
   * @category assertion matching
   * @alias Assertion#matchEvery
   * @param {*} other Object to match
   * @param {string} [description] Optional message
   * @example
   * [ 'a', 'b', 'c'].should.matchEach(/\w+/);
   * [ 'a', 'a', 'a'].should.matchEach('a');
   *
   * [ 'a', 'a', 'a'].should.matchEach(function(value) { value.should.be.eql('a') });
   *
   * { a: 'a', b: 'a', c: 'a' }.should.matchEach(function(value) { value.should.be.eql('a') });
   */
  Assertion.add("matchEach", function(other, description) {
    this.params = {
      operator: "to match each " + i(other),
      message: description
    };

    shouldTypeAdaptors.forEach(
      this.obj,
      function(value) {
        should(value).match(other);
      },
      this
    );
  });

  /**
  * Asserts if any of given object values or array elements match `other` object, using some assumptions:
  * First object matched if they are equal,
  * If `other` is a regexp - matching with regexp
  * If `other` is a function check if this function throws AssertionError on given object or return false - it will be assumed as not matched
  * All other cases check if this `other` equal to each element
  *
  * @name matchAny
  * @memberOf Assertion
  * @category assertion matching
  * @param {*} other Object to match
  * @alias Assertion#matchSome
  * @param {string} [description] Optional message
  * @example
  * [ 'a', 'b', 'c'].should.matchAny(/\w+/);
  * [ 'a', 'b', 'c'].should.matchAny('a');
  *
  * [ 'a', 'b', 'c'].should.matchAny(function(value) { value.should.be.eql('a') });
  *
  * { a: 'a', b: 'b', c: 'c' }.should.matchAny(function(value) { value.should.be.eql('a') });
  */
  Assertion.add("matchAny", function(other, description) {
    this.params = {
      operator: "to match any " + i(other),
      message: description
    };

    this.assert(
      shouldTypeAdaptors.some(this.obj, function(value) {
        try {
          should(value).match(other);
          return true;
        } catch (e) {
          if (e instanceof should.AssertionError) {
            // Caught an AssertionError, return false to the iterator
            return false;
          }
          throw e;
        }
      })
    );
  });

  Assertion.alias("matchAny", "matchSome");
  Assertion.alias("matchEach", "matchEvery");
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
/**
 * Our function should
 *
 * @param {*} obj Object to assert
 * @returns {should.Assertion} Returns new Assertion for beginning assertion chain
 * @example
 *
 * var should = require('should');
 * should('abc').be.a.String();
 */
function should$1(obj) {
  return new Assertion(obj);
}

should$1.AssertionError = AssertionError;
should$1.Assertion = Assertion;

// exposing modules dirty way
should$1.modules = {
  format: sformat$1,
  type: getType,
  equal: eql
};
should$1.format = format;

/**
 * Object with configuration.
 * It contains such properties:
 * * `checkProtoEql` boolean - Affect if `.eql` will check objects prototypes
 * * `plusZeroAndMinusZeroEqual` boolean - Affect if `.eql` will treat +0 and -0 as equal
 * Also it can contain options for should-format.
 *
 * @type {Object}
 * @memberOf should
 * @static
 * @example
 *
 * var a = { a: 10 }, b = Object.create(null);
 * b.a = 10;
 *
 * a.should.be.eql(b);
 * //not throws
 *
 * should.config.checkProtoEql = true;
 * a.should.be.eql(b);
 * //throws AssertionError: expected { a: 10 } to equal { a: 10 } (because A and B have different prototypes)
 */
should$1.config = config;

/**
 * Allow to extend given prototype with should property using given name. This getter will **unwrap** all standard wrappers like `Number`, `Boolean`, `String`.
 * Using `should(obj)` is the equivalent of using `obj.should` with known issues (like nulls and method calls etc).
 *
 * To add new assertions, need to use Assertion.add method.
 *
 * @param {string} [propertyName] Name of property to add. Default is `'should'`.
 * @param {Object} [proto] Prototype to extend with. Default is `Object.prototype`.
 * @memberOf should
 * @returns {{ name: string, descriptor: Object, proto: Object }} Descriptor enough to return all back
 * @static
 * @example
 *
 * var prev = should.extend('must', Object.prototype);
 *
 * 'abc'.must.startWith('a');
 *
 * var should = should.noConflict(prev);
 * should.not.exist(Object.prototype.must);
 */
should$1.extend = function(propertyName, proto) {
  propertyName = propertyName || "should";
  proto = proto || Object.prototype;

  var prevDescriptor = Object.getOwnPropertyDescriptor(proto, propertyName);

  Object.defineProperty(proto, propertyName, {
    set: function() {},
    get: function() {
      return should$1(isWrapperType(this) ? this.valueOf() : this);
    },
    configurable: true
  });

  return { name: propertyName, descriptor: prevDescriptor, proto: proto };
};

/**
 * Delete previous extension. If `desc` missing it will remove default extension.
 *
 * @param {{ name: string, descriptor: Object, proto: Object }} [desc] Returned from `should.extend` object
 * @memberOf should
 * @returns {Function} Returns should function
 * @static
 * @example
 *
 * var should = require('should').noConflict();
 *
 * should(Object.prototype).not.have.property('should');
 *
 * var prev = should.extend('must', Object.prototype);
 * 'abc'.must.startWith('a');
 * should.noConflict(prev);
 *
 * should(Object.prototype).not.have.property('must');
 */
should$1.noConflict = function(desc) {
  desc = desc || should$1._prevShould;

  if (desc) {
    delete desc.proto[desc.name];

    if (desc.descriptor) {
      Object.defineProperty(desc.proto, desc.name, desc.descriptor);
    }
  }
  return should$1;
};

/**
 * Simple utility function for a bit more easier should assertion extension
 * @param {Function} f So called plugin function. It should accept 2 arguments: `should` function and `Assertion` constructor
 * @memberOf should
 * @returns {Function} Returns `should` function
 * @static
 * @example
 *
 * should.use(function(should, Assertion) {
 *   Assertion.add('asset', function() {
 *      this.params = { operator: 'to be asset' };
 *
 *      this.obj.should.have.property('id').which.is.a.Number();
 *      this.obj.should.have.property('path');
 *  })
 * })
 */
should$1.use = function(f) {
  f(should$1, should$1.Assertion);
  return this;
};

should$1
  .use(assertExtensions)
  .use(chainAssertions)
  .use(booleanAssertions)
  .use(numberAssertions)
  .use(equalityAssertions)
  .use(typeAssertions)
  .use(stringAssertions)
  .use(propertyAssertions)
  .use(errorAssertions)
  .use(matchingAssertions)
  .use(containAssertions)
  .use(promiseAssertions);

var defaultProto = Object.prototype;
var defaultProperty = "should";

var freeGlobal =
  typeof global == "object" && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf =
  typeof self == "object" && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function("return this")();

//Expose api via `Object#should`.
try {
  var prevShould = should$1.extend(defaultProperty, defaultProto);
  should$1._prevShould = prevShould;

  Object.defineProperty(root, "should", {
    enumerable: false,
    configurable: true,
    value: should$1
  });
} catch (e) {
  //ignore errors
}

module.exports = should$1;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"should-equal":5,"should-format":6,"should-type":8,"should-type-adaptors":7,"should-util":9}],11:[function(require,module,exports){
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
     * @param {Array <tokens>} tokens
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

    /**
     * Formats a string into its readable number representation
     *
     * ie. a pattern of unknown length
     */

  }, {
    key: 'formatNumber',
    value: function formatNumber(str) {
      if (typeof str === 'undefined' || str.length === 0 || str.toString().replace(/[^\d]+/gi, '').length === 0) {
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
      if (typeof str === 'undefined' || str.length === 0 || str.toString().replace(/[^\d]+/gi, '').length === 0) {
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

},{}],12:[function(require,module,exports){
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

},{"../../src/utilities/formatter":11,"should":10}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zaG91bGQtZXF1YWwvY2pzL3Nob3VsZC1lcXVhbC5qcyIsIm5vZGVfbW9kdWxlcy9zaG91bGQtZm9ybWF0L2Nqcy9zaG91bGQtZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzL3Nob3VsZC10eXBlLWFkYXB0b3JzL2Nqcy9zaG91bGQtdHlwZS1hZGFwdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9zaG91bGQtdHlwZS9janMvc2hvdWxkLXR5cGUuanMiLCJub2RlX21vZHVsZXMvc2hvdWxkLXV0aWwvY2pzL3Nob3VsZC11dGlsLmpzIiwibm9kZV9tb2R1bGVzL3Nob3VsZC9janMvc2hvdWxkLmpzIiwic3JjL3V0aWxpdGllcy9mb3JtYXR0ZXIuanMiLCJ0ZXN0cy91bml0L2Zvcm1hdHRlci10ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDeDRGQTs7O0lBR3FCLFM7Ozs7Ozs7OztBQUVuQjs7Ozs7Ozs7Ozs7Ozs2QkFhZ0IsTyxFQUdjO0FBQUEsVUFGZCxNQUVjLHVFQUZMLEdBRUs7O0FBQUE7O0FBQUEsVUFEZCxNQUNjLHVFQURMLEdBQ0s7QUFBQSxVQUFkLE1BQWMsdUVBQUwsR0FBSzs7QUFDNUIsYUFBTyxRQUFRLEtBQVIsQ0FBYyxFQUFkLEVBQWtCLEdBQWxCLENBQXNCLFVBQUMsU0FBRCxFQUFlO0FBQzFDLGdCQUFRLFNBQVI7QUFDRSxlQUFLLE1BQUw7QUFDRSxtQkFBTyxNQUFLLFFBQUwsQ0FBYyxPQUFkLEVBQXVCLFFBQXZCLENBQVA7QUFDRixlQUFLLE1BQUw7QUFDRSxtQkFBTyxNQUFLLFFBQUwsQ0FBYyxPQUFkLEVBQXVCLFFBQXZCLENBQVA7QUFDRixlQUFLLE1BQUw7QUFDRSxtQkFBTyxNQUFLLFFBQUwsQ0FBYyxPQUFkLEVBQXVCLFFBQXZCLENBQVA7QUFDRjtBQUNFLG1CQUFPLE1BQUssUUFBTCxDQUFjLFVBQWQsRUFBMEIsU0FBMUIsQ0FBUDtBQVJKO0FBVUQsT0FYTSxDQUFQO0FBWUQ7Ozs2QkFFZSxJLEVBQU0sSyxFQUFPO0FBQzNCLGFBQU8sRUFBQyxNQUFNLElBQVAsRUFBYSxPQUFPLEtBQXBCLEVBQVA7QUFDRDtBQUNEOzs7Ozs7Ozs7OzhCQU9pQixLLEVBQU8sTSxFQUFRO0FBQUE7O0FBQzlCLGFBQU8sT0FBTyxNQUFQLENBQWMsVUFBQyxTQUFELEVBQVksS0FBWixFQUFtQixLQUFuQixFQUE2QjtBQUNoRCxZQUFJLE1BQU0sSUFBTixLQUFlLFVBQWYsSUFBNkIsVUFBVSxNQUFWLEdBQW1CLFFBQVEsQ0FBNUQsRUFBK0Q7QUFDN0QsdUJBQWEsTUFBTSxLQUFuQjtBQUNELFNBRkQsTUFFTyxJQUFJLE1BQU0sSUFBTixLQUFlLE9BQW5CLEVBQTRCO0FBQ2pDLGtCQUFRLE9BQUssVUFBTCxDQUFnQixLQUFoQixFQUF1QixNQUFNLEtBQTdCLENBQVI7O0FBRUEsY0FBSSxNQUFNLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNwQix5QkFBYSxNQUFNLENBQU4sQ0FBYjtBQUNBLG9CQUFRLE1BQU0sU0FBTixDQUFnQixDQUFoQixFQUFtQixNQUFNLE1BQXpCLENBQVI7QUFDRDtBQUNGOztBQUVELGVBQU8sU0FBUDtBQUNELE9BYk0sRUFhSixFQWJJLENBQVA7QUFjRDs7QUFFRDs7Ozs7OytCQUdrQixHLEVBQUssTSxFQUFRO0FBQzdCLGFBQU8sQ0FBQyxLQUFLLG9CQUFMLENBQTBCLElBQUksQ0FBSixDQUExQixFQUFrQyxNQUFsQyxDQUFELElBQThDLElBQUksTUFBSixHQUFhLENBQWxFLEVBQXFFO0FBQ25FLGNBQU0sSUFBSSxTQUFKLENBQWMsQ0FBZCxFQUFpQixJQUFJLE1BQXJCLENBQU47QUFDRDs7QUFFRCxhQUFPLEdBQVA7QUFDRDs7OzJCQUVhLEcsRUFBSyxPLEVBQVE7QUFDekIsYUFBTyxLQUFLLFNBQUwsQ0FBZSxHQUFmLEVBQW9CLEtBQUssUUFBTCxDQUFjLE9BQWQsQ0FBcEIsQ0FBUDtBQUNEOzs7NEJBRWMsRyxFQUFLO0FBQ2xCLGFBQU8sSUFBSSxLQUFKLENBQVUsRUFBVixFQUFjLE9BQWQsR0FBd0IsSUFBeEIsQ0FBNkIsRUFBN0IsQ0FBUDtBQUNEOzs7Z0NBRWtCLEcsRUFBSztBQUN0QixhQUFPLEtBQUssTUFBTCxDQUFZLEdBQVosRUFBaUIsZUFBakIsQ0FBUDtBQUNEOzs7K0JBRWlCLEcsRUFBSztBQUNyQixhQUFPLEtBQUssTUFBTCxDQUFZLEdBQVosRUFBaUIsWUFBakIsQ0FBUDtBQUNEOztBQUVEOzs7Ozs7OztpQ0FLb0IsRyxFQUFLO0FBQ3ZCLFVBQUksT0FBTyxHQUFQLEtBQWUsV0FBZixJQUE4QixJQUFJLE1BQUosS0FBZSxDQUE3QyxJQUFrRCxJQUFJLFFBQUosR0FBZSxPQUFmLENBQXVCLFVBQXZCLEVBQW1DLEVBQW5DLEVBQXVDLE1BQXZDLEtBQWtELENBQXhHLEVBQTJHO0FBQ3pHLGVBQU8sRUFBUDtBQUNEOztBQUVELFlBQU0sSUFBSSxRQUFKLEdBQWUsT0FBZixDQUF1QixVQUF2QixFQUFtQyxFQUFuQyxDQUFOOztBQUVBLFVBQUksVUFBVSxLQUFkOztBQUVBLFdBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxJQUFJLE1BQUosR0FBYSxDQUFqQyxFQUFvQyxHQUFwQyxFQUF5QztBQUN2QyxtQkFBVyxNQUFYO0FBQ0Q7O0FBRUQsYUFBTyxLQUFLLE9BQUwsQ0FBYSxLQUFLLE1BQUwsQ0FBWSxLQUFLLE9BQUwsQ0FBYSxHQUFiLENBQVosRUFBK0IsT0FBL0IsQ0FBYixDQUFQO0FBQ0Q7OztrQ0FFb0IsRyxFQUFLO0FBQ3hCLFVBQUksT0FBTyxHQUFQLEtBQWUsV0FBZixJQUE4QixJQUFJLE1BQUosS0FBZSxDQUE3QyxJQUFrRCxJQUFJLFFBQUosR0FBZSxPQUFmLENBQXVCLFVBQXZCLEVBQW1DLEVBQW5DLEVBQXVDLE1BQXZDLEtBQWtELENBQXhHLEVBQTJHO0FBQ3pHLGVBQU8sRUFBUDtBQUNEOztBQUVELGFBQU8sTUFBTSxLQUFLLFlBQUwsQ0FBa0IsR0FBbEIsQ0FBYjtBQUNEOzs7NkJBRWUsRyxFQUFLO0FBQ25CLGFBQU8sQ0FBQyxVQUFVLElBQVYsQ0FBZSxHQUFmLENBQVI7QUFDRDs7OzZCQUVlLEcsRUFBSztBQUNuQixhQUFPLENBQUMsU0FBUyxJQUFULENBQWMsR0FBZCxDQUFSO0FBQ0Q7Ozs2QkFFZSxHLEVBQUs7QUFDbkIsYUFBTyxDQUFDLGFBQWEsSUFBYixDQUFrQixHQUFsQixDQUFSO0FBQ0Q7Ozt5Q0FFMkIsRyxFQUFLLEksRUFBTTtBQUNyQyxVQUFJLENBQUMsR0FBRCxJQUFRLElBQUksTUFBSixLQUFlLENBQTNCLEVBQThCO0FBQzVCLGVBQU8sS0FBUDtBQUNEOztBQUVELGNBQVEsSUFBUjtBQUNFLGFBQUssUUFBTDtBQUNFLGlCQUFPLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBUDtBQUNGLGFBQUssUUFBTDtBQUNFLGlCQUFPLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBUDtBQUNGLGFBQUssUUFBTDtBQUNFLGlCQUFPLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBUDtBQUNGO0FBQ0UsaUJBQU8sS0FBUDtBQVJKO0FBVUQ7Ozs7OztrQkEvSWtCLFM7Ozs7O0FDSHJCOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVMsV0FBVCxFQUFzQixZQUFZO0FBQ2hDLFdBQVMsc0JBQVQsRUFBaUMsWUFBVztBQUMxQyxPQUFHLG9FQUFILEVBQXlFLFlBQVc7QUFDbEYsdUJBQU8sRUFBUCxDQUFVLG9CQUFVLG9CQUFWLENBQStCLFlBQS9CLEVBQTZDLFFBQTdDLENBQVY7QUFDQSx1QkFBTyxFQUFQLENBQVUsb0JBQVUsb0JBQVYsQ0FBK0IsS0FBL0IsRUFBc0MsUUFBdEMsQ0FBVjtBQUNBLHVCQUFPLEVBQVAsQ0FBVSxvQkFBVSxvQkFBVixDQUErQixLQUEvQixFQUFzQyxRQUF0QyxDQUFWO0FBQ0EsdUJBQU8sRUFBUCxDQUFVLG9CQUFVLG9CQUFWLENBQStCLEdBQS9CLEVBQW9DLFFBQXBDLENBQVY7QUFDQSx1QkFBTyxFQUFQLENBQVUsb0JBQVUsb0JBQVYsQ0FBK0IsV0FBL0IsRUFBNEMsUUFBNUMsQ0FBVjtBQUNBLHVCQUFPLEVBQVAsQ0FBVSxvQkFBVSxvQkFBVixDQUErQixHQUEvQixFQUFvQyxRQUFwQyxDQUFWO0FBQ0QsS0FQRDs7QUFTQSxPQUFHLDZEQUFILEVBQWtFLFlBQVc7QUFDM0UsdUJBQU8sT0FBUCxDQUFlLG9CQUFVLG9CQUFWLENBQStCLEdBQS9CLEVBQW9DLFFBQXBDLENBQWY7QUFDQSx1QkFBTyxPQUFQLENBQWUsb0JBQVUsb0JBQVYsQ0FBK0IsS0FBL0IsRUFBc0MsUUFBdEMsQ0FBZjtBQUNBLHVCQUFPLE9BQVAsQ0FBZSxvQkFBVSxvQkFBVixDQUErQixNQUEvQixFQUF1QyxRQUF2QyxDQUFmO0FBQ0EsdUJBQU8sT0FBUCxDQUFlLG9CQUFVLG9CQUFWLENBQStCLEtBQS9CLEVBQXNDLFFBQXRDLENBQWY7QUFDQSx1QkFBTyxPQUFQLENBQWUsb0JBQVUsb0JBQVYsQ0FBK0IsRUFBL0IsRUFBbUMsUUFBbkMsQ0FBZjtBQUNELEtBTkQ7QUFPRCxHQWpCRDs7QUFtQkEsV0FBUyxZQUFULEVBQXVCLFlBQVc7QUFDaEMsT0FBRyxxRkFBSCxFQUEwRixZQUFXO0FBQ25HLHVCQUFPLFNBQVAsQ0FBaUIsb0JBQVUsVUFBVixDQUFxQixPQUFyQixFQUE4QixRQUE5QixDQUFqQixFQUEwRCxJQUExRDtBQUNBLHVCQUFPLFNBQVAsQ0FBaUIsb0JBQVUsVUFBVixDQUFxQixZQUFyQixFQUFtQyxRQUFuQyxDQUFqQixFQUErRCxLQUEvRDtBQUNBLHVCQUFPLFNBQVAsQ0FBaUIsb0JBQVUsVUFBVixDQUFxQixPQUFyQixFQUE4QixRQUE5QixDQUFqQixFQUEwRCxJQUExRDtBQUNELEtBSkQ7QUFLRCxHQU5EOztBQVFBLFdBQVMsV0FBVCxFQUFzQixZQUFXO0FBQy9CLFFBQUksWUFBWSxvQkFBVSxTQUFWLENBQW9CLGFBQXBCLEVBQW1DLG9CQUFVLFFBQVYsQ0FBbUIsYUFBbkIsQ0FBbkMsRUFBc0UsYUFBdEUsQ0FBaEI7QUFDQSxRQUFJLGlCQUFpQixvQkFBVSxTQUFWLENBQW9CLFVBQXBCLEVBQWdDLG9CQUFVLFFBQVYsQ0FBbUIsVUFBbkIsRUFBK0IsR0FBL0IsQ0FBaEMsQ0FBckI7QUFDQSxRQUFJLGVBQWUsb0JBQVUsU0FBVixDQUFvQixVQUFwQixFQUFnQyxvQkFBVSxRQUFWLENBQW1CLFlBQW5CLENBQWhDLENBQW5CO0FBQ0EsUUFBSSxpQkFBaUIsb0JBQVUsU0FBVixDQUFvQixFQUFwQixFQUF3QixvQkFBVSxRQUFWLENBQW1CLGFBQW5CLENBQXhCLENBQXJCOztBQUVBLE9BQUcsd0RBQUgsRUFBNkQsWUFBVztBQUN0RSx1QkFBTyxTQUFQLENBQWlCLFNBQWpCLEVBQTRCLFNBQTVCO0FBQ0EsdUJBQU8sU0FBUCxDQUFpQixjQUFqQixFQUFpQyxTQUFqQztBQUNBLHVCQUFPLFNBQVAsQ0FBaUIsWUFBakIsRUFBK0IsWUFBL0I7QUFDQSx1QkFBTyxTQUFQLENBQWlCLGNBQWpCLEVBQWlDLEVBQWpDO0FBQ0QsS0FMRDtBQU1ELEdBWkQ7O0FBY0EsV0FBUyxRQUFULEVBQW1CLFlBQVc7QUFDNUIsT0FBRywrQ0FBSCxFQUFvRCxZQUFXO0FBQzdELHVCQUFPLFNBQVAsQ0FBaUIsb0JBQVUsTUFBVixDQUFpQixXQUFqQixFQUE4QixhQUE5QixDQUFqQixFQUErRCxhQUEvRDtBQUNBLHVCQUFPLFNBQVAsQ0FBaUIsb0JBQVUsTUFBVixDQUFpQixvQkFBakIsRUFBdUMsYUFBdkMsQ0FBakIsRUFBd0UsYUFBeEU7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsYUFBakIsRUFBZ0MsYUFBaEMsQ0FBakIsRUFBaUUsYUFBakU7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsWUFBakIsRUFBK0IsZUFBL0IsQ0FBakIsRUFBa0UsZUFBbEU7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsZUFBakIsRUFBa0MsY0FBbEMsQ0FBakIsRUFBb0UsY0FBcEU7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsVUFBakIsRUFBNkIsV0FBN0IsQ0FBakIsRUFBNEQsVUFBNUQ7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsUUFBakIsRUFBMkIsS0FBM0IsQ0FBakIsRUFBb0QsS0FBcEQ7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsT0FBakIsRUFBMEIsRUFBMUIsQ0FBakIsRUFBZ0QsRUFBaEQ7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsWUFBakIsRUFBK0IsWUFBL0IsQ0FBakIsRUFBK0QsWUFBL0Q7QUFDQSx1QkFBTyxTQUFQLENBQWlCLG9CQUFVLE1BQVYsQ0FBaUIsRUFBakIsRUFBb0Isa0JBQXBCLENBQWpCLEVBQTBELE1BQTFEOztBQUVBLFVBQUksbUJBQW1CLFNBQW5CLGdCQUFtQixDQUFDLEdBQUQ7QUFBQSxlQUFTLG9CQUFVLE1BQVYsQ0FBaUIsR0FBakIsRUFBc0IscUJBQXRCLENBQVQ7QUFBQSxPQUF2QjtBQUNBLHVCQUFPLFNBQVAsQ0FBaUIsaUJBQWlCLFlBQWpCLENBQWpCLEVBQWlELGNBQWpEO0FBQ0QsS0FkRDtBQWVELEdBaEJEOztBQWtCQSxXQUFTLGVBQVQsRUFBMEIsWUFBVztBQUNuQyxPQUFHLDBEQUFILEVBQStELFlBQVc7QUFDeEUsdUJBQU8sU0FBUCxDQUFpQixvQkFBVSxhQUFWLENBQXdCLFdBQXhCLENBQWpCLEVBQXVELFVBQXZEO0FBQ0EsdUJBQU8sU0FBUCxDQUFpQixvQkFBVSxhQUFWLENBQXdCLGFBQXhCLENBQWpCLEVBQXlELGFBQXpEO0FBQ0EsdUJBQU8sU0FBUCxDQUFpQixvQkFBVSxhQUFWLENBQXdCLEtBQXhCLENBQWpCLEVBQWlELEVBQWpEO0FBQ0EsdUJBQU8sU0FBUCxDQUFpQixvQkFBVSxhQUFWLENBQXdCLFFBQXhCLENBQWpCLEVBQW9ELE1BQXBEO0FBQ0QsS0FMRDtBQU1ELEdBUEQ7QUFRRCxDQXBFRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBwbGFjZUhvbGRlcnNDb3VudCAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuICAvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG4gIC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuICAvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcbiAgLy8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuICByZXR1cm4gYjY0W2xlbiAtIDJdID09PSAnPScgPyAyIDogYjY0W2xlbiAtIDFdID09PSAnPScgPyAxIDogMFxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG4gIHJldHVybiAoYjY0Lmxlbmd0aCAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0NvdW50KGI2NClcbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgaSwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuICBwbGFjZUhvbGRlcnMgPSBwbGFjZUhvbGRlcnNDb3VudChiNjQpXG5cbiAgYXJyID0gbmV3IEFycigobGVuICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzKVxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgbCA9IHBsYWNlSG9sZGVycyA+IDAgPyBsZW4gLSA0IDogbGVuXG5cbiAgdmFyIEwgPSAwXG5cbiAgZm9yIChpID0gMDsgaSA8IGw7IGkgKz0gNCkge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfCByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltMKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICsgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICsgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gKyBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgb3V0cHV0ID0gJydcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIG91dHB1dCArPSBsb29rdXBbdG1wID4+IDJdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gJz09J1xuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyAodWludDhbbGVuIC0gMV0pXG4gICAgb3V0cHV0ICs9IGxvb2t1cFt0bXAgPj4gMTBdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXVxuICAgIG91dHB1dCArPSAnPSdcbiAgfVxuXG4gIHBhcnRzLnB1c2gob3V0cHV0KVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVCAhPT0gdW5kZWZpbmVkXG4gID8gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgOiB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbi8qXG4gKiBFeHBvcnQga01heExlbmd0aCBhZnRlciB0eXBlZCBhcnJheSBzdXBwb3J0IGlzIGRldGVybWluZWQuXG4gKi9cbmV4cG9ydHMua01heExlbmd0aCA9IGtNYXhMZW5ndGgoKVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHtfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH19XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDIgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKGtNYXhMZW5ndGgoKSA8IGxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHR5cGVkIGFycmF5IGxlbmd0aCcpXG4gIH1cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgICB0aGF0Ll9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgaWYgKHRoYXQgPT09IG51bGwpIHtcbiAgICAgIHRoYXQgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgICB9XG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgfVxuXG4gIHJldHVybiB0aGF0XG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmICEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdJZiBlbmNvZGluZyBpcyBzcGVjaWZpZWQgdGhlbiB0aGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZydcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKHRoaXMsIGFyZylcbiAgfVxuICByZXR1cm4gZnJvbSh0aGlzLCBhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbi8vIFRPRE86IExlZ2FjeSwgbm90IG5lZWRlZCBhbnltb3JlLiBSZW1vdmUgaW4gbmV4dCBtYWpvciB2ZXJzaW9uLlxuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIGZyb20gKHRoYXQsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgYSBudW1iZXInKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodGhhdCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhhdCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICByZXR1cm4gZnJvbU9iamVjdCh0aGF0LCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbShudWxsLCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG5pZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuICBCdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgJiZcbiAgICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICAgIC8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBuZWdhdGl2ZScpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHRoYXQsIHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKG51bGwsIHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAodGhhdCwgc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSkge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZW5jb2RpbmdcIiBtdXN0IGJlIGEgdmFsaWQgc3RyaW5nIGVuY29kaW5nJylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gdGhhdC53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgdGhhdCA9IHRoYXQuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAodGhhdCwgYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBhcnJheS5ieXRlTGVuZ3RoIC8vIHRoaXMgdGhyb3dzIGlmIGBhcnJheWAgaXMgbm90IGEgdmFsaWQgQXJyYXlCdWZmZXJcblxuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXFwnb2Zmc2V0XFwnIGlzIG91dCBvZiBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcXCdsZW5ndGhcXCcgaXMgb3V0IG9mIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IGFycmF5XG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tQXJyYXlMaWtlKHRoYXQsIGFycmF5KVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbilcblxuICAgIGlmICh0aGF0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoYXRcbiAgICB9XG5cbiAgICBvYmouY29weSh0aGF0LCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIHRoYXRcbiAgfVxuXG4gIGlmIChvYmopIHtcbiAgICBpZiAoKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB8fCAnbGVuZ3RoJyBpbiBvYmopIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgaXNuYW4ob2JqLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcih0aGF0LCAwKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqKVxuICAgIH1cblxuICAgIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iai5kYXRhKVxuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBhcnJheS1saWtlIG9iamVjdC4nKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aCgpYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBzdHJpbmcgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmcgPSAnJyArIHN0cmluZ1xuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGUgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCBhbmQgYGlzLWJ1ZmZlcmAgKGluIFNhZmFyaSA1LTcpIHRvIGRldGVjdFxuLy8gQnVmZmVyIGluc3RhbmNlcy5cbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKGlzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiZcbiAgICAgICAgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gICAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyArK2kpIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7ICsraSkge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyArK2kpIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gYXNjZW5kaW5nIGNvcHkgZnJvbSBzdGFydFxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoY29kZSA8IDI1Nikge1xuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogdXRmOFRvQnl0ZXMobmV3IEJ1ZmZlcih2YWwsIGVuY29kaW5nKS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBpc25hbiAodmFsKSB7XG4gIHJldHVybiB2YWwgIT09IHZhbCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwidmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BEZWZhdWx0IChleCkgeyByZXR1cm4gKGV4ICYmICh0eXBlb2YgZXggPT09ICdvYmplY3QnKSAmJiAnZGVmYXVsdCcgaW4gZXgpID8gZXhbJ2RlZmF1bHQnXSA6IGV4OyB9XG5cbnZhciB0ID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ3Nob3VsZC10eXBlJykpO1xuXG5mdW5jdGlvbiBmb3JtYXQobXNnKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICBmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbXNnID0gbXNnLnJlcGxhY2UoLyVzLywgYXJnc1tpXSk7XG4gIH1cbiAgcmV0dXJuIG1zZztcbn1cblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gRXF1YWxpdHlGYWlsKGEsIGIsIHJlYXNvbiwgcGF0aCkge1xuICB0aGlzLmEgPSBhO1xuICB0aGlzLmIgPSBiO1xuICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgdGhpcy5wYXRoID0gcGF0aDtcbn1cblxuZnVuY3Rpb24gdHlwZVRvU3RyaW5nKHRwKSB7XG4gIHJldHVybiB0cC50eXBlICsgKHRwLmNscyA/IFwiKFwiICsgdHAuY2xzICsgKHRwLnN1YiA/IFwiIFwiICsgdHAuc3ViIDogXCJcIikgKyBcIilcIiA6IFwiXCIpO1xufVxuXG52YXIgUExVU18wX0FORF9NSU5VU18wID0gXCIrMCBpcyBub3QgZXF1YWwgdG8gLTBcIjtcbnZhciBESUZGRVJFTlRfVFlQRVMgPSBcIkEgaGFzIHR5cGUgJXMgYW5kIEIgaGFzIHR5cGUgJXNcIjtcbnZhciBFUVVBTElUWSA9IFwiQSBpcyBub3QgZXF1YWwgdG8gQlwiO1xudmFyIEVRVUFMSVRZX1BST1RPVFlQRSA9IFwiQSBhbmQgQiBoYXZlIGRpZmZlcmVudCBwcm90b3R5cGVzXCI7XG52YXIgV1JBUFBFRF9WQUxVRSA9IFwiQSB3cmFwcGVkIHZhbHVlIGlzIG5vdCBlcXVhbCB0byBCIHdyYXBwZWQgdmFsdWVcIjtcbnZhciBGVU5DVElPTl9TT1VSQ0VTID0gXCJmdW5jdGlvbiBBIGlzIG5vdCBlcXVhbCB0byBCIGJ5IHNvdXJjZSBjb2RlIHZhbHVlICh2aWEgLnRvU3RyaW5nIGNhbGwpXCI7XG52YXIgTUlTU0lOR19LRVkgPSBcIiVzIGhhcyBubyBrZXkgJXNcIjtcbnZhciBTRVRfTUFQX01JU1NJTkdfS0VZID0gXCJTZXQvTWFwIG1pc3Npbmcga2V5ICVzXCI7XG5cbnZhciBERUZBVUxUX09QVElPTlMgPSB7XG4gIGNoZWNrUHJvdG9FcWw6IHRydWUsXG4gIGNoZWNrU3ViVHlwZTogdHJ1ZSxcbiAgcGx1c1plcm9BbmRNaW51c1plcm9FcXVhbDogdHJ1ZSxcbiAgY29sbGVjdEFsbEZhaWxzOiBmYWxzZVxufTtcblxuZnVuY3Rpb24gc2V0Qm9vbGVhbkRlZmF1bHQocHJvcGVydHksIG9iaiwgb3B0cywgZGVmYXVsdHMpIHtcbiAgb2JqW3Byb3BlcnR5XSA9IHR5cGVvZiBvcHRzW3Byb3BlcnR5XSAhPT0gXCJib29sZWFuXCIgPyBkZWZhdWx0c1twcm9wZXJ0eV0gOiBvcHRzW3Byb3BlcnR5XTtcbn1cblxudmFyIE1FVEhPRF9QUkVGSVggPSBcIl9jaGVja19cIjtcblxuZnVuY3Rpb24gRVEob3B0cywgYSwgYiwgcGF0aCkge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICBzZXRCb29sZWFuRGVmYXVsdChcImNoZWNrUHJvdG9FcWxcIiwgdGhpcywgb3B0cywgREVGQVVMVF9PUFRJT05TKTtcbiAgc2V0Qm9vbGVhbkRlZmF1bHQoXCJwbHVzWmVyb0FuZE1pbnVzWmVyb0VxdWFsXCIsIHRoaXMsIG9wdHMsIERFRkFVTFRfT1BUSU9OUyk7XG4gIHNldEJvb2xlYW5EZWZhdWx0KFwiY2hlY2tTdWJUeXBlXCIsIHRoaXMsIG9wdHMsIERFRkFVTFRfT1BUSU9OUyk7XG4gIHNldEJvb2xlYW5EZWZhdWx0KFwiY29sbGVjdEFsbEZhaWxzXCIsIHRoaXMsIG9wdHMsIERFRkFVTFRfT1BUSU9OUyk7XG5cbiAgdGhpcy5hID0gYTtcbiAgdGhpcy5iID0gYjtcblxuICB0aGlzLl9tZWV0ID0gb3B0cy5fbWVldCB8fCBbXTtcblxuICB0aGlzLmZhaWxzID0gb3B0cy5mYWlscyB8fCBbXTtcblxuICB0aGlzLnBhdGggPSBwYXRoIHx8IFtdO1xufVxuXG5mdW5jdGlvbiBTaG9ydGN1dEVycm9yKGZhaWwpIHtcbiAgdGhpcy5uYW1lID0gXCJTaG9ydGN1dEVycm9yXCI7XG4gIHRoaXMubWVzc2FnZSA9IFwiZmFpbCBmYXN0XCI7XG4gIHRoaXMuZmFpbCA9IGZhaWw7XG59XG5cblNob3J0Y3V0RXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuXG5FUS5jaGVja1N0cmljdEVxdWFsaXR5ID0gZnVuY3Rpb24oYSwgYikge1xuICB0aGlzLmNvbGxlY3RGYWlsKGEgIT09IGIsIEVRVUFMSVRZKTtcbn07XG5cbkVRLmFkZCA9IGZ1bmN0aW9uIGFkZCh0eXBlLCBjbHMsIHN1YiwgZikge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIGYgPSBhcmdzLnBvcCgpO1xuICBFUS5wcm90b3R5cGVbTUVUSE9EX1BSRUZJWCArIGFyZ3Muam9pbihcIl9cIildID0gZjtcbn07XG5cbkVRLnByb3RvdHlwZSA9IHtcbiAgY2hlY2s6IGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNoZWNrMCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgU2hvcnRjdXRFcnJvcikge1xuICAgICAgICByZXR1cm4gW2UuZmFpbF07XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mYWlscztcbiAgfSxcblxuICBjaGVjazA6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhID0gdGhpcy5hO1xuICAgIHZhciBiID0gdGhpcy5iO1xuXG4gICAgLy8gZXF1YWwgYSBhbmQgYiBleGl0IGVhcmx5XG4gICAgaWYgKGEgPT09IGIpIHtcbiAgICAgIC8vIGNoZWNrIGZvciArMCAhPT0gLTA7XG4gICAgICByZXR1cm4gdGhpcy5jb2xsZWN0RmFpbChhID09PSAwICYmIDEgLyBhICE9PSAxIC8gYiAmJiAhdGhpcy5wbHVzWmVyb0FuZE1pbnVzWmVyb0VxdWFsLCBQTFVTXzBfQU5EX01JTlVTXzApO1xuICAgIH1cblxuICAgIHZhciB0eXBlQSA9IHQoYSk7XG4gICAgdmFyIHR5cGVCID0gdChiKTtcblxuICAgIC8vIGlmIG9iamVjdHMgaGFzIGRpZmZlcmVudCB0eXBlcyB0aGV5IGFyZSBub3QgZXF1YWxcbiAgICBpZiAodHlwZUEudHlwZSAhPT0gdHlwZUIudHlwZSB8fCB0eXBlQS5jbHMgIT09IHR5cGVCLmNscyB8fCB0eXBlQS5zdWIgIT09IHR5cGVCLnN1Yikge1xuICAgICAgcmV0dXJuIHRoaXMuY29sbGVjdEZhaWwodHJ1ZSwgZm9ybWF0KERJRkZFUkVOVF9UWVBFUywgdHlwZVRvU3RyaW5nKHR5cGVBKSwgdHlwZVRvU3RyaW5nKHR5cGVCKSkpO1xuICAgIH1cblxuICAgIC8vIGFzIHR5cGVzIHRoZSBzYW1lIGNoZWNrcyB0eXBlIHNwZWNpZmljIHRoaW5nc1xuICAgIHZhciBuYW1lMSA9IHR5cGVBLnR5cGUsXG4gICAgICBuYW1lMiA9IHR5cGVBLnR5cGU7XG4gICAgaWYgKHR5cGVBLmNscykge1xuICAgICAgbmFtZTEgKz0gXCJfXCIgKyB0eXBlQS5jbHM7XG4gICAgICBuYW1lMiArPSBcIl9cIiArIHR5cGVBLmNscztcbiAgICB9XG4gICAgaWYgKHR5cGVBLnN1Yikge1xuICAgICAgbmFtZTIgKz0gXCJfXCIgKyB0eXBlQS5zdWI7XG4gICAgfVxuXG4gICAgdmFyIGYgPVxuICAgICAgdGhpc1tNRVRIT0RfUFJFRklYICsgbmFtZTJdIHx8XG4gICAgICB0aGlzW01FVEhPRF9QUkVGSVggKyBuYW1lMV0gfHxcbiAgICAgIHRoaXNbTUVUSE9EX1BSRUZJWCArIHR5cGVBLnR5cGVdIHx8XG4gICAgICB0aGlzLmRlZmF1bHRDaGVjaztcblxuICAgIGYuY2FsbCh0aGlzLCB0aGlzLmEsIHRoaXMuYik7XG4gIH0sXG5cbiAgY29sbGVjdEZhaWw6IGZ1bmN0aW9uKGNvbXBhcmlzb24sIHJlYXNvbiwgc2hvd1JlYXNvbikge1xuICAgIGlmIChjb21wYXJpc29uKSB7XG4gICAgICB2YXIgcmVzID0gbmV3IEVxdWFsaXR5RmFpbCh0aGlzLmEsIHRoaXMuYiwgcmVhc29uLCB0aGlzLnBhdGgpO1xuICAgICAgcmVzLnNob3dSZWFzb24gPSAhIXNob3dSZWFzb247XG5cbiAgICAgIHRoaXMuZmFpbHMucHVzaChyZXMpO1xuXG4gICAgICBpZiAoIXRoaXMuY29sbGVjdEFsbEZhaWxzKSB7XG4gICAgICAgIHRocm93IG5ldyBTaG9ydGN1dEVycm9yKHJlcyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNoZWNrUGxhaW5PYmplY3RzRXF1YWxpdHk6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAvLyBjb21wYXJlIGRlZXAgb2JqZWN0cyBhbmQgYXJyYXlzXG4gICAgLy8gc3RhY2tzIGNvbnRhaW4gcmVmZXJlbmNlcyBvbmx5XG4gICAgLy9cbiAgICB2YXIgbWVldCA9IHRoaXMuX21lZXQ7XG4gICAgdmFyIG0gPSB0aGlzLl9tZWV0Lmxlbmd0aDtcbiAgICB3aGlsZSAobS0tKSB7XG4gICAgICB2YXIgc3QgPSBtZWV0W21dO1xuICAgICAgaWYgKHN0WzBdID09PSBhICYmIHN0WzFdID09PSBiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgYGFgIGFuZCBgYmAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gICAgbWVldC5wdXNoKFthLCBiXSk7XG5cbiAgICAvLyBUT0RPIG1heWJlIHNvbWV0aGluZyBlbHNlIGxpa2UgZ2V0T3duUHJvcGVydHlOYW1lc1xuICAgIHZhciBrZXk7XG4gICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYiwga2V5KSkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChhLCBrZXkpKSB7XG4gICAgICAgICAgdGhpcy5jaGVja1Byb3BlcnR5RXF1YWxpdHkoa2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbGxlY3RGYWlsKHRydWUsIGZvcm1hdChNSVNTSU5HX0tFWSwgXCJBXCIsIGtleSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZW5zdXJlIGJvdGggb2JqZWN0cyBoYXZlIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzXG4gICAgZm9yIChrZXkgaW4gYSkge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYSwga2V5KSkge1xuICAgICAgICB0aGlzLmNvbGxlY3RGYWlsKCFoYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleSksIGZvcm1hdChNSVNTSU5HX0tFWSwgXCJCXCIsIGtleSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lZXQucG9wKCk7XG5cbiAgICBpZiAodGhpcy5jaGVja1Byb3RvRXFsKSB7XG4gICAgICAvL1RPRE8gc2hvdWxkIGkgY2hlY2sgcHJvdG90eXBlcyBmb3IgPT09IG9yIHVzZSBlcT9cbiAgICAgIHRoaXMuY29sbGVjdEZhaWwoT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpICE9PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYiksIEVRVUFMSVRZX1BST1RPVFlQRSwgdHJ1ZSk7XG4gICAgfVxuICB9LFxuXG4gIGNoZWNrUHJvcGVydHlFcXVhbGl0eTogZnVuY3Rpb24ocHJvcGVydHlOYW1lKSB7XG4gICAgdmFyIF9lcSA9IG5ldyBFUSh0aGlzLCB0aGlzLmFbcHJvcGVydHlOYW1lXSwgdGhpcy5iW3Byb3BlcnR5TmFtZV0sIHRoaXMucGF0aC5jb25jYXQoW3Byb3BlcnR5TmFtZV0pKTtcbiAgICBfZXEuY2hlY2swKCk7XG4gIH0sXG5cbiAgZGVmYXVsdENoZWNrOiBFUS5jaGVja1N0cmljdEVxdWFsaXR5XG59O1xuXG5FUS5hZGQodC5OVU1CRVIsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgdGhpcy5jb2xsZWN0RmFpbCgoYSAhPT0gYSAmJiBiID09PSBiKSB8fCAoYiAhPT0gYiAmJiBhID09PSBhKSB8fCAoYSAhPT0gYiAmJiBhID09PSBhICYmIGIgPT09IGIpLCBFUVVBTElUWSk7XG59KTtcblxuW3QuU1lNQk9MLCB0LkJPT0xFQU4sIHQuU1RSSU5HXS5mb3JFYWNoKGZ1bmN0aW9uKHRwKSB7XG4gIEVRLmFkZCh0cCwgRVEuY2hlY2tTdHJpY3RFcXVhbGl0eSk7XG59KTtcblxuRVEuYWRkKHQuRlVOQ1RJT04sIGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gZnVuY3Rpb25zIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgY29kZVxuICB0aGlzLmNvbGxlY3RGYWlsKGEudG9TdHJpbmcoKSAhPT0gYi50b1N0cmluZygpLCBGVU5DVElPTl9TT1VSQ0VTKTtcbiAgLy8gY2hlY2sgdXNlciBwcm9wZXJ0aWVzXG4gIHRoaXMuY2hlY2tQbGFpbk9iamVjdHNFcXVhbGl0eShhLCBiKTtcbn0pO1xuXG5FUS5hZGQodC5PQkpFQ1QsIHQuUkVHRVhQLCBmdW5jdGlvbihhLCBiKSB7XG4gIC8vIGNoZWNrIHJlZ2V4cCBmbGFnc1xuICB2YXIgZmxhZ3MgPSBbXCJzb3VyY2VcIiwgXCJnbG9iYWxcIiwgXCJtdWx0aWxpbmVcIiwgXCJsYXN0SW5kZXhcIiwgXCJpZ25vcmVDYXNlXCIsIFwic3RpY2t5XCIsIFwidW5pY29kZVwiXTtcbiAgd2hpbGUgKGZsYWdzLmxlbmd0aCkge1xuICAgIHRoaXMuY2hlY2tQcm9wZXJ0eUVxdWFsaXR5KGZsYWdzLnNoaWZ0KCkpO1xuICB9XG4gIC8vIGNoZWNrIHVzZXIgcHJvcGVydGllc1xuICB0aGlzLmNoZWNrUGxhaW5PYmplY3RzRXF1YWxpdHkoYSwgYik7XG59KTtcblxuRVEuYWRkKHQuT0JKRUNULCB0LkRBVEUsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy9jaGVjayBieSB0aW1lc3RhbXAgb25seSAodXNpbmcgLnZhbHVlT2YpXG4gIHRoaXMuY29sbGVjdEZhaWwoK2EgIT09ICtiLCBFUVVBTElUWSk7XG4gIC8vIGNoZWNrIHVzZXIgcHJvcGVydGllc1xuICB0aGlzLmNoZWNrUGxhaW5PYmplY3RzRXF1YWxpdHkoYSwgYik7XG59KTtcblxuW3QuTlVNQkVSLCB0LkJPT0xFQU4sIHQuU1RSSU5HXS5mb3JFYWNoKGZ1bmN0aW9uKHRwKSB7XG4gIEVRLmFkZCh0Lk9CSkVDVCwgdHAsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAvL3ByaW1pdGl2ZSB0eXBlIHdyYXBwZXJzXG4gICAgdGhpcy5jb2xsZWN0RmFpbChhLnZhbHVlT2YoKSAhPT0gYi52YWx1ZU9mKCksIFdSQVBQRURfVkFMVUUpO1xuICAgIC8vIGNoZWNrIHVzZXIgcHJvcGVydGllc1xuICAgIHRoaXMuY2hlY2tQbGFpbk9iamVjdHNFcXVhbGl0eShhLCBiKTtcbiAgfSk7XG59KTtcblxuRVEuYWRkKHQuT0JKRUNULCBmdW5jdGlvbihhLCBiKSB7XG4gIHRoaXMuY2hlY2tQbGFpbk9iamVjdHNFcXVhbGl0eShhLCBiKTtcbn0pO1xuXG5bdC5BUlJBWSwgdC5BUkdVTUVOVFMsIHQuVFlQRURfQVJSQVldLmZvckVhY2goZnVuY3Rpb24odHApIHtcbiAgRVEuYWRkKHQuT0JKRUNULCB0cCwgZnVuY3Rpb24oYSwgYikge1xuICAgIHRoaXMuY2hlY2tQcm9wZXJ0eUVxdWFsaXR5KFwibGVuZ3RoXCIpO1xuXG4gICAgdGhpcy5jaGVja1BsYWluT2JqZWN0c0VxdWFsaXR5KGEsIGIpO1xuICB9KTtcbn0pO1xuXG5FUS5hZGQodC5PQkpFQ1QsIHQuQVJSQVlfQlVGRkVSLCBmdW5jdGlvbihhLCBiKSB7XG4gIHRoaXMuY2hlY2tQcm9wZXJ0eUVxdWFsaXR5KFwiYnl0ZUxlbmd0aFwiKTtcblxuICB0aGlzLmNoZWNrUGxhaW5PYmplY3RzRXF1YWxpdHkoYSwgYik7XG59KTtcblxuRVEuYWRkKHQuT0JKRUNULCB0LkVSUk9SLCBmdW5jdGlvbihhLCBiKSB7XG4gIHRoaXMuY2hlY2tQcm9wZXJ0eUVxdWFsaXR5KFwibmFtZVwiKTtcbiAgdGhpcy5jaGVja1Byb3BlcnR5RXF1YWxpdHkoXCJtZXNzYWdlXCIpO1xuXG4gIHRoaXMuY2hlY2tQbGFpbk9iamVjdHNFcXVhbGl0eShhLCBiKTtcbn0pO1xuXG5FUS5hZGQodC5PQkpFQ1QsIHQuQlVGRkVSLCBmdW5jdGlvbihhKSB7XG4gIHRoaXMuY2hlY2tQcm9wZXJ0eUVxdWFsaXR5KFwibGVuZ3RoXCIpO1xuXG4gIHZhciBsID0gYS5sZW5ndGg7XG4gIHdoaWxlIChsLS0pIHtcbiAgICB0aGlzLmNoZWNrUHJvcGVydHlFcXVhbGl0eShsKTtcbiAgfVxuXG4gIC8vd2UgZG8gbm90IGNoZWNrIGZvciB1c2VyIHByb3BlcnRpZXMgYmVjYXVzZVxuICAvL25vZGUgQnVmZmVyIGhhdmUgc29tZSBzdHJhbmdlIGhpZGRlbiBwcm9wZXJ0aWVzXG59KTtcblxuZnVuY3Rpb24gY2hlY2tNYXBCeUtleXMoYSwgYikge1xuICB2YXIgaXRlcmF0b3JBID0gYS5rZXlzKCk7XG5cbiAgZm9yICh2YXIgbmV4dEEgPSBpdGVyYXRvckEubmV4dCgpOyAhbmV4dEEuZG9uZTsgbmV4dEEgPSBpdGVyYXRvckEubmV4dCgpKSB7XG4gICAgdmFyIGtleSA9IG5leHRBLnZhbHVlO1xuICAgIHZhciBoYXNLZXkgPSBiLmhhcyhrZXkpO1xuICAgIHRoaXMuY29sbGVjdEZhaWwoIWhhc0tleSwgZm9ybWF0KFNFVF9NQVBfTUlTU0lOR19LRVksIGtleSkpO1xuXG4gICAgaWYgKGhhc0tleSkge1xuICAgICAgdmFyIHZhbHVlQiA9IGIuZ2V0KGtleSk7XG4gICAgICB2YXIgdmFsdWVBID0gYS5nZXQoa2V5KTtcblxuICAgICAgZXEodmFsdWVBLCB2YWx1ZUIsIHRoaXMpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja1NldEJ5S2V5cyhhLCBiKSB7XG4gIHZhciBpdGVyYXRvckEgPSBhLmtleXMoKTtcblxuICBmb3IgKHZhciBuZXh0QSA9IGl0ZXJhdG9yQS5uZXh0KCk7ICFuZXh0QS5kb25lOyBuZXh0QSA9IGl0ZXJhdG9yQS5uZXh0KCkpIHtcbiAgICB2YXIga2V5ID0gbmV4dEEudmFsdWU7XG4gICAgdmFyIGhhc0tleSA9IGIuaGFzKGtleSk7XG4gICAgdGhpcy5jb2xsZWN0RmFpbCghaGFzS2V5LCBmb3JtYXQoU0VUX01BUF9NSVNTSU5HX0tFWSwga2V5KSk7XG4gIH1cbn1cblxuRVEuYWRkKHQuT0JKRUNULCB0Lk1BUCwgZnVuY3Rpb24oYSwgYikge1xuICB0aGlzLl9tZWV0LnB1c2goW2EsIGJdKTtcblxuICBjaGVja01hcEJ5S2V5cy5jYWxsKHRoaXMsIGEsIGIpO1xuICBjaGVja01hcEJ5S2V5cy5jYWxsKHRoaXMsIGIsIGEpO1xuXG4gIHRoaXMuX21lZXQucG9wKCk7XG5cbiAgdGhpcy5jaGVja1BsYWluT2JqZWN0c0VxdWFsaXR5KGEsIGIpO1xufSk7XG5FUS5hZGQodC5PQkpFQ1QsIHQuU0VULCBmdW5jdGlvbihhLCBiKSB7XG4gIHRoaXMuX21lZXQucHVzaChbYSwgYl0pO1xuXG4gIGNoZWNrU2V0QnlLZXlzLmNhbGwodGhpcywgYSwgYik7XG4gIGNoZWNrU2V0QnlLZXlzLmNhbGwodGhpcywgYiwgYSk7XG5cbiAgdGhpcy5fbWVldC5wb3AoKTtcblxuICB0aGlzLmNoZWNrUGxhaW5PYmplY3RzRXF1YWxpdHkoYSwgYik7XG59KTtcblxuZnVuY3Rpb24gZXEoYSwgYiwgb3B0cykge1xuICByZXR1cm4gbmV3IEVRKG9wdHMsIGEsIGIpLmNoZWNrKCk7XG59XG5cbmVxLkVRID0gRVE7XG5cbm1vZHVsZS5leHBvcnRzID0gZXE7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcERlZmF1bHQgKGV4KSB7IHJldHVybiAoZXggJiYgKHR5cGVvZiBleCA9PT0gJ29iamVjdCcpICYmICdkZWZhdWx0JyBpbiBleCkgPyBleFsnZGVmYXVsdCddIDogZXg7IH1cblxudmFyIHQgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnc2hvdWxkLXR5cGUnKSk7XG52YXIgc2hvdWxkVHlwZUFkYXB0b3JzID0gcmVxdWlyZSgnc2hvdWxkLXR5cGUtYWRhcHRvcnMnKTtcblxuZnVuY3Rpb24gbG9va3NMaWtlQU51bWJlcihuKSB7XG4gIHJldHVybiAhIW4ubWF0Y2goL1xcZCsvKTtcbn1cblxuZnVuY3Rpb24ga2V5Q29tcGFyZShhLCBiKSB7XG4gIHZhciBhTnVtID0gbG9va3NMaWtlQU51bWJlcihhKTtcbiAgdmFyIGJOdW0gPSBsb29rc0xpa2VBTnVtYmVyKGIpO1xuICBpZiAoYU51bSAmJiBiTnVtKSB7XG4gICAgcmV0dXJuIDEqYSAtIDEqYjtcbiAgfSBlbHNlIGlmIChhTnVtICYmICFiTnVtKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKCFhTnVtICYmIGJOdW0pIHtcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdlbktleXNGdW5jKGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGsgPSBmKHZhbHVlKTtcbiAgICBrLnNvcnQoa2V5Q29tcGFyZSk7XG4gICAgcmV0dXJuIGs7XG4gIH07XG59XG5cbmZ1bmN0aW9uIEZvcm1hdHRlcihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gIHRoaXMuc2VlbiA9IFtdO1xuXG4gIHZhciBrZXlzRnVuYztcbiAgaWYgKHR5cGVvZiBvcHRzLmtleXNGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAga2V5c0Z1bmMgPSBvcHRzLmtleXNGdW5jO1xuICB9IGVsc2UgaWYgKG9wdHMua2V5cyA9PT0gZmFsc2UpIHtcbiAgICBrZXlzRnVuYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICB9IGVsc2Uge1xuICAgIGtleXNGdW5jID0gT2JqZWN0LmtleXM7XG4gIH1cblxuICB0aGlzLmdldEtleXMgPSBnZW5LZXlzRnVuYyhrZXlzRnVuYyk7XG5cbiAgdGhpcy5tYXhMaW5lTGVuZ3RoID0gdHlwZW9mIG9wdHMubWF4TGluZUxlbmd0aCA9PT0gJ251bWJlcicgPyBvcHRzLm1heExpbmVMZW5ndGggOiA2MDtcbiAgdGhpcy5wcm9wU2VwID0gb3B0cy5wcm9wU2VwIHx8ICcsJztcblxuICB0aGlzLmlzVVRDZGF0ZSA9ICEhb3B0cy5pc1VUQ2RhdGU7XG59XG5cblxuXG5Gb3JtYXR0ZXIucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogRm9ybWF0dGVyLFxuXG4gIGZvcm1hdDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgdHAgPSB0KHZhbHVlKTtcblxuICAgIGlmICh0aGlzLmFscmVhZHlTZWVuKHZhbHVlKSkge1xuICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICB9XG5cbiAgICB2YXIgdHJpZXMgPSB0cC50b1RyeVR5cGVzKCk7XG4gICAgdmFyIGYgPSB0aGlzLmRlZmF1bHRGb3JtYXQ7XG4gICAgd2hpbGUgKHRyaWVzLmxlbmd0aCkge1xuICAgICAgdmFyIHRvVHJ5ID0gdHJpZXMuc2hpZnQoKTtcbiAgICAgIHZhciBuYW1lID0gRm9ybWF0dGVyLmZvcm1hdHRlckZ1bmN0aW9uTmFtZSh0b1RyeSk7XG4gICAgICBpZiAodGhpc1tuYW1lXSkge1xuICAgICAgICBmID0gdGhpc1tuYW1lXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmLmNhbGwodGhpcywgdmFsdWUpLnRyaW0oKTtcbiAgfSxcblxuICBkZWZhdWx0Rm9ybWF0OiBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gU3RyaW5nKG9iaik7XG4gIH0sXG5cbiAgYWxyZWFkeVNlZW46IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vlbi5pbmRleE9mKHZhbHVlKSA+PSAwO1xuICB9XG5cbn07XG5cbkZvcm1hdHRlci5hZGRUeXBlID0gZnVuY3Rpb24gYWRkVHlwZSh0cCwgZikge1xuICBGb3JtYXR0ZXIucHJvdG90eXBlW0Zvcm1hdHRlci5mb3JtYXR0ZXJGdW5jdGlvbk5hbWUodHApXSA9IGY7XG59O1xuXG5Gb3JtYXR0ZXIuZm9ybWF0dGVyRnVuY3Rpb25OYW1lID0gZnVuY3Rpb24gZm9ybWF0dGVyRnVuY3Rpb25OYW1lKHRwKSB7XG4gIHJldHVybiAnX2Zvcm1hdF8nICsgdHAudG9TdHJpbmcoJ18nKTtcbn07XG5cbnZhciBFT0wgPSAnXFxuJztcblxuZnVuY3Rpb24gaW5kZW50KHYsIGluZGVudGF0aW9uKSB7XG4gIHJldHVybiB2XG4gICAgLnNwbGl0KEVPTClcbiAgICAubWFwKGZ1bmN0aW9uKHZ2KSB7XG4gICAgICByZXR1cm4gaW5kZW50YXRpb24gKyB2djtcbiAgICB9KVxuICAgIC5qb2luKEVPTCk7XG59XG5cbmZ1bmN0aW9uIHBhZChzdHIsIHZhbHVlLCBmaWxsZXIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIHZhciBpc1JpZ2h0ID0gZmFsc2U7XG5cbiAgaWYgKHZhbHVlIDwgMCkge1xuICAgIGlzUmlnaHQgPSB0cnVlO1xuICAgIHZhbHVlID0gLXZhbHVlO1xuICB9XG5cbiAgaWYgKHN0ci5sZW5ndGggPCB2YWx1ZSkge1xuICAgIHZhciBwYWRkaW5nID0gbmV3IEFycmF5KHZhbHVlIC0gc3RyLmxlbmd0aCArIDEpLmpvaW4oZmlsbGVyKTtcbiAgICByZXR1cm4gaXNSaWdodCA/IHN0ciArIHBhZGRpbmcgOiBwYWRkaW5nICsgc3RyO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFkMChzdHIsIHZhbHVlKSB7XG4gIHJldHVybiBwYWQoc3RyLCB2YWx1ZSwgJzAnKTtcbn1cblxudmFyIGZ1bmN0aW9uTmFtZVJFID0gL15cXHMqZnVuY3Rpb25cXHMqKFxcUyopXFxzKlxcKC87XG5cbmZ1bmN0aW9uIGZ1bmN0aW9uTmFtZShmKSB7XG4gIGlmIChmLm5hbWUpIHtcbiAgICByZXR1cm4gZi5uYW1lO1xuICB9XG4gIHZhciBtYXRjaGVzID0gZi50b1N0cmluZygpLm1hdGNoKGZ1bmN0aW9uTmFtZVJFKTtcbiAgaWYgKG1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAvLyBgZnVuY3Rpb25OYW1lUkVgIGRvZXNuJ3QgbWF0Y2ggYXJyb3cgZnVuY3Rpb25zLlxuICAgIHJldHVybiAnJztcbiAgfVxuICB2YXIgbmFtZSA9IG1hdGNoZXNbMV07XG4gIHJldHVybiBuYW1lO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3Rvck5hbWUob2JqKSB7XG4gIHdoaWxlIChvYmopIHtcbiAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCAnY29uc3RydWN0b3InKTtcbiAgICBpZiAoZGVzY3JpcHRvciAhPT0gdW5kZWZpbmVkICYmICB0eXBlb2YgZGVzY3JpcHRvci52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG5hbWUgPSBmdW5jdGlvbk5hbWUoZGVzY3JpcHRvci52YWx1ZSk7XG4gICAgICBpZiAobmFtZSAhPT0gJycpIHtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gIH1cbn1cblxudmFyIElOREVOVCA9ICcgICc7XG5cbmZ1bmN0aW9uIGFkZFNwYWNlcyhzdHIpIHtcbiAgcmV0dXJuIGluZGVudChzdHIsIElOREVOVCk7XG59XG5cbmZ1bmN0aW9uIHR5cGVBZGFwdG9yRm9yRWFjaEZvcm1hdChvYmosIG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBmaWx0ZXJLZXkgPSBvcHRzLmZpbHRlcktleSB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH07XG5cbiAgdmFyIGZvcm1hdEtleSA9IG9wdHMuZm9ybWF0S2V5IHx8IHRoaXMuZm9ybWF0O1xuICB2YXIgZm9ybWF0VmFsdWUgPSBvcHRzLmZvcm1hdFZhbHVlIHx8IHRoaXMuZm9ybWF0O1xuXG4gIHZhciBrZXlWYWx1ZVNlcCA9IHR5cGVvZiBvcHRzLmtleVZhbHVlU2VwICE9PSAndW5kZWZpbmVkJyA/IG9wdHMua2V5VmFsdWVTZXAgOiAnOiAnO1xuXG4gIHRoaXMuc2Vlbi5wdXNoKG9iaik7XG5cbiAgdmFyIGZvcm1hdExlbmd0aCA9IDA7XG4gIHZhciBwYWlycyA9IFtdO1xuXG4gIHNob3VsZFR5cGVBZGFwdG9ycy5mb3JFYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIGlmICghZmlsdGVyS2V5KGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZm9ybWF0dGVkS2V5ID0gZm9ybWF0S2V5LmNhbGwodGhpcywga2V5KTtcbiAgICB2YXIgZm9ybWF0dGVkVmFsdWUgPSBmb3JtYXRWYWx1ZS5jYWxsKHRoaXMsIHZhbHVlLCBrZXkpO1xuXG4gICAgdmFyIHBhaXIgPSBmb3JtYXR0ZWRLZXkgPyAoZm9ybWF0dGVkS2V5ICsga2V5VmFsdWVTZXAgKyBmb3JtYXR0ZWRWYWx1ZSkgOiBmb3JtYXR0ZWRWYWx1ZTtcblxuICAgIGZvcm1hdExlbmd0aCArPSBwYWlyLmxlbmd0aDtcbiAgICBwYWlycy5wdXNoKHBhaXIpO1xuICB9LCB0aGlzKTtcblxuICB0aGlzLnNlZW4ucG9wKCk7XG5cbiAgKG9wdHMuYWRkaXRpb25hbEtleXMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oa2V5VmFsdWUpIHtcbiAgICB2YXIgcGFpciA9IGtleVZhbHVlWzBdICsga2V5VmFsdWVTZXAgKyB0aGlzLmZvcm1hdChrZXlWYWx1ZVsxXSk7XG4gICAgZm9ybWF0TGVuZ3RoICs9IHBhaXIubGVuZ3RoO1xuICAgIHBhaXJzLnB1c2gocGFpcik7XG4gIH0sIHRoaXMpO1xuXG4gIHZhciBwcmVmaXggPSBvcHRzLnByZWZpeCB8fCBjb25zdHJ1Y3Rvck5hbWUob2JqKSB8fCAnJztcbiAgaWYgKHByZWZpeC5sZW5ndGggPiAwKSB7XG4gICAgcHJlZml4ICs9ICcgJztcbiAgfVxuXG4gIHZhciBsYnJhY2tldCwgcmJyYWNrZXQ7XG4gIGlmIChBcnJheS5pc0FycmF5KG9wdHMuYnJhY2tldHMpKSB7XG4gICAgbGJyYWNrZXQgPSBvcHRzLmJyYWNrZXRzWzBdO1xuICAgIHJicmFja2V0ID0gb3B0cy5icmFja2V0c1sxXTtcbiAgfSBlbHNlIHtcbiAgICBsYnJhY2tldCA9ICd7JztcbiAgICByYnJhY2tldCA9ICd9JztcbiAgfVxuXG4gIHZhciByb290VmFsdWUgPSBvcHRzLnZhbHVlIHx8ICcnO1xuXG4gIGlmIChwYWlycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gcm9vdFZhbHVlIHx8IChwcmVmaXggKyBsYnJhY2tldCArIHJicmFja2V0KTtcbiAgfVxuXG4gIGlmIChmb3JtYXRMZW5ndGggPD0gdGhpcy5tYXhMaW5lTGVuZ3RoKSB7XG4gICAgcmV0dXJuIHByZWZpeCArIGxicmFja2V0ICsgJyAnICsgKHJvb3RWYWx1ZSA/IHJvb3RWYWx1ZSArICcgJyA6ICcnKSArIHBhaXJzLmpvaW4odGhpcy5wcm9wU2VwICsgJyAnKSArICcgJyArIHJicmFja2V0O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBwcmVmaXggKyBsYnJhY2tldCArICdcXG4nICsgKHJvb3RWYWx1ZSA/ICcgICcgKyByb290VmFsdWUgKyAnXFxuJyA6ICcnKSArIHBhaXJzLm1hcChhZGRTcGFjZXMpLmpvaW4odGhpcy5wcm9wU2VwICsgJ1xcbicpICsgJ1xcbicgKyByYnJhY2tldDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb3JtYXRQbGFpbk9iamVjdEtleShrZXkpIHtcbiAgcmV0dXJuIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIGtleS5tYXRjaCgvXlthLXpBLVpfJF1bYS16QS1aXyQwLTldKiQvKSA/IGtleSA6IHRoaXMuZm9ybWF0KGtleSk7XG59XG5cbmZ1bmN0aW9uIGdldFByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSkge1xuICB2YXIgZGVzYztcbiAgdHJ5IHtcbiAgICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSkgfHwgeyB2YWx1ZTogb2JqW2tleV0gfTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRlc2MgPSB7IHZhbHVlOiBlIH07XG4gIH1cbiAgcmV0dXJuIGRlc2M7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFBsYWluT2JqZWN0VmFsdWUob2JqLCBrZXkpIHtcbiAgdmFyIGRlc2MgPSBnZXRQcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuICBpZiAoZGVzYy5nZXQgJiYgZGVzYy5zZXQpIHtcbiAgICByZXR1cm4gJ1tHZXR0ZXIvU2V0dGVyXSc7XG4gIH1cbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgcmV0dXJuICdbR2V0dGVyXSc7XG4gIH1cbiAgaWYgKGRlc2Muc2V0KSB7XG4gICAgcmV0dXJuICdbU2V0dGVyXSc7XG4gIH1cblxuICByZXR1cm4gdGhpcy5mb3JtYXQoZGVzYy52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFBsYWluT2JqZWN0KG9iaiwgb3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5rZXlWYWx1ZVNlcCA9ICc6ICc7XG4gIG9wdHMuZm9ybWF0S2V5ID0gb3B0cy5mb3JtYXRLZXkgfHwgZm9ybWF0UGxhaW5PYmplY3RLZXk7XG4gIG9wdHMuZm9ybWF0VmFsdWUgPSBvcHRzLmZvcm1hdFZhbHVlIHx8IGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICByZXR1cm4gZm9ybWF0UGxhaW5PYmplY3RWYWx1ZS5jYWxsKHRoaXMsIG9iaiwga2V5KTtcbiAgfTtcbiAgcmV0dXJuIHR5cGVBZGFwdG9yRm9yRWFjaEZvcm1hdC5jYWxsKHRoaXMsIG9iaiwgb3B0cyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFdyYXBwZXIxKHZhbHVlKSB7XG4gIHJldHVybiBmb3JtYXRQbGFpbk9iamVjdC5jYWxsKHRoaXMsIHZhbHVlLCB7XG4gICAgYWRkaXRpb25hbEtleXM6IFtbJ1tbUHJpbWl0aXZlVmFsdWVdXScsIHZhbHVlLnZhbHVlT2YoKV1dXG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFdyYXBwZXIyKHZhbHVlKSB7XG4gIHZhciByZWFsVmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XG5cbiAgcmV0dXJuIGZvcm1hdFBsYWluT2JqZWN0LmNhbGwodGhpcywgdmFsdWUsIHtcbiAgICBmaWx0ZXJLZXk6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgLy9za2lwIHVzZWxlc3MgaW5kZXhlZCBwcm9wZXJ0aWVzXG4gICAgICByZXR1cm4gIShrZXkubWF0Y2goL1xcZCsvKSAmJiBwYXJzZUludChrZXksIDEwKSA8IHJlYWxWYWx1ZS5sZW5ndGgpO1xuICAgIH0sXG4gICAgYWRkaXRpb25hbEtleXM6IFtbJ1tbUHJpbWl0aXZlVmFsdWVdXScsIHJlYWxWYWx1ZV1dXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRSZWdFeHAodmFsdWUpIHtcbiAgcmV0dXJuIGZvcm1hdFBsYWluT2JqZWN0LmNhbGwodGhpcywgdmFsdWUsIHtcbiAgICB2YWx1ZTogU3RyaW5nKHZhbHVlKVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGZvcm1hdFBsYWluT2JqZWN0LmNhbGwodGhpcywgdmFsdWUsIHtcbiAgICBwcmVmaXg6ICdGdW5jdGlvbicsXG4gICAgYWRkaXRpb25hbEtleXM6IFtbJ25hbWUnLCBmdW5jdGlvbk5hbWUodmFsdWUpXV1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiBmb3JtYXRQbGFpbk9iamVjdC5jYWxsKHRoaXMsIHZhbHVlLCB7XG4gICAgZm9ybWF0S2V5OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmICgha2V5Lm1hdGNoKC9cXGQrLykpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdFBsYWluT2JqZWN0S2V5LmNhbGwodGhpcywga2V5KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGJyYWNrZXRzOiBbJ1snLCAnXSddXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBcmd1bWVudHModmFsdWUpIHtcbiAgcmV0dXJuIGZvcm1hdFBsYWluT2JqZWN0LmNhbGwodGhpcywgdmFsdWUsIHtcbiAgICBmb3JtYXRLZXk6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKCFrZXkubWF0Y2goL1xcZCsvKSkge1xuICAgICAgICByZXR1cm4gZm9ybWF0UGxhaW5PYmplY3RLZXkuY2FsbCh0aGlzLCBrZXkpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYnJhY2tldHM6IFsnWycsICddJ10sXG4gICAgcHJlZml4OiAnQXJndW1lbnRzJ1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2Zvcm1hdERhdGUodmFsdWUsIGlzVVRDKSB7XG4gIHZhciBwcmVmaXggPSBpc1VUQyA/ICdVVEMnIDogJyc7XG5cbiAgdmFyIGRhdGUgPSB2YWx1ZVsnZ2V0JyArIHByZWZpeCArICdGdWxsWWVhciddKCkgK1xuICAgICctJyArXG4gICAgcGFkMCh2YWx1ZVsnZ2V0JyArIHByZWZpeCArICdNb250aCddKCkgKyAxLCAyKSArXG4gICAgJy0nICtcbiAgICBwYWQwKHZhbHVlWydnZXQnICsgcHJlZml4ICsgJ0RhdGUnXSgpLCAyKTtcblxuICB2YXIgdGltZSA9IHBhZDAodmFsdWVbJ2dldCcgKyBwcmVmaXggKyAnSG91cnMnXSgpLCAyKSArXG4gICAgJzonICtcbiAgICBwYWQwKHZhbHVlWydnZXQnICsgcHJlZml4ICsgJ01pbnV0ZXMnXSgpLCAyKSArXG4gICAgJzonICtcbiAgICBwYWQwKHZhbHVlWydnZXQnICsgcHJlZml4ICsgJ1NlY29uZHMnXSgpLCAyKSArXG4gICAgJy4nICtcbiAgICBwYWQwKHZhbHVlWydnZXQnICsgcHJlZml4ICsgJ01pbGxpc2Vjb25kcyddKCksIDMpO1xuXG4gIHZhciB0byA9IHZhbHVlLmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gIHZhciBhYnNUbyA9IE1hdGguYWJzKHRvKTtcbiAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihhYnNUbyAvIDYwKTtcbiAgdmFyIG1pbnV0ZXMgPSBhYnNUbyAtIGhvdXJzICogNjA7XG4gIHZhciB0ekZvcm1hdCA9ICh0byA8IDAgPyAnKycgOiAnLScpICsgcGFkMChob3VycywgMikgKyBwYWQwKG1pbnV0ZXMsIDIpO1xuXG4gIHJldHVybiBkYXRlICsgJyAnICsgdGltZSArIChpc1VUQyA/ICcnIDogJyAnICsgdHpGb3JtYXQpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXREYXRlKHZhbHVlKSB7XG4gIHJldHVybiBmb3JtYXRQbGFpbk9iamVjdC5jYWxsKHRoaXMsIHZhbHVlLCB7IHZhbHVlOiBfZm9ybWF0RGF0ZSh2YWx1ZSwgdGhpcy5pc1VUQ2RhdGUpIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gZm9ybWF0UGxhaW5PYmplY3QuY2FsbCh0aGlzLCB2YWx1ZSwge1xuICAgIHByZWZpeDogdmFsdWUubmFtZSxcbiAgICBhZGRpdGlvbmFsS2V5czogW1snbWVzc2FnZScsIHZhbHVlLm1lc3NhZ2VdXVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVGb3JtYXRGb3JOdW1iZXJBcnJheShsZW5ndGhQcm9wLCBuYW1lLCBwYWRkaW5nKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBtYXggPSB0aGlzLmJ5dGVBcnJheU1heExlbmd0aCB8fCA1MDtcbiAgICB2YXIgbGVuZ3RoID0gdmFsdWVbbGVuZ3RoUHJvcF07XG4gICAgdmFyIGZvcm1hdHRlZFZhbHVlcyA9IFtdO1xuICAgIHZhciBsZW4gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4ICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGIgPSB2YWx1ZVtpXSB8fCAwO1xuICAgICAgdmFyIHYgPSBwYWQwKGIudG9TdHJpbmcoMTYpLCBwYWRkaW5nKTtcbiAgICAgIGxlbiArPSB2Lmxlbmd0aDtcbiAgICAgIGZvcm1hdHRlZFZhbHVlcy5wdXNoKHYpO1xuICAgIH1cbiAgICB2YXIgcHJlZml4ID0gdmFsdWUuY29uc3RydWN0b3IubmFtZSB8fCBuYW1lIHx8ICcnO1xuICAgIGlmIChwcmVmaXgpIHtcbiAgICAgIHByZWZpeCArPSAnICc7XG4gICAgfVxuXG4gICAgaWYgKGZvcm1hdHRlZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBwcmVmaXggKyAnW10nO1xuICAgIH1cblxuICAgIGlmIChsZW4gPD0gdGhpcy5tYXhMaW5lTGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcHJlZml4ICsgJ1sgJyArIGZvcm1hdHRlZFZhbHVlcy5qb2luKHRoaXMucHJvcFNlcCArICcgJykgKyAnICcgKyAnXSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcmVmaXggKyAnW1xcbicgKyBmb3JtYXR0ZWRWYWx1ZXMubWFwKGFkZFNwYWNlcykuam9pbih0aGlzLnByb3BTZXAgKyAnXFxuJykgKyAnXFxuJyArICddJztcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1hcChvYmopIHtcbiAgcmV0dXJuIHR5cGVBZGFwdG9yRm9yRWFjaEZvcm1hdC5jYWxsKHRoaXMsIG9iaiwge1xuICAgIGtleVZhbHVlU2VwOiAnID0+ICdcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNldChvYmopIHtcbiAgcmV0dXJuIHR5cGVBZGFwdG9yRm9yRWFjaEZvcm1hdC5jYWxsKHRoaXMsIG9iaiwge1xuICAgIGtleVZhbHVlU2VwOiAnJyxcbiAgICBmb3JtYXRLZXk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJyc7IH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdlblNpbWRWZWN0b3JGb3JtYXQoY29uc3RydWN0b3JOYW1lLCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIENvbnN0cnVjdG9yID0gdmFsdWUuY29uc3RydWN0b3I7XG4gICAgdmFyIGV4dHJhY3RMYW5lID0gQ29uc3RydWN0b3IuZXh0cmFjdExhbmU7XG5cbiAgICB2YXIgbGVuID0gMDtcbiAgICB2YXIgcHJvcHMgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICsrKSB7XG4gICAgICB2YXIga2V5ID0gdGhpcy5mb3JtYXQoZXh0cmFjdExhbmUodmFsdWUsIGkpKTtcbiAgICAgIGxlbiArPSBrZXkubGVuZ3RoO1xuICAgICAgcHJvcHMucHVzaChrZXkpO1xuICAgIH1cblxuICAgIGlmIChsZW4gPD0gdGhpcy5tYXhMaW5lTGVuZ3RoKSB7XG4gICAgICByZXR1cm4gY29uc3RydWN0b3JOYW1lICsgJyBbICcgKyBwcm9wcy5qb2luKHRoaXMucHJvcFNlcCArICcgJykgKyAnIF0nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29uc3RydWN0b3JOYW1lICsgJyBbXFxuJyArIHByb3BzLm1hcChhZGRTcGFjZXMpLmpvaW4odGhpcy5wcm9wU2VwICsgJ1xcbicpICsgJ1xcbicgKyAnXSc7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Rm9ybWF0KHZhbHVlLCBvcHRzKSB7XG4gIHJldHVybiBuZXcgRm9ybWF0dGVyKG9wdHMpLmZvcm1hdCh2YWx1ZSk7XG59XG5cbmRlZmF1bHRGb3JtYXQuRm9ybWF0dGVyID0gRm9ybWF0dGVyO1xuZGVmYXVsdEZvcm1hdC5hZGRTcGFjZXMgPSBhZGRTcGFjZXM7XG5kZWZhdWx0Rm9ybWF0LnBhZDAgPSBwYWQwO1xuZGVmYXVsdEZvcm1hdC5mdW5jdGlvbk5hbWUgPSBmdW5jdGlvbk5hbWU7XG5kZWZhdWx0Rm9ybWF0LmNvbnN0cnVjdG9yTmFtZSA9IGNvbnN0cnVjdG9yTmFtZTtcbmRlZmF1bHRGb3JtYXQuZm9ybWF0UGxhaW5PYmplY3RLZXkgPSBmb3JtYXRQbGFpbk9iamVjdEtleTtcbmRlZmF1bHRGb3JtYXQuZm9ybWF0UGxhaW5PYmplY3QgPSBmb3JtYXRQbGFpbk9iamVjdDtcbmRlZmF1bHRGb3JtYXQudHlwZUFkYXB0b3JGb3JFYWNoRm9ybWF0ID0gdHlwZUFkYXB0b3JGb3JFYWNoRm9ybWF0O1xuLy8gYWRkaW5nIHByaW1pdGl2ZSB0eXBlc1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0LlVOREVGSU5FRCksIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ3VuZGVmaW5lZCc7XG59KTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5OVUxMKSwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnbnVsbCc7XG59KTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5CT09MRUFOKSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID8gJ3RydWUnOiAnZmFsc2UnO1xufSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuU1lNQk9MKSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG59KTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5OVU1CRVIpLCBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkge1xuICAgIHJldHVybiAnLTAnO1xuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufSk7XG5cbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5TVFJJTkcpLCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbn0pO1xuXG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuRlVOQ1RJT04pLCBmb3JtYXRGdW5jdGlvbik7XG5cbi8vIHBsYWluIG9iamVjdFxuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCksIGZvcm1hdFBsYWluT2JqZWN0KTtcblxuLy8gdHlwZSB3cmFwcGVyc1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5OVU1CRVIpLCBmb3JtYXRXcmFwcGVyMSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LkJPT0xFQU4pLCBmb3JtYXRXcmFwcGVyMSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlNUUklORyksIGZvcm1hdFdyYXBwZXIyKTtcblxuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5SRUdFWFApLCBmb3JtYXRSZWdFeHApO1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5BUlJBWSksIGZvcm1hdEFycmF5KTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuQVJHVU1FTlRTKSwgZm9ybWF0QXJndW1lbnRzKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuREFURSksIGZvcm1hdERhdGUpO1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5FUlJPUiksIGZvcm1hdEVycm9yKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuU0VUKSwgZm9ybWF0U2V0KTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuTUFQKSwgZm9ybWF0TWFwKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuV0VBS19NQVApLCBmb3JtYXRNYXApO1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5XRUFLX1NFVCksIGZvcm1hdFNldCk7XG5cbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuQlVGRkVSKSwgZ2VuZXJhdGVGb3JtYXRGb3JOdW1iZXJBcnJheSgnbGVuZ3RoJywgJ0J1ZmZlcicsIDIpKTtcblxuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5BUlJBWV9CVUZGRVIpLCBnZW5lcmF0ZUZvcm1hdEZvck51bWJlckFycmF5KCdieXRlTGVuZ3RoJywgJ0FycmF5QnVmZmVyJywgMikpO1xuXG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlRZUEVEX0FSUkFZLCAnaW50OCcpLCBnZW5lcmF0ZUZvcm1hdEZvck51bWJlckFycmF5KCdsZW5ndGgnLCAnSW50OEFycmF5JywgMikpO1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5UWVBFRF9BUlJBWSwgJ3VpbnQ4JyksIGdlbmVyYXRlRm9ybWF0Rm9yTnVtYmVyQXJyYXkoJ2xlbmd0aCcsICdVaW50OEFycmF5JywgMikpO1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5UWVBFRF9BUlJBWSwgJ3VpbnQ4Y2xhbXBlZCcpLCBnZW5lcmF0ZUZvcm1hdEZvck51bWJlckFycmF5KCdsZW5ndGgnLCAnVWludDhDbGFtcGVkQXJyYXknLCAyKSk7XG5cbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuVFlQRURfQVJSQVksICdpbnQxNicpLCBnZW5lcmF0ZUZvcm1hdEZvck51bWJlckFycmF5KCdsZW5ndGgnLCAnSW50MTZBcnJheScsIDQpKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuVFlQRURfQVJSQVksICd1aW50MTYnKSwgZ2VuZXJhdGVGb3JtYXRGb3JOdW1iZXJBcnJheSgnbGVuZ3RoJywgJ1VpbnQxNkFycmF5JywgNCkpO1xuXG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlRZUEVEX0FSUkFZLCAnaW50MzInKSwgZ2VuZXJhdGVGb3JtYXRGb3JOdW1iZXJBcnJheSgnbGVuZ3RoJywgJ0ludDMyQXJyYXknLCA4KSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlRZUEVEX0FSUkFZLCAndWludDMyJyksIGdlbmVyYXRlRm9ybWF0Rm9yTnVtYmVyQXJyYXkoJ2xlbmd0aCcsICdVaW50MzJBcnJheScsIDgpKTtcblxuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5TSU1ELCAnYm9vbDE2eDgnKSwgZ2VuU2ltZFZlY3RvckZvcm1hdCgnQm9vbDE2eDgnLCA4KSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlNJTUQsICdib29sMzJ4NCcpLCBnZW5TaW1kVmVjdG9yRm9ybWF0KCdCb29sMzJ4NCcsIDQpKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuU0lNRCwgJ2Jvb2w4eDE2JyksIGdlblNpbWRWZWN0b3JGb3JtYXQoJ0Jvb2w4eDE2JywgMTYpKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuU0lNRCwgJ2Zsb2F0MzJ4NCcpLCBnZW5TaW1kVmVjdG9yRm9ybWF0KCdGbG9hdDMyeDQnLCA0KSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlNJTUQsICdpbnQxNng4JyksIGdlblNpbWRWZWN0b3JGb3JtYXQoJ0ludDE2eDgnLCA4KSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlNJTUQsICdpbnQzMng0JyksIGdlblNpbWRWZWN0b3JGb3JtYXQoJ0ludDMyeDQnLCA0KSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlNJTUQsICdpbnQ4eDE2JyksIGdlblNpbWRWZWN0b3JGb3JtYXQoJ0ludDh4MTYnLCAxNikpO1xuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5TSU1ELCAndWludDE2eDgnKSwgZ2VuU2ltZFZlY3RvckZvcm1hdCgnVWludDE2eDgnLCA4KSk7XG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlNJTUQsICd1aW50MzJ4NCcpLCBnZW5TaW1kVmVjdG9yRm9ybWF0KCdVaW50MzJ4NCcsIDQpKTtcbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuU0lNRCwgJ3VpbnQ4eDE2JyksIGdlblNpbWRWZWN0b3JGb3JtYXQoJ1VpbnQ4eDE2JywgMTYpKTtcblxuXG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LlBST01JU0UpLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICdbUHJvbWlzZV0nOy8vVE9ETyBpdCBjb3VsZCBiZSBuaWNlIHRvIGluc3BlY3QgaXRzIHN0YXRlIGFuZCB2YWx1ZVxufSk7XG5cbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuWEhSKSwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnW1hNTEh0dHBSZXF1ZXN0XSc7Ly9UT0RPIGl0IGNvdWxkIGJlIG5pY2UgdG8gaW5zcGVjdCBpdHMgc3RhdGVcbn0pO1xuXG5Gb3JtYXR0ZXIuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0LkhUTUxfRUxFTUVOVCksIGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5vdXRlckhUTUw7XG59KTtcblxuRm9ybWF0dGVyLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5IVE1MX0VMRU1FTlQsICcjdGV4dCcpLCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUubm9kZVZhbHVlO1xufSk7XG5cbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuSFRNTF9FTEVNRU5ULCAnI2RvY3VtZW50JyksIGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5kb2N1bWVudEVsZW1lbnQub3V0ZXJIVE1MO1xufSk7XG5cbkZvcm1hdHRlci5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuSE9TVCksIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ1tIb3N0XSc7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0Rm9ybWF0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuZnVuY3Rpb24gX2ludGVyb3BEZWZhdWx0IChleCkgeyByZXR1cm4gKGV4ICYmICh0eXBlb2YgZXggPT09ICdvYmplY3QnKSAmJiAnZGVmYXVsdCcgaW4gZXgpID8gZXhbJ2RlZmF1bHQnXSA6IGV4OyB9XG5cbnZhciBzaG91bGRVdGlsID0gcmVxdWlyZSgnc2hvdWxkLXV0aWwnKTtcbnZhciB0ID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ3Nob3VsZC10eXBlJykpO1xuXG4vLyBUT0RPIGluIGZ1dHVyZSBhZGQgZ2VuZXJhdG9ycyBpbnN0ZWFkIG9mIGZvckVhY2ggYW5kIGl0ZXJhdG9yIGltcGxlbWVudGF0aW9uXG5cblxuZnVuY3Rpb24gT2JqZWN0SXRlcmF0b3Iob2JqKSB7XG4gIHRoaXMuX29iaiA9IG9iajtcbn1cblxuT2JqZWN0SXRlcmF0b3IucHJvdG90eXBlID0ge1xuICBfX3Nob3VsZEl0ZXJhdG9yX186IHRydWUsIC8vIHNwZWNpYWwgbWFya2VyXG5cbiAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2RvbmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSXRlcmF0b3IgYWxyZWFkeSByZWFjaGVkIHRoZSBlbmQnKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2tleXMpIHtcbiAgICAgIHRoaXMuX2tleXMgPSBPYmplY3Qua2V5cyh0aGlzLl9vYmopO1xuICAgICAgdGhpcy5faW5kZXggPSAwO1xuICAgIH1cblxuICAgIHZhciBrZXkgPSB0aGlzLl9rZXlzW3RoaXMuX2luZGV4XTtcbiAgICB0aGlzLl9kb25lID0gdGhpcy5faW5kZXggPT09IHRoaXMuX2tleXMubGVuZ3RoO1xuICAgIHRoaXMuX2luZGV4ICs9IDE7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IHRoaXMuX2RvbmUgPyB2b2lkIDA6IFtrZXksIHRoaXMuX29ialtrZXldXSxcbiAgICAgIGRvbmU6IHRoaXMuX2RvbmVcbiAgICB9O1xuICB9XG59O1xuXG5pZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnc3ltYm9sJykge1xuICBPYmplY3RJdGVyYXRvci5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xufVxuXG5cbmZ1bmN0aW9uIFR5cGVBZGFwdG9yU3RvcmFnZSgpIHtcbiAgdGhpcy5fdHlwZUFkYXB0b3JzID0gW107XG4gIHRoaXMuX2l0ZXJhYmxlVHlwZXMgPSB7fTtcbn1cblxuVHlwZUFkYXB0b3JTdG9yYWdlLnByb3RvdHlwZSA9IHtcbiAgYWRkOiBmdW5jdGlvbih0eXBlLCBjbHMsIHN1YiwgYWRhcHRvcikge1xuICAgIHJldHVybiB0aGlzLmFkZFR5cGUobmV3IHQuVHlwZSh0eXBlLCBjbHMsIHN1YiksIGFkYXB0b3IpO1xuICB9LFxuXG4gIGFkZFR5cGU6IGZ1bmN0aW9uKHR5cGUsIGFkYXB0b3IpIHtcbiAgICB0aGlzLl90eXBlQWRhcHRvcnNbdHlwZS50b1N0cmluZygpXSA9IGFkYXB0b3I7XG4gIH0sXG5cbiAgZ2V0QWRhcHRvcjogZnVuY3Rpb24odHAsIGZ1bmNOYW1lKSB7XG4gICAgdmFyIHRyaWVzID0gdHAudG9UcnlUeXBlcygpO1xuICAgIHdoaWxlICh0cmllcy5sZW5ndGgpIHtcbiAgICAgIHZhciB0b1RyeSA9IHRyaWVzLnNoaWZ0KCk7XG4gICAgICB2YXIgYWQgPSB0aGlzLl90eXBlQWRhcHRvcnNbdG9UcnldO1xuICAgICAgaWYgKGFkICYmIGFkW2Z1bmNOYW1lXSkge1xuICAgICAgICByZXR1cm4gYWRbZnVuY05hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByZXF1aXJlQWRhcHRvcjogZnVuY3Rpb24odHAsIGZ1bmNOYW1lKSB7XG4gICAgdmFyIGEgPSB0aGlzLmdldEFkYXB0b3IodHAsIGZ1bmNOYW1lKTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgbm8gdHlwZSBhZGFwdG9yIGAnICsgZnVuY05hbWUgKyAnYCBmb3IgJyArIHRwLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfSxcblxuICBhZGRJdGVyYWJsZVR5cGU6IGZ1bmN0aW9uKHRwKSB7XG4gICAgdGhpcy5faXRlcmFibGVUeXBlc1t0cC50b1N0cmluZygpXSA9IHRydWU7XG4gIH0sXG5cbiAgaXNJdGVyYWJsZVR5cGU6IGZ1bmN0aW9uKHRwKSB7XG4gICAgcmV0dXJuICEhdGhpcy5faXRlcmFibGVUeXBlc1t0cC50b1N0cmluZygpXTtcbiAgfVxufTtcblxudmFyIGRlZmF1bHRUeXBlQWRhcHRvclN0b3JhZ2UgPSBuZXcgVHlwZUFkYXB0b3JTdG9yYWdlKCk7XG5cbnZhciBvYmplY3RBZGFwdG9yID0ge1xuICBmb3JFYWNoOiBmdW5jdGlvbihvYmosIGYsIGNvbnRleHQpIHtcbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKHNob3VsZFV0aWwuaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSAmJiBzaG91bGRVdGlsLnByb3BlcnR5SXNFbnVtZXJhYmxlKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgaWYgKGYuY2FsbChjb250ZXh0LCBvYmpbcHJvcF0sIHByb3AsIG9iaikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGhhczogZnVuY3Rpb24ob2JqLCBwcm9wKSB7XG4gICAgcmV0dXJuIHNob3VsZFV0aWwuaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKTtcbiAgfSxcblxuICBnZXQ6IGZ1bmN0aW9uKG9iaiwgcHJvcCkge1xuICAgIHJldHVybiBvYmpbcHJvcF07XG4gIH0sXG5cbiAgaXRlcmF0b3I6IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBuZXcgT2JqZWN0SXRlcmF0b3Iob2JqKTtcbiAgfVxufTtcblxuLy8gZGVmYXVsdCBmb3Igb2JqZWN0c1xuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QpLCBvYmplY3RBZGFwdG9yKTtcbmRlZmF1bHRUeXBlQWRhcHRvclN0b3JhZ2UuYWRkVHlwZShuZXcgdC5UeXBlKHQuRlVOQ1RJT04pLCBvYmplY3RBZGFwdG9yKTtcblxudmFyIG1hcEFkYXB0b3IgPSB7XG4gIGhhczogZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gb2JqLmhhcyhrZXkpO1xuICB9LFxuXG4gIGdldDogZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gb2JqLmdldChrZXkpO1xuICB9LFxuXG4gIGZvckVhY2g6IGZ1bmN0aW9uKG9iaiwgZiwgY29udGV4dCkge1xuICAgIHZhciBpdGVyID0gb2JqLmVudHJpZXMoKTtcbiAgICBmb3JFYWNoKGl0ZXIsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZi5jYWxsKGNvbnRleHQsIHZhbHVlWzFdLCB2YWx1ZVswXSwgb2JqKTtcbiAgICB9KTtcbiAgfSxcblxuICBzaXplOiBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqLnNpemU7XG4gIH0sXG5cbiAgaXNFbXB0eTogZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iai5zaXplID09PSAwO1xuICB9LFxuXG4gIGl0ZXJhdG9yOiBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqLmVudHJpZXMoKTtcbiAgfVxufTtcblxudmFyIHNldEFkYXB0b3IgPSBzaG91bGRVdGlsLm1lcmdlKHt9LCBtYXBBZGFwdG9yKTtcbnNldEFkYXB0b3IuZ2V0ID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgaWYgKG9iai5oYXMoa2V5KSkge1xuICAgIHJldHVybiBrZXk7XG4gIH1cbn07XG5cbmRlZmF1bHRUeXBlQWRhcHRvclN0b3JhZ2UuYWRkVHlwZShuZXcgdC5UeXBlKHQuT0JKRUNULCB0Lk1BUCksIG1hcEFkYXB0b3IpO1xuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuU0VUKSwgc2V0QWRhcHRvcik7XG5kZWZhdWx0VHlwZUFkYXB0b3JTdG9yYWdlLmFkZFR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5XRUFLX1NFVCksIHNldEFkYXB0b3IpO1xuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5hZGRUeXBlKG5ldyB0LlR5cGUodC5PQkpFQ1QsIHQuV0VBS19NQVApLCBtYXBBZGFwdG9yKTtcblxuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5hZGRUeXBlKG5ldyB0LlR5cGUodC5TVFJJTkcpLCB7XG4gIGlzRW1wdHk6IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09ICcnO1xuICB9LFxuXG4gIHNpemU6IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmoubGVuZ3RoO1xuICB9XG59KTtcblxuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5hZGRJdGVyYWJsZVR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5BUlJBWSkpO1xuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5hZGRJdGVyYWJsZVR5cGUobmV3IHQuVHlwZSh0Lk9CSkVDVCwgdC5BUkdVTUVOVFMpKTtcblxuZnVuY3Rpb24gZm9yRWFjaChvYmosIGYsIGNvbnRleHQpIHtcbiAgaWYgKHNob3VsZFV0aWwuaXNHZW5lcmF0b3JGdW5jdGlvbihvYmopKSB7XG4gICAgcmV0dXJuIGZvckVhY2gob2JqKCksIGYsIGNvbnRleHQpO1xuICB9IGVsc2UgaWYgKHNob3VsZFV0aWwuaXNJdGVyYXRvcihvYmopKSB7XG4gICAgdmFyIHZhbHVlID0gb2JqLm5leHQoKTtcbiAgICB3aGlsZSAoIXZhbHVlLmRvbmUpIHtcbiAgICAgIGlmIChmLmNhbGwoY29udGV4dCwgdmFsdWUudmFsdWUsICd2YWx1ZScsIG9iaikgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhbHVlID0gb2JqLm5leHQoKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIHR5cGUgPSB0KG9iaik7XG4gICAgdmFyIGZ1bmMgPSBkZWZhdWx0VHlwZUFkYXB0b3JTdG9yYWdlLnJlcXVpcmVBZGFwdG9yKHR5cGUsICdmb3JFYWNoJyk7XG4gICAgZnVuYyhvYmosIGYsIGNvbnRleHQpO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc2l6ZShvYmopIHtcbiAgdmFyIHR5cGUgPSB0KG9iaik7XG4gIHZhciBmdW5jID0gZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZS5nZXRBZGFwdG9yKHR5cGUsICdzaXplJyk7XG4gIGlmIChmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmMob2JqKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuID0gMDtcbiAgICBmb3JFYWNoKG9iaiwgZnVuY3Rpb24oKSB7XG4gICAgICBsZW4gKz0gMTtcbiAgICB9KTtcbiAgICByZXR1cm4gbGVuO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHkob2JqKSB7XG4gIHZhciB0eXBlID0gdChvYmopO1xuICB2YXIgZnVuYyA9IGRlZmF1bHRUeXBlQWRhcHRvclN0b3JhZ2UuZ2V0QWRhcHRvcih0eXBlLCAnaXNFbXB0eScpO1xuICBpZiAoZnVuYykge1xuICAgIHJldHVybiBmdW5jKG9iaik7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHJlcyA9IHRydWU7XG4gICAgZm9yRWFjaChvYmosIGZ1bmN0aW9uKCkge1xuICAgICAgcmVzID0gZmFsc2U7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxufVxuXG4vLyByZXR1cm4gYm9vbGVhbiBpZiBvYmogaGFzIHN1Y2ggJ2tleSdcbmZ1bmN0aW9uIGhhcyhvYmosIGtleSkge1xuICB2YXIgdHlwZSA9IHQob2JqKTtcbiAgdmFyIGZ1bmMgPSBkZWZhdWx0VHlwZUFkYXB0b3JTdG9yYWdlLnJlcXVpcmVBZGFwdG9yKHR5cGUsICdoYXMnKTtcbiAgcmV0dXJuIGZ1bmMob2JqLCBrZXkpO1xufVxuXG4vLyByZXR1cm4gdmFsdWUgZm9yIGdpdmVuIGtleVxuZnVuY3Rpb24gZ2V0KG9iaiwga2V5KSB7XG4gIHZhciB0eXBlID0gdChvYmopO1xuICB2YXIgZnVuYyA9IGRlZmF1bHRUeXBlQWRhcHRvclN0b3JhZ2UucmVxdWlyZUFkYXB0b3IodHlwZSwgJ2dldCcpO1xuICByZXR1cm4gZnVuYyhvYmosIGtleSk7XG59XG5cbmZ1bmN0aW9uIHJlZHVjZShvYmosIGYsIGluaXRpYWxWYWx1ZSkge1xuICB2YXIgcmVzID0gaW5pdGlhbFZhbHVlO1xuICBmb3JFYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIHJlcyA9IGYocmVzLCB2YWx1ZSwga2V5LCBvYmopO1xuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gc29tZShvYmosIGYsIGNvbnRleHQpIHtcbiAgdmFyIHJlcyA9IGZhbHNlO1xuICBmb3JFYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIGlmIChmLmNhbGwoY29udGV4dCwgdmFsdWUsIGtleSwgb2JqKSkge1xuICAgICAgcmVzID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sIGNvbnRleHQpO1xuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBldmVyeShvYmosIGYsIGNvbnRleHQpIHtcbiAgdmFyIHJlcyA9IHRydWU7XG4gIGZvckVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgaWYgKCFmLmNhbGwoY29udGV4dCwgdmFsdWUsIGtleSwgb2JqKSkge1xuICAgICAgcmVzID0gZmFsc2U7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCBjb250ZXh0KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gaXNJdGVyYWJsZShvYmopIHtcbiAgcmV0dXJuIGRlZmF1bHRUeXBlQWRhcHRvclN0b3JhZ2UuaXNJdGVyYWJsZVR5cGUodChvYmopKTtcbn1cblxuZnVuY3Rpb24gaXRlcmF0b3Iob2JqKSB7XG4gIHJldHVybiBkZWZhdWx0VHlwZUFkYXB0b3JTdG9yYWdlLnJlcXVpcmVBZGFwdG9yKHQob2JqKSwgJ2l0ZXJhdG9yJykob2JqKTtcbn1cblxuZXhwb3J0cy5kZWZhdWx0VHlwZUFkYXB0b3JTdG9yYWdlID0gZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZTtcbmV4cG9ydHMuZm9yRWFjaCA9IGZvckVhY2g7XG5leHBvcnRzLnNpemUgPSBzaXplO1xuZXhwb3J0cy5pc0VtcHR5ID0gaXNFbXB0eTtcbmV4cG9ydHMuaGFzID0gaGFzO1xuZXhwb3J0cy5nZXQgPSBnZXQ7XG5leHBvcnRzLnJlZHVjZSA9IHJlZHVjZTtcbmV4cG9ydHMuc29tZSA9IHNvbWU7XG5leHBvcnRzLmV2ZXJ5ID0gZXZlcnk7XG5leHBvcnRzLmlzSXRlcmFibGUgPSBpc0l0ZXJhYmxlO1xuZXhwb3J0cy5pdGVyYXRvciA9IGl0ZXJhdG9yOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHR5cGVzID0ge1xuICBOVU1CRVI6ICdudW1iZXInLFxuICBVTkRFRklORUQ6ICd1bmRlZmluZWQnLFxuICBTVFJJTkc6ICdzdHJpbmcnLFxuICBCT09MRUFOOiAnYm9vbGVhbicsXG4gIE9CSkVDVDogJ29iamVjdCcsXG4gIEZVTkNUSU9OOiAnZnVuY3Rpb24nLFxuICBOVUxMOiAnbnVsbCcsXG4gIEFSUkFZOiAnYXJyYXknLFxuICBSRUdFWFA6ICdyZWdleHAnLFxuICBEQVRFOiAnZGF0ZScsXG4gIEVSUk9SOiAnZXJyb3InLFxuICBBUkdVTUVOVFM6ICdhcmd1bWVudHMnLFxuICBTWU1CT0w6ICdzeW1ib2wnLFxuICBBUlJBWV9CVUZGRVI6ICdhcnJheS1idWZmZXInLFxuICBUWVBFRF9BUlJBWTogJ3R5cGVkLWFycmF5JyxcbiAgREFUQV9WSUVXOiAnZGF0YS12aWV3JyxcbiAgTUFQOiAnbWFwJyxcbiAgU0VUOiAnc2V0JyxcbiAgV0VBS19TRVQ6ICd3ZWFrLXNldCcsXG4gIFdFQUtfTUFQOiAnd2Vhay1tYXAnLFxuICBQUk9NSVNFOiAncHJvbWlzZScsXG5cbi8vIG5vZGUgYnVmZmVyXG4gIEJVRkZFUjogJ2J1ZmZlcicsXG5cbi8vIGRvbSBodG1sIGVsZW1lbnRcbiAgSFRNTF9FTEVNRU5UOiAnaHRtbC1lbGVtZW50JyxcbiAgSFRNTF9FTEVNRU5UX1RFWFQ6ICdodG1sLWVsZW1lbnQtdGV4dCcsXG4gIERPQ1VNRU5UOiAnZG9jdW1lbnQnLFxuICBXSU5ET1c6ICd3aW5kb3cnLFxuICBGSUxFOiAnZmlsZScsXG4gIEZJTEVfTElTVDogJ2ZpbGUtbGlzdCcsXG4gIEJMT0I6ICdibG9iJyxcblxuICBIT1NUOiAnaG9zdCcsXG5cbiAgWEhSOiAneGhyJyxcblxuICAvLyBzaW1kXG4gIFNJTUQ6ICdzaW1kJ1xufTtcblxuLypcbiAqIFNpbXBsZSBkYXRhIGZ1bmN0aW9uIHRvIHN0b3JlIHR5cGUgaW5mb3JtYXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFVzdWFsbHkgd2hhdCBpcyByZXR1cm5lZCBmcm9tIHR5cGVvZlxuICogQHBhcmFtIHtzdHJpbmd9IGNscyAgU2FuaXRpemVkIEBDbGFzcyB2aWEgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IHN1YiAgSWYgdHlwZSBhbmQgY2xzIHRoZSBzYW1lLCBhbmQgbmVlZCB0byBzcGVjaWZ5IHNvbWVob3dcbiAqIEBwcml2YXRlXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vZm9yIG51bGxcbiAqIG5ldyBUeXBlKCdudWxsJyk7XG4gKlxuICogLy9mb3IgRGF0ZVxuICogbmV3IFR5cGUoJ29iamVjdCcsICdkYXRlJyk7XG4gKlxuICogLy9mb3IgVWludDhBcnJheVxuICpcbiAqIG5ldyBUeXBlKCdvYmplY3QnLCAndHlwZWQtYXJyYXknLCAndWludDgnKTtcbiAqL1xuZnVuY3Rpb24gVHlwZSh0eXBlLCBjbHMsIHN1Yikge1xuICBpZiAoIXR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1R5cGUgY2xhc3MgbXVzdCBiZSBpbml0aWFsaXplZCBhdCBsZWFzdCB3aXRoIGB0eXBlYCBpbmZvcm1hdGlvbicpO1xuICB9XG4gIHRoaXMudHlwZSA9IHR5cGU7XG4gIHRoaXMuY2xzID0gY2xzO1xuICB0aGlzLnN1YiA9IHN1Yjtcbn1cblxuVHlwZS5wcm90b3R5cGUgPSB7XG4gIHRvU3RyaW5nOiBmdW5jdGlvbihzZXApIHtcbiAgICBzZXAgPSBzZXAgfHwgJzsnO1xuICAgIHZhciBzdHIgPSBbdGhpcy50eXBlXTtcbiAgICBpZiAodGhpcy5jbHMpIHtcbiAgICAgIHN0ci5wdXNoKHRoaXMuY2xzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3ViKSB7XG4gICAgICBzdHIucHVzaCh0aGlzLnN1Yik7XG4gICAgfVxuICAgIHJldHVybiBzdHIuam9pbihzZXApO1xuICB9LFxuXG4gIHRvVHJ5VHlwZXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdHlwZXMgPSBbXTtcbiAgICBpZiAodGhpcy5zdWIpIHtcbiAgICAgIF90eXBlcy5wdXNoKG5ldyBUeXBlKHRoaXMudHlwZSwgdGhpcy5jbHMsIHRoaXMuc3ViKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNscykge1xuICAgICAgX3R5cGVzLnB1c2gobmV3IFR5cGUodGhpcy50eXBlLCB0aGlzLmNscykpO1xuICAgIH1cbiAgICBfdHlwZXMucHVzaChuZXcgVHlwZSh0aGlzLnR5cGUpKTtcblxuICAgIHJldHVybiBfdHlwZXM7XG4gIH1cbn07XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cblxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHN0b3JlIHR5cGUgY2hlY2tzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBUeXBlQ2hlY2tlcigpIHtcbiAgdGhpcy5jaGVja3MgPSBbXTtcbn1cblxuVHlwZUNoZWNrZXIucHJvdG90eXBlID0ge1xuICBhZGQ6IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB0aGlzLmNoZWNrcy5wdXNoKGZ1bmMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGFkZEJlZm9yZUZpcnN0TWF0Y2g6IGZ1bmN0aW9uKG9iaiwgZnVuYykge1xuICAgIHZhciBtYXRjaCA9IHRoaXMuZ2V0Rmlyc3RNYXRjaChvYmopO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgdGhpcy5jaGVja3Muc3BsaWNlKG1hdGNoLmluZGV4LCAwLCBmdW5jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGQoZnVuYyk7XG4gICAgfVxuICB9LFxuXG4gIGFkZFR5cGVPZjogZnVuY3Rpb24odHlwZSwgcmVzKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkKGZ1bmN0aW9uKG9iaiwgdHBlT2YpIHtcbiAgICAgIGlmICh0cGVPZiA9PT0gdHlwZSkge1xuICAgICAgICByZXR1cm4gbmV3IFR5cGUocmVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBhZGRDbGFzczogZnVuY3Rpb24oY2xzLCByZXMsIHN1Yikge1xuICAgIHJldHVybiB0aGlzLmFkZChmdW5jdGlvbihvYmosIHRwZU9mLCBvYmpDbHMpIHtcbiAgICAgIGlmIChvYmpDbHMgPT09IGNscykge1xuICAgICAgICByZXR1cm4gbmV3IFR5cGUodHlwZXMuT0JKRUNULCByZXMsIHN1Yik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgZ2V0Rmlyc3RNYXRjaDogZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHR5cGVPZiA9IHR5cGVvZiBvYmo7XG4gICAgdmFyIGNscyA9IHRvU3RyaW5nLmNhbGwob2JqKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5jaGVja3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgcmVzID0gdGhpcy5jaGVja3NbaV0uY2FsbCh0aGlzLCBvYmosIHR5cGVPZiwgY2xzKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4geyByZXN1bHQ6IHJlcywgZnVuYzogdGhpcy5jaGVja3NbaV0sIGluZGV4OiBpIH07XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGdldFR5cGU6IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBtYXRjaCA9IHRoaXMuZ2V0Rmlyc3RNYXRjaChvYmopO1xuICAgIHJldHVybiBtYXRjaCAmJiBtYXRjaC5yZXN1bHQ7XG4gIH1cbn07XG5cbnZhciBtYWluID0gbmV3IFR5cGVDaGVja2VyKCk7XG5cbi8vVE9ETyBhZGQgaXRlcmF0b3JzXG5cbm1haW5cbiAgLmFkZFR5cGVPZih0eXBlcy5OVU1CRVIsIHR5cGVzLk5VTUJFUilcbiAgLmFkZFR5cGVPZih0eXBlcy5VTkRFRklORUQsIHR5cGVzLlVOREVGSU5FRClcbiAgLmFkZFR5cGVPZih0eXBlcy5TVFJJTkcsIHR5cGVzLlNUUklORylcbiAgLmFkZFR5cGVPZih0eXBlcy5CT09MRUFOLCB0eXBlcy5CT09MRUFOKVxuICAuYWRkVHlwZU9mKHR5cGVzLkZVTkNUSU9OLCB0eXBlcy5GVU5DVElPTilcbiAgLmFkZFR5cGVPZih0eXBlcy5TWU1CT0wsIHR5cGVzLlNZTUJPTClcbiAgLmFkZChmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGUodHlwZXMuTlVMTCk7XG4gICAgfVxuICB9KVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgU3RyaW5nXScsIHR5cGVzLlNUUklORylcbiAgLmFkZENsYXNzKCdbb2JqZWN0IEJvb2xlYW5dJywgdHlwZXMuQk9PTEVBTilcbiAgLmFkZENsYXNzKCdbb2JqZWN0IE51bWJlcl0nLCB0eXBlcy5OVU1CRVIpXG4gIC5hZGRDbGFzcygnW29iamVjdCBBcnJheV0nLCB0eXBlcy5BUlJBWSlcbiAgLmFkZENsYXNzKCdbb2JqZWN0IFJlZ0V4cF0nLCB0eXBlcy5SRUdFWFApXG4gIC5hZGRDbGFzcygnW29iamVjdCBFcnJvcl0nLCB0eXBlcy5FUlJPUilcbiAgLmFkZENsYXNzKCdbb2JqZWN0IERhdGVdJywgdHlwZXMuREFURSlcbiAgLmFkZENsYXNzKCdbb2JqZWN0IEFyZ3VtZW50c10nLCB0eXBlcy5BUkdVTUVOVFMpXG5cbiAgLmFkZENsYXNzKCdbb2JqZWN0IEFycmF5QnVmZmVyXScsIHR5cGVzLkFSUkFZX0JVRkZFUilcbiAgLmFkZENsYXNzKCdbb2JqZWN0IEludDhBcnJheV0nLCB0eXBlcy5UWVBFRF9BUlJBWSwgJ2ludDgnKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgVWludDhBcnJheV0nLCB0eXBlcy5UWVBFRF9BUlJBWSwgJ3VpbnQ4JylcbiAgLmFkZENsYXNzKCdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsIHR5cGVzLlRZUEVEX0FSUkFZLCAndWludDhjbGFtcGVkJylcbiAgLmFkZENsYXNzKCdbb2JqZWN0IEludDE2QXJyYXldJywgdHlwZXMuVFlQRURfQVJSQVksICdpbnQxNicpXG4gIC5hZGRDbGFzcygnW29iamVjdCBVaW50MTZBcnJheV0nLCB0eXBlcy5UWVBFRF9BUlJBWSwgJ3VpbnQxNicpXG4gIC5hZGRDbGFzcygnW29iamVjdCBJbnQzMkFycmF5XScsIHR5cGVzLlRZUEVEX0FSUkFZLCAnaW50MzInKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgVWludDMyQXJyYXldJywgdHlwZXMuVFlQRURfQVJSQVksICd1aW50MzInKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsIHR5cGVzLlRZUEVEX0FSUkFZLCAnZmxvYXQzMicpXG4gIC5hZGRDbGFzcygnW29iamVjdCBGbG9hdDY0QXJyYXldJywgdHlwZXMuVFlQRURfQVJSQVksICdmbG9hdDY0JylcblxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgQm9vbDE2eDhdJywgdHlwZXMuU0lNRCwgJ2Jvb2wxNng4JylcbiAgLmFkZENsYXNzKCdbb2JqZWN0IEJvb2wzMng0XScsIHR5cGVzLlNJTUQsICdib29sMzJ4NCcpXG4gIC5hZGRDbGFzcygnW29iamVjdCBCb29sOHgxNl0nLCB0eXBlcy5TSU1ELCAnYm9vbDh4MTYnKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgRmxvYXQzMng0XScsIHR5cGVzLlNJTUQsICdmbG9hdDMyeDQnKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgSW50MTZ4OF0nLCB0eXBlcy5TSU1ELCAnaW50MTZ4OCcpXG4gIC5hZGRDbGFzcygnW29iamVjdCBJbnQzMng0XScsIHR5cGVzLlNJTUQsICdpbnQzMng0JylcbiAgLmFkZENsYXNzKCdbb2JqZWN0IEludDh4MTZdJywgdHlwZXMuU0lNRCwgJ2ludDh4MTYnKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgVWludDE2eDhdJywgdHlwZXMuU0lNRCwgJ3VpbnQxNng4JylcbiAgLmFkZENsYXNzKCdbb2JqZWN0IFVpbnQzMng0XScsIHR5cGVzLlNJTUQsICd1aW50MzJ4NCcpXG4gIC5hZGRDbGFzcygnW29iamVjdCBVaW50OHgxNl0nLCB0eXBlcy5TSU1ELCAndWludDh4MTYnKVxuXG4gIC5hZGRDbGFzcygnW29iamVjdCBEYXRhVmlld10nLCB0eXBlcy5EQVRBX1ZJRVcpXG4gIC5hZGRDbGFzcygnW29iamVjdCBNYXBdJywgdHlwZXMuTUFQKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgV2Vha01hcF0nLCB0eXBlcy5XRUFLX01BUClcbiAgLmFkZENsYXNzKCdbb2JqZWN0IFNldF0nLCB0eXBlcy5TRVQpXG4gIC5hZGRDbGFzcygnW29iamVjdCBXZWFrU2V0XScsIHR5cGVzLldFQUtfU0VUKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgUHJvbWlzZV0nLCB0eXBlcy5QUk9NSVNFKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgQmxvYl0nLCB0eXBlcy5CTE9CKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgRmlsZV0nLCB0eXBlcy5GSUxFKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgRmlsZUxpc3RdJywgdHlwZXMuRklMRV9MSVNUKVxuICAuYWRkQ2xhc3MoJ1tvYmplY3QgWE1MSHR0cFJlcXVlc3RdJywgdHlwZXMuWEhSKVxuICAuYWRkKGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICgodHlwZW9mIFByb21pc2UgPT09IHR5cGVzLkZVTkNUSU9OICYmIG9iaiBpbnN0YW5jZW9mIFByb21pc2UpIHx8XG4gICAgICAgICh0eXBlb2Ygb2JqLnRoZW4gPT09IHR5cGVzLkZVTkNUSU9OKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgVHlwZSh0eXBlcy5PQkpFQ1QsIHR5cGVzLlBST01JU0UpO1xuICAgICAgICB9XG4gIH0pXG4gIC5hZGQoZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIEJ1ZmZlcikgey8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICAgIHJldHVybiBuZXcgVHlwZSh0eXBlcy5PQkpFQ1QsIHR5cGVzLkJVRkZFUik7XG4gICAgfVxuICB9KVxuICAuYWRkKGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICh0eXBlb2YgTm9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlKHR5cGVzLk9CSkVDVCwgdHlwZXMuSFRNTF9FTEVNRU5ULCBvYmoubm9kZU5hbWUpO1xuICAgIH1cbiAgfSlcbiAgLmFkZChmdW5jdGlvbihvYmopIHtcbiAgICAvLyBwcm9iYWJseSBhdCB0aGUgYmVnZ2luZ2luZyBzaG91bGQgYmUgZW5vdWdoIHRoZXNlIGNoZWNrc1xuICAgIGlmIChvYmouQm9vbGVhbiA9PT0gQm9vbGVhbiAmJiBvYmouTnVtYmVyID09PSBOdW1iZXIgJiYgb2JqLlN0cmluZyA9PT0gU3RyaW5nICYmIG9iai5EYXRlID09PSBEYXRlKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGUodHlwZXMuT0JKRUNULCB0eXBlcy5IT1NUKTtcbiAgICB9XG4gIH0pXG4gIC5hZGQoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHR5cGVzLk9CSkVDVCk7XG4gIH0pO1xuXG4vKipcbiAqIEdldCB0eXBlIGluZm9ybWF0aW9uIG9mIGFueXRoaW5nXG4gKlxuICogQHBhcmFtICB7YW55fSBvYmogQW55dGhpbmcgdGhhdCBjb3VsZCByZXF1aXJlIHR5cGUgaW5mb3JtYXRpb25cbiAqIEByZXR1cm4ge1R5cGV9ICAgIHR5cGUgaW5mb1xuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0R2xvYmFsVHlwZShvYmopIHtcbiAgcmV0dXJuIG1haW4uZ2V0VHlwZShvYmopO1xufVxuXG5nZXRHbG9iYWxUeXBlLmNoZWNrZXIgPSBtYWluO1xuZ2V0R2xvYmFsVHlwZS5UeXBlQ2hlY2tlciA9IFR5cGVDaGVja2VyO1xuZ2V0R2xvYmFsVHlwZS5UeXBlID0gVHlwZTtcblxuT2JqZWN0LmtleXModHlwZXMpLmZvckVhY2goZnVuY3Rpb24odHlwZU5hbWUpIHtcbiAgZ2V0R2xvYmFsVHlwZVt0eXBlTmFtZV0gPSB0eXBlc1t0eXBlTmFtZV07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRHbG9iYWxUeXBlOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgX3Byb3BlcnR5SXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBrZXkpIHtcbiAgcmV0dXJuIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbn1cblxuZnVuY3Rpb24gcHJvcGVydHlJc0VudW1lcmFibGUob2JqLCBrZXkpIHtcbiAgcmV0dXJuIF9wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iaiwga2V5KTtcbn1cblxuZnVuY3Rpb24gbWVyZ2UoYSwgYikge1xuICBpZiAoYSAmJiBiKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGIpIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGE7XG59XG5cbmZ1bmN0aW9uIGlzSXRlcmF0b3Iob2JqKSB7XG4gIGlmICghb2JqKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG9iai5fX3Nob3VsZEl0ZXJhdG9yX18pIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0eXBlb2Ygb2JqLm5leHQgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gJ3N5bWJvbCcgJiZcbiAgICB0eXBlb2Ygb2JqW1N5bWJvbC5pdGVyYXRvcl0gPT09ICdmdW5jdGlvbicgJiZcbiAgICBvYmpbU3ltYm9sLml0ZXJhdG9yXSgpID09PSBvYmo7XG59XG5cbi8vVE9ETyBmaW5kIGJldHRlciB3YXlcbmZ1bmN0aW9uIGlzR2VuZXJhdG9yRnVuY3Rpb24oZikge1xuICByZXR1cm4gdHlwZW9mIGYgPT09ICdmdW5jdGlvbicgJiYgL15mdW5jdGlvblxccypcXCpcXHMqLy50ZXN0KGYudG9TdHJpbmcoKSk7XG59XG5cbmV4cG9ydHMuaGFzT3duUHJvcGVydHkgPSBoYXNPd25Qcm9wZXJ0eTtcbmV4cG9ydHMucHJvcGVydHlJc0VudW1lcmFibGUgPSBwcm9wZXJ0eUlzRW51bWVyYWJsZTtcbmV4cG9ydHMubWVyZ2UgPSBtZXJnZTtcbmV4cG9ydHMuaXNJdGVyYXRvciA9IGlzSXRlcmF0b3I7XG5leHBvcnRzLmlzR2VuZXJhdG9yRnVuY3Rpb24gPSBpc0dlbmVyYXRvckZ1bmN0aW9uOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BEZWZhdWx0IChleCkgeyByZXR1cm4gKGV4ICYmICh0eXBlb2YgZXggPT09ICdvYmplY3QnKSAmJiAnZGVmYXVsdCcgaW4gZXgpID8gZXhbJ2RlZmF1bHQnXSA6IGV4OyB9XG5cbnZhciBnZXRUeXBlID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ3Nob3VsZC10eXBlJykpO1xudmFyIGVxbCA9IF9pbnRlcm9wRGVmYXVsdChyZXF1aXJlKCdzaG91bGQtZXF1YWwnKSk7XG52YXIgc2Zvcm1hdCQxID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ3Nob3VsZC1mb3JtYXQnKSk7XG52YXIgc2hvdWxkVHlwZUFkYXB0b3JzID0gcmVxdWlyZSgnc2hvdWxkLXR5cGUtYWRhcHRvcnMnKTtcbnZhciBzaG91bGRVdGlsID0gcmVxdWlyZSgnc2hvdWxkLXV0aWwnKTtcblxuLypcbiAqIHNob3VsZC5qcyAtIGFzc2VydGlvbiBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQoYykgMjAxMC0yMDEzIFRKIEhvbG93YXljaHVrIDx0akB2aXNpb24tbWVkaWEuY2E+XG4gKiBDb3B5cmlnaHQoYykgMjAxMy0yMDE3IERlbmlzIEJhcmRhZHltIDxiYXJkYWR5bWNoaWtAZ21haWwuY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cbmZ1bmN0aW9uIGlzV3JhcHBlclR5cGUob2JqKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiBOdW1iZXIgfHwgb2JqIGluc3RhbmNlb2YgU3RyaW5nIHx8IG9iaiBpbnN0YW5jZW9mIEJvb2xlYW47XG59XG5cbi8vIFhYWCBtYWtlIGl0IG1vcmUgc3RyaWN0OiBudW1iZXJzLCBzdHJpbmdzLCBzeW1ib2xzIC0gYW5kIG5vdGhpbmcgZWxzZVxuZnVuY3Rpb24gY29udmVydFByb3BlcnR5TmFtZShuYW1lKSB7XG4gIHJldHVybiB0eXBlb2YgbmFtZSA9PT0gXCJzeW1ib2xcIiA/IG5hbWUgOiBTdHJpbmcobmFtZSk7XG59XG5cbnZhciBmdW5jdGlvbk5hbWUgPSBzZm9ybWF0JDEuZnVuY3Rpb25OYW1lO1xuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuICBpZiAodHlwZW9mIG9iaiA9PSBcIm9iamVjdFwiICYmIG9iaiAhPT0gbnVsbCkge1xuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIHJldHVybiBwcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSB8fCBwcm90byA9PT0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLypcbiAqIHNob3VsZC5qcyAtIGFzc2VydGlvbiBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQoYykgMjAxMC0yMDEzIFRKIEhvbG93YXljaHVrIDx0akB2aXNpb24tbWVkaWEuY2E+XG4gKiBDb3B5cmlnaHQoYykgMjAxMy0yMDE3IERlbmlzIEJhcmRhZHltIDxiYXJkYWR5bWNoaWtAZ21haWwuY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxudmFyIGNvbmZpZyA9IHtcbiAgdHlwZUFkYXB0b3JzOiBzaG91bGRUeXBlQWRhcHRvcnMuZGVmYXVsdFR5cGVBZGFwdG9yU3RvcmFnZSxcblxuICBnZXRGb3JtYXR0ZXI6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICByZXR1cm4gbmV3IHNmb3JtYXQkMS5Gb3JtYXR0ZXIob3B0cyB8fCBjb25maWcpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBmb3JtYXQodmFsdWUsIG9wdHMpIHtcbiAgcmV0dXJuIGNvbmZpZy5nZXRGb3JtYXR0ZXIob3B0cykuZm9ybWF0KHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJvcCh2YWx1ZSkge1xuICB2YXIgZm9ybWF0dGVyID0gY29uZmlnLmdldEZvcm1hdHRlcigpO1xuICByZXR1cm4gc2Zvcm1hdCQxLmZvcm1hdFBsYWluT2JqZWN0S2V5LmNhbGwoZm9ybWF0dGVyLCB2YWx1ZSk7XG59XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG4vKipcbiAqIHNob3VsZCBBc3NlcnRpb25FcnJvclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICogQG1lbWJlck9mIHNob3VsZFxuICogQHN0YXRpY1xuICovXG5mdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHNob3VsZFV0aWwubWVyZ2UodGhpcywgb3B0aW9ucyk7XG5cbiAgaWYgKCFvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJtZXNzYWdlXCIsIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5fbWVzc2FnZSkge1xuICAgICAgICAgIHRoaXMuX21lc3NhZ2UgPSB0aGlzLmdlbmVyYXRlTWVzc2FnZSgpO1xuICAgICAgICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2U7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIGlmICh0aGlzLnN0YWNrU3RhcnRGdW5jdGlvbikge1xuICAgICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgICAgdmFyIGZuX25hbWUgPSBmdW5jdGlvbk5hbWUodGhpcy5zdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoXCJcXG5cIiArIGZuX25hbWUpO1xuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZihcIlxcblwiLCBpZHggKyAxKTtcbiAgICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59XG5cbnZhciBpbmRlbnQgPSBcIiAgICBcIjtcbmZ1bmN0aW9uIHByZXBlbmRJbmRlbnQobGluZSkge1xuICByZXR1cm4gaW5kZW50ICsgbGluZTtcbn1cblxuZnVuY3Rpb24gaW5kZW50TGluZXModGV4dCkge1xuICByZXR1cm4gdGV4dFxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAocHJlcGVuZEluZGVudClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbkFzc2VydGlvbkVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlLCB7XG4gIG5hbWU6IHtcbiAgICB2YWx1ZTogXCJBc3NlcnRpb25FcnJvclwiXG4gIH0sXG5cbiAgZ2VuZXJhdGVNZXNzYWdlOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLm9wZXJhdG9yICYmIHRoaXMucHJldmlvdXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJldmlvdXMubWVzc2FnZTtcbiAgICAgIH1cbiAgICAgIHZhciBhY3R1YWwgPSBmb3JtYXQodGhpcy5hY3R1YWwpO1xuICAgICAgdmFyIGV4cGVjdGVkID0gXCJleHBlY3RlZFwiIGluIHRoaXMgPyBcIiBcIiArIGZvcm1hdCh0aGlzLmV4cGVjdGVkKSA6IFwiXCI7XG4gICAgICB2YXIgZGV0YWlscyA9XG4gICAgICAgIFwiZGV0YWlsc1wiIGluIHRoaXMgJiYgdGhpcy5kZXRhaWxzID8gXCIgKFwiICsgdGhpcy5kZXRhaWxzICsgXCIpXCIgOiBcIlwiO1xuXG4gICAgICB2YXIgcHJldmlvdXMgPSB0aGlzLnByZXZpb3VzXG4gICAgICAgID8gXCJcXG5cIiArIGluZGVudExpbmVzKHRoaXMucHJldmlvdXMubWVzc2FnZSlcbiAgICAgICAgOiBcIlwiO1xuXG4gICAgICByZXR1cm4gKFxuICAgICAgICBcImV4cGVjdGVkIFwiICtcbiAgICAgICAgYWN0dWFsICtcbiAgICAgICAgKHRoaXMubmVnYXRlID8gXCIgbm90IFwiIDogXCIgXCIpICtcbiAgICAgICAgdGhpcy5vcGVyYXRvciArXG4gICAgICAgIGV4cGVjdGVkICtcbiAgICAgICAgZGV0YWlscyArXG4gICAgICAgIHByZXZpb3VzXG4gICAgICApO1xuICAgIH1cbiAgfVxufSk7XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8vIGEgYml0IGhhY2t5IHdheSBob3cgdG8gZ2V0IGVycm9yIHRvIGRvIG5vdCBoYXZlIHN0YWNrXG5mdW5jdGlvbiBMaWdodEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgc2hvdWxkVXRpbC5tZXJnZSh0aGlzLCBvcHRpb25zKTtcblxuICBpZiAoIW9wdGlvbnMubWVzc2FnZSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm1lc3NhZ2VcIiwge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tZXNzYWdlKSB7XG4gICAgICAgICAgdGhpcy5fbWVzc2FnZSA9IHRoaXMuZ2VuZXJhdGVNZXNzYWdlKCk7XG4gICAgICAgICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5MaWdodEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSA9IHtcbiAgZ2VuZXJhdGVNZXNzYWdlOiBBc3NlcnRpb25FcnJvci5wcm90b3R5cGUuZ2VuZXJhdGVNZXNzYWdlXG59O1xuXG4vKipcbiAqIHNob3VsZCBBc3NlcnRpb25cbiAqIEBwYXJhbSB7Kn0gb2JqIEdpdmVuIG9iamVjdCBmb3IgYXNzZXJ0aW9uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBtZW1iZXJPZiBzaG91bGRcbiAqIEBzdGF0aWNcbiAqL1xuZnVuY3Rpb24gQXNzZXJ0aW9uKG9iaikge1xuICB0aGlzLm9iaiA9IG9iajtcblxuICB0aGlzLmFueU9uZSA9IGZhbHNlO1xuICB0aGlzLm5lZ2F0ZSA9IGZhbHNlO1xuXG4gIHRoaXMucGFyYW1zID0geyBhY3R1YWw6IG9iaiB9O1xufVxuXG5Bc3NlcnRpb24ucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogQXNzZXJ0aW9uLFxuXG4gIC8qKlxuICAgKiBCYXNlIG1ldGhvZCBmb3IgYXNzZXJ0aW9ucy5cbiAgICpcbiAgICogQmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QgbmVlZCB0byBmaWxsIEFzc2VydGlvbiNwYXJhbXMgb2JqZWN0LiBUaGlzIG1ldGhvZCB1c3VhbGx5IGNhbGxlZCBmcm9tIG90aGVyIGFzc2VydGlvbiBtZXRob2RzLlxuICAgKiBgQXNzZXJ0aW9uI3BhcmFtc2AgY2FuIGNvbnRhaW4gc3VjaCBwcm9wZXJ0aWVzOlxuICAgKiAqIGBvcGVyYXRvcmAgLSByZXF1aXJlZCBzdHJpbmcgY29udGFpbmluZyBkZXNjcmlwdGlvbiBvZiB0aGlzIGFzc2VydGlvblxuICAgKiAqIGBvYmpgIC0gb3B0aW9uYWwgcmVwbGFjZW1lbnQgZm9yIHRoaXMub2JqLCBpdCB1c2VmdWxsIGlmIHlvdSBwcmVwYXJlIG1vcmUgY2xlYXIgb2JqZWN0IHRoZW4gZ2l2ZW5cbiAgICogKiBgbWVzc2FnZWAgLSBpZiB0aGlzIHByb3BlcnR5IGZpbGxlZCB3aXRoIHN0cmluZyBhbnkgb3RoZXJzIHdpbGwgYmUgaWdub3JlZCBhbmQgdGhpcyBvbmUgdXNlZCBhcyBhc3NlcnRpb24gbWVzc2FnZVxuICAgKiAqIGBleHBlY3RlZGAgLSBhbnkgb2JqZWN0IHVzZWQgd2hlbiB5b3UgbmVlZCB0byBhc3NlcnQgcmVsYXRpb24gYmV0d2VlbiBnaXZlbiBvYmplY3QgYW5kIGV4cGVjdGVkLiBMaWtlIGdpdmVuID09IGV4cGVjdGVkICg9PSBpcyBhIHJlbGF0aW9uKVxuICAgKiAqIGBkZXRhaWxzYCAtIGFkZGl0aW9uYWwgc3RyaW5nIHdpdGggZGV0YWlscyB0byBnZW5lcmF0ZWQgbWVzc2FnZVxuICAgKlxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb25cbiAgICogQHBhcmFtIHsqfSBleHByIEFueSBleHByZXNzaW9uIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29uZGl0aW9uIGZvciBhc3NlcnRpbmcuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBhID0gbmV3IHNob3VsZC5Bc3NlcnRpb24oNDIpO1xuICAgKlxuICAgKiBhLnBhcmFtcyA9IHtcbiAgICogIG9wZXJhdG9yOiAndG8gYmUgbWFnaWMgbnVtYmVyJyxcbiAgICogfVxuICAgKlxuICAgKiBhLmFzc2VydChmYWxzZSk7XG4gICAqIC8vdGhyb3dzIEFzc2VydGlvbkVycm9yOiBleHBlY3RlZCA0MiB0byBiZSBtYWdpYyBudW1iZXJcbiAgICovXG4gIGFzc2VydDogZnVuY3Rpb24oZXhwcikge1xuICAgIGlmIChleHByKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgcGFyYW1zID0gdGhpcy5wYXJhbXM7XG5cbiAgICBpZiAoXCJvYmpcIiBpbiBwYXJhbXMgJiYgIShcImFjdHVhbFwiIGluIHBhcmFtcykpIHtcbiAgICAgIHBhcmFtcy5hY3R1YWwgPSBwYXJhbXMub2JqO1xuICAgIH0gZWxzZSBpZiAoIShcIm9ialwiIGluIHBhcmFtcykgJiYgIShcImFjdHVhbFwiIGluIHBhcmFtcykpIHtcbiAgICAgIHBhcmFtcy5hY3R1YWwgPSB0aGlzLm9iajtcbiAgICB9XG5cbiAgICBwYXJhbXMuc3RhY2tTdGFydEZ1bmN0aW9uID0gcGFyYW1zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCB0aGlzLmFzc2VydDtcbiAgICBwYXJhbXMubmVnYXRlID0gdGhpcy5uZWdhdGU7XG5cbiAgICBwYXJhbXMuYXNzZXJ0aW9uID0gdGhpcztcblxuICAgIGlmICh0aGlzLmxpZ2h0KSB7XG4gICAgICB0aHJvdyBuZXcgTGlnaHRBc3NlcnRpb25FcnJvcihwYXJhbXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IocGFyYW1zKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNob3J0Y3V0IGZvciBgQXNzZXJ0aW9uI2Fzc2VydChmYWxzZSlgLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb25cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIGEgPSBuZXcgc2hvdWxkLkFzc2VydGlvbig0Mik7XG4gICAqXG4gICAqIGEucGFyYW1zID0ge1xuICAgKiAgb3BlcmF0b3I6ICd0byBiZSBtYWdpYyBudW1iZXInLFxuICAgKiB9XG4gICAqXG4gICAqIGEuZmFpbCgpO1xuICAgKiAvL3Rocm93cyBBc3NlcnRpb25FcnJvcjogZXhwZWN0ZWQgNDIgdG8gYmUgbWFnaWMgbnVtYmVyXG4gICAqL1xuICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5hc3NlcnQoZmFsc2UpO1xuICB9LFxuXG4gIGFzc2VydFplcm9Bcmd1bWVudHM6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGlzIGFzc2VydGlvbiBkb2VzIG5vdCBleHBlY3QgYW55IGFyZ3VtZW50cy4gWW91IG1heSBuZWVkIHRvIGNoZWNrIHlvdXIgY29kZVwiKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQXNzZXJ0aW9uIHVzZWQgdG8gZGVsZWdhdGUgY2FsbHMgb2YgQXNzZXJ0aW9uIG1ldGhvZHMgaW5zaWRlIG9mIFByb21pc2UuXG4gKiBJdCBoYXMgYWxtb3N0IGFsbCBtZXRob2RzIG9mIEFzc2VydGlvbi5wcm90b3R5cGVcbiAqXG4gKiBAcGFyYW0ge1Byb21pc2V9IG9ialxuICovXG5mdW5jdGlvbiBQcm9taXNlZEFzc2VydGlvbigvKiBvYmogKi8pIHtcbiAgQXNzZXJ0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogTWFrZSBQcm9taXNlZEFzc2VydGlvbiB0byBsb29rIGxpa2UgcHJvbWlzZS4gRGVsZWdhdGUgcmVzb2x2ZSBhbmQgcmVqZWN0IHRvIGdpdmVuIHByb21pc2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5Qcm9taXNlZEFzc2VydGlvbi5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICByZXR1cm4gdGhpcy5vYmoudGhlbihyZXNvbHZlLCByZWplY3QpO1xufTtcblxuLyoqXG4gKiBXYXkgdG8gZXh0ZW5kIEFzc2VydGlvbiBmdW5jdGlvbi4gSXQgdXNlcyBzb21lIGxvZ2ljXG4gKiB0byBkZWZpbmUgb25seSBwb3NpdGl2ZSBhc3NlcnRpb25zIGFuZCBpdHNlbGYgcnVsZSB3aXRoIG5lZ2F0aXZlIGFzc2VydGlvbi5cbiAqXG4gKiBBbGwgYWN0aW9ucyBoYXBwZW4gaW4gc3ViY29udGV4dCBhbmQgdGhpcyBtZXRob2QgdGFrZSBjYXJlIGFib3V0IG5lZ2F0aW9uLlxuICogUG90ZW50aWFsbHkgd2UgY2FuIGFkZCBzb21lIG1vcmUgbW9kaWZpZXJzIHRoYXQgZG9lcyBub3QgZGVwZW5kcyBmcm9tIHN0YXRlIG9mIGFzc2VydGlvbi5cbiAqXG4gKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIGFzc2VydGlvbi4gSXQgd2lsbCBiZSB1c2VkIGZvciBkZWZpbmluZyBtZXRob2Qgb3IgZ2V0dGVyIG9uIEFzc2VydGlvbi5wcm90b3R5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBvbiBleGVjdXRpbmcgYXNzZXJ0aW9uXG4gKiBAZXhhbXBsZVxuICpcbiAqIEFzc2VydGlvbi5hZGQoJ2Fzc2V0JywgZnVuY3Rpb24oKSB7XG4gKiAgICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogJ3RvIGJlIGFzc2V0JyB9XG4gKlxuICogICAgICB0aGlzLm9iai5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnaWQnKS53aGljaC5pcy5hLk51bWJlcigpXG4gKiAgICAgIHRoaXMub2JqLnNob3VsZC5oYXZlLnByb3BlcnR5KCdwYXRoJylcbiAqIH0pXG4gKi9cbkFzc2VydGlvbi5hZGQgPSBmdW5jdGlvbihuYW1lLCBmdW5jKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3NlcnRpb24ucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQXNzZXJ0aW9uKHRoaXMub2JqLCB0aGlzLCBuYW1lKTtcbiAgICAgIGNvbnRleHQuYW55T25lID0gdGhpcy5hbnlPbmU7XG4gICAgICBjb250ZXh0Lm9ubHlUaGlzID0gdGhpcy5vbmx5VGhpcztcbiAgICAgIC8vIGhhY2tcbiAgICAgIGNvbnRleHQubGlnaHQgPSB0cnVlO1xuXG4gICAgICB0cnkge1xuICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGNoZWNrIGZvciBmYWlsXG4gICAgICAgIGlmIChlIGluc3RhbmNlb2YgQXNzZXJ0aW9uRXJyb3IgfHwgZSBpbnN0YW5jZW9mIExpZ2h0QXNzZXJ0aW9uRXJyb3IpIHtcbiAgICAgICAgICAvLyBuZWdhdGl2ZSBmYWlsXG4gICAgICAgICAgaWYgKHRoaXMubmVnYXRlKSB7XG4gICAgICAgICAgICB0aGlzLm9iaiA9IGNvbnRleHQub2JqO1xuICAgICAgICAgICAgdGhpcy5uZWdhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjb250ZXh0ICE9PSBlLmFzc2VydGlvbikge1xuICAgICAgICAgICAgY29udGV4dC5wYXJhbXMucHJldmlvdXMgPSBlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHBvc2l0aXZlIGZhaWxcbiAgICAgICAgICBjb250ZXh0Lm5lZ2F0ZSA9IGZhbHNlO1xuICAgICAgICAgIC8vIGhhY2tcbiAgICAgICAgICBjb250ZXh0LmxpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgY29udGV4dC5mYWlsKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhyb3cgaWYgaXQgaXMgYW5vdGhlciBleGNlcHRpb25cbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgLy8gbmVnYXRpdmUgcGFzc1xuICAgICAgaWYgKHRoaXMubmVnYXRlKSB7XG4gICAgICAgIGNvbnRleHQubmVnYXRlID0gdHJ1ZTsgLy8gYmVjYXVzZSAuZmFpbCB3aWxsIHNldCBuZWdhdGVcbiAgICAgICAgY29udGV4dC5wYXJhbXMuZGV0YWlscyA9IFwiZmFsc2UgbmVnYXRpdmUgZmFpbFwiO1xuICAgICAgICAvLyBoYWNrXG4gICAgICAgIGNvbnRleHQubGlnaHQgPSBmYWxzZTtcbiAgICAgICAgY29udGV4dC5mYWlsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHBvc2l0aXZlIHBhc3NcbiAgICAgIGlmICghdGhpcy5wYXJhbXMub3BlcmF0b3IpIHtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBjb250ZXh0LnBhcmFtczsgLy8gc2hvcnRjdXRcbiAgICAgIH1cbiAgICAgIHRoaXMub2JqID0gY29udGV4dC5vYmo7XG4gICAgICB0aGlzLm5lZ2F0ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJvbWlzZWRBc3NlcnRpb24ucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aGlzLm9iaiA9IHRoaXMub2JqLnRoZW4oZnVuY3Rpb24oYSkge1xuICAgICAgICByZXR1cm4gYVtuYW1lXS5hcHBseShhLCBhcmdzKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBBZGQgY2hhaW5pbmcgZ2V0dGVyIHRvIEFzc2VydGlvbiBsaWtlIC5hLCAud2hpY2ggZXRjXG4gKlxuICogQG1lbWJlck9mIEFzc2VydGlvblxuICogQHN0YXRpY1xuICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgbmFtZSBvZiBnZXR0ZXJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBbb25DYWxsXSBvcHRpb25hbCBmdW5jdGlvbiB0byBjYWxsXG4gKi9cbkFzc2VydGlvbi5hZGRDaGFpbiA9IGZ1bmN0aW9uKG5hbWUsIG9uQ2FsbCkge1xuICBvbkNhbGwgPSBvbkNhbGwgfHwgZnVuY3Rpb24oKSB7fTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbi5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgb25DYWxsLmNhbGwodGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb21pc2VkQXNzZXJ0aW9uLnByb3RvdHlwZSwgbmFtZSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm9iaiA9IHRoaXMub2JqLnRoZW4oZnVuY3Rpb24oYSkge1xuICAgICAgICByZXR1cm4gYVtuYW1lXTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYWxpYXMgZm9yIHNvbWUgYEFzc2VydGlvbmAgcHJvcGVydHlcbiAqXG4gKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJvbSBOYW1lIG9mIHRvIG1hcFxuICogQHBhcmFtIHtTdHJpbmd9IHRvIE5hbWUgb2YgYWxpYXNcbiAqIEBleGFtcGxlXG4gKlxuICogQXNzZXJ0aW9uLmFsaWFzKCd0cnVlJywgJ1RydWUnKVxuICovXG5Bc3NlcnRpb24uYWxpYXMgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoQXNzZXJ0aW9uLnByb3RvdHlwZSwgZnJvbSk7XG4gIGlmICghZGVzYykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkFsaWFzIFwiICsgZnJvbSArIFwiIC0+IFwiICsgdG8gKyBcIiBjb3VsZCBub3QgYmUgY3JlYXRlZCBhcyBcIiArIGZyb20gKyBcIiBub3QgZGVmaW5lZFwiKTtcbiAgfVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uLnByb3RvdHlwZSwgdG8sIGRlc2MpO1xuXG4gIHZhciBkZXNjMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoUHJvbWlzZWRBc3NlcnRpb24ucHJvdG90eXBlLCBmcm9tKTtcbiAgaWYgKGRlc2MyKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb21pc2VkQXNzZXJ0aW9uLnByb3RvdHlwZSwgdG8sIGRlc2MyKTtcbiAgfVxufTtcbi8qKlxuICogTmVnYXRpb24gbW9kaWZpZXIuIEN1cnJlbnQgYXNzZXJ0aW9uIGNoYWluIGJlY29tZSBuZWdhdGVkLiBFYWNoIGNhbGwgaW52ZXJ0IG5lZ2F0aW9uIG9uIGN1cnJlbnQgYXNzZXJ0aW9uLlxuICpcbiAqIEBuYW1lIG5vdFxuICogQHByb3BlcnR5XG4gKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uXG4gKi9cbkFzc2VydGlvbi5hZGRDaGFpbihcIm5vdFwiLCBmdW5jdGlvbigpIHtcbiAgdGhpcy5uZWdhdGUgPSAhdGhpcy5uZWdhdGU7XG59KTtcblxuLyoqXG4gKiBBbnkgbW9kaWZpZXIgLSBpdCBhZmZlY3Qgb24gZXhlY3V0aW9uIG9mIHNlcXVlbmNlZCBhc3NlcnRpb24gdG8gZG8gbm90IGBjaGVjayBhbGxgLCBidXQgYGNoZWNrIGFueSBvZmAuXG4gKlxuICogQG5hbWUgYW55XG4gKiBAcHJvcGVydHlcbiAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAqIEBjYXRlZ29yeSBhc3NlcnRpb25cbiAqL1xuQXNzZXJ0aW9uLmFkZENoYWluKFwiYW55XCIsIGZ1bmN0aW9uKCkge1xuICB0aGlzLmFueU9uZSA9IHRydWU7XG59KTtcblxuLyoqXG4gKiBPbmx5IG1vZGlmaWVyIC0gY3VycmVudGx5IHVzZWQgd2l0aCAua2V5cyB0byBjaGVjayBpZiBvYmplY3QgY29udGFpbnMgb25seSBleGFjdGx5IHRoaXMgLmtleXNcbiAqXG4gKiBAbmFtZSBvbmx5XG4gKiBAcHJvcGVydHlcbiAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAqIEBjYXRlZ29yeSBhc3NlcnRpb25cbiAqL1xuQXNzZXJ0aW9uLmFkZENoYWluKFwib25seVwiLCBmdW5jdGlvbigpIHtcbiAgdGhpcy5vbmx5VGhpcyA9IHRydWU7XG59KTtcblxuLy8gaW1wbGVtZW50IGFzc2VydCBpbnRlcmZhY2UgdXNpbmcgYWxyZWFkeSB3cml0dGVuIHBlYWNlcyBvZiBzaG91bGQuanNcblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBvaztcbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQuZmFpbGBdKGh0dHA6Ly9ub2RlanMub3JnL2FwaS9hc3NlcnQuaHRtbCNhc3NlcnRfYXNzZXJ0X2ZhaWxfYWN0dWFsX2V4cGVjdGVkX21lc3NhZ2Vfb3BlcmF0b3IpLlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIHNob3VsZFxuICogQGNhdGVnb3J5IGFzc2VydGlvbiBhc3NlcnRcbiAqIEBwYXJhbSB7Kn0gYWN0dWFsIEFjdHVhbCBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZXhwZWN0ZWQgRXhwZWN0ZWQgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBNZXNzYWdlIGZvciBhc3NlcnRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBvcGVyYXRvciBPcGVyYXRvciB0ZXh0XG4gKi9cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB2YXIgYSA9IG5ldyBBc3NlcnRpb24oYWN0dWFsKTtcbiAgYS5wYXJhbXMgPSB7XG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWxcbiAgfTtcblxuICBhLmZhaWwoKTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQub2tgXShodHRwOi8vbm9kZWpzLm9yZy9hcGkvYXNzZXJ0Lmh0bWwjYXNzZXJ0X2Fzc2VydF92YWx1ZV9tZXNzYWdlX2Fzc2VydF9va192YWx1ZV9tZXNzYWdlKS5cbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBzaG91bGRcbiAqIEBjYXRlZ29yeSBhc3NlcnRpb24gYXNzZXJ0XG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdXG4gKi9cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCBcIj09XCIsIGFzc2VydC5vayk7XG4gIH1cbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuLyoqXG4gKiBOb2RlLmpzIHN0YW5kYXJkIFtgYXNzZXJ0LmVxdWFsYF0oaHR0cDovL25vZGVqcy5vcmcvYXBpL2Fzc2VydC5odG1sI2Fzc2VydF9hc3NlcnRfZXF1YWxfYWN0dWFsX2V4cGVjdGVkX21lc3NhZ2UpLlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIHNob3VsZFxuICogQGNhdGVnb3J5IGFzc2VydGlvbiBhc3NlcnRcbiAqIEBwYXJhbSB7Kn0gYWN0dWFsXG4gKiBAcGFyYW0geyp9IGV4cGVjdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdXG4gKi9cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgXCI9PVwiLCBhc3NlcnQuZXF1YWwpO1xuICB9XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQubm90RXF1YWxgXShodHRwOi8vbm9kZWpzLm9yZy9hcGkvYXNzZXJ0Lmh0bWwjYXNzZXJ0X2Fzc2VydF9ub3RlcXVhbF9hY3R1YWxfZXhwZWN0ZWRfbWVzc2FnZSkuXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGFzc2VydFxuICogQHBhcmFtIHsqfSBhY3R1YWxcbiAqIEBwYXJhbSB7Kn0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV1cbiAqL1xuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBcIiE9XCIsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQuZGVlcEVxdWFsYF0oaHR0cDovL25vZGVqcy5vcmcvYXBpL2Fzc2VydC5odG1sI2Fzc2VydF9hc3NlcnRfZGVlcGVxdWFsX2FjdHVhbF9leHBlY3RlZF9tZXNzYWdlKS5cbiAqIEJ1dCB1c2VzIHNob3VsZC5qcyAuZXFsIGltcGxlbWVudGF0aW9uIGluc3RlYWQgb2YgTm9kZS5qcyBvd24gZGVlcEVxdWFsLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBzaG91bGRcbiAqIEBjYXRlZ29yeSBhc3NlcnRpb24gYXNzZXJ0XG4gKiBAcGFyYW0geyp9IGFjdHVhbFxuICogQHBhcmFtIHsqfSBleHBlY3RlZFxuICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXVxuICovXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGVxbChhY3R1YWwsIGV4cGVjdGVkKS5sZW5ndGggIT09IDApIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIFwiZGVlcEVxdWFsXCIsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuLyoqXG4gKiBOb2RlLmpzIHN0YW5kYXJkIFtgYXNzZXJ0Lm5vdERlZXBFcXVhbGBdKGh0dHA6Ly9ub2RlanMub3JnL2FwaS9hc3NlcnQuaHRtbCNhc3NlcnRfYXNzZXJ0X25vdGRlZXBlcXVhbF9hY3R1YWxfZXhwZWN0ZWRfbWVzc2FnZSkuXG4gKiBCdXQgdXNlcyBzaG91bGQuanMgLmVxbCBpbXBsZW1lbnRhdGlvbiBpbnN0ZWFkIG9mIE5vZGUuanMgb3duIGRlZXBFcXVhbC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGFzc2VydFxuICogQHBhcmFtIHsqfSBhY3R1YWxcbiAqIEBwYXJhbSB7Kn0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV1cbiAqL1xuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChlcWwoYWN0dWFsLCBleHBlY3RlZCkucmVzdWx0KSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBcIm5vdERlZXBFcXVhbFwiLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQuc3RyaWN0RXF1YWxgXShodHRwOi8vbm9kZWpzLm9yZy9hcGkvYXNzZXJ0Lmh0bWwjYXNzZXJ0X2Fzc2VydF9zdHJpY3RlcXVhbF9hY3R1YWxfZXhwZWN0ZWRfbWVzc2FnZSkuXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGFzc2VydFxuICogQHBhcmFtIHsqfSBhY3R1YWxcbiAqIEBwYXJhbSB7Kn0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV1cbiAqL1xuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgXCI9PT1cIiwgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQubm90U3RyaWN0RXF1YWxgXShodHRwOi8vbm9kZWpzLm9yZy9hcGkvYXNzZXJ0Lmh0bWwjYXNzZXJ0X2Fzc2VydF9ub3RzdHJpY3RlcXVhbF9hY3R1YWxfZXhwZWN0ZWRfbWVzc2FnZSkuXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGFzc2VydFxuICogQHBhcmFtIHsqfSBhY3R1YWxcbiAqIEBwYXJhbSB7Kn0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV1cbiAqL1xuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgXCIhPT1cIiwgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSBcIltvYmplY3QgUmVnRXhwXVwiKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PSBcInN0cmluZ1wiKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID1cbiAgICAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/IFwiIChcIiArIGV4cGVjdGVkLm5hbWUgKyBcIilcIiA6IFwiLlwiKSArXG4gICAgKG1lc3NhZ2UgPyBcIiBcIiArIG1lc3NhZ2UgOiBcIi5cIik7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIFwiTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb25cIiArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgXCJHb3QgdW53YW50ZWQgZXhjZXB0aW9uXCIgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmIChcbiAgICAoc2hvdWxkVGhyb3cgJiZcbiAgICAgIGFjdHVhbCAmJlxuICAgICAgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAoIXNob3VsZFRocm93ICYmIGFjdHVhbClcbiAgKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuLyoqXG4gKiBOb2RlLmpzIHN0YW5kYXJkIFtgYXNzZXJ0LnRocm93c2BdKGh0dHA6Ly9ub2RlanMub3JnL2FwaS9hc3NlcnQuaHRtbCNhc3NlcnRfYXNzZXJ0X3Rocm93c19ibG9ja19lcnJvcl9tZXNzYWdlKS5cbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBzaG91bGRcbiAqIEBjYXRlZ29yeSBhc3NlcnRpb24gYXNzZXJ0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBibG9ja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gW2Vycm9yXVxuICogQHBhcmFtIHtTdHJpbmd9IFttZXNzYWdlXVxuICovXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oLypibG9jaywgZXJyb3IsIG1lc3NhZ2UqLykge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQuZG9lc05vdFRocm93YF0oaHR0cDovL25vZGVqcy5vcmcvYXBpL2Fzc2VydC5odG1sI2Fzc2VydF9hc3NlcnRfZG9lc25vdHRocm93X2Jsb2NrX21lc3NhZ2UpLlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIHNob3VsZFxuICogQGNhdGVnb3J5IGFzc2VydGlvbiBhc3NlcnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGJsb2NrXG4gKiBAcGFyYW0ge1N0cmluZ30gW21lc3NhZ2VdXG4gKi9cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbigvKmJsb2NrLCBtZXNzYWdlKi8pIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vKipcbiAqIE5vZGUuanMgc3RhbmRhcmQgW2Bhc3NlcnQuaWZFcnJvcmBdKGh0dHA6Ly9ub2RlanMub3JnL2FwaS9hc3NlcnQuaHRtbCNhc3NlcnRfYXNzZXJ0X2lmZXJyb3JfdmFsdWUpLlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIHNob3VsZFxuICogQGNhdGVnb3J5IGFzc2VydGlvbiBhc3NlcnRcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICovXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICBpZiAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vKlxuICogc2hvdWxkLmpzIC0gYXNzZXJ0aW9uIGxpYnJhcnlcbiAqIENvcHlyaWdodChjKSAyMDEwLTIwMTMgVEogSG9sb3dheWNodWsgPHRqQHZpc2lvbi1tZWRpYS5jYT5cbiAqIENvcHlyaWdodChjKSAyMDEzLTIwMTcgRGVuaXMgQmFyZGFkeW0gPGJhcmRhZHltY2hpa0BnbWFpbC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG52YXIgYXNzZXJ0RXh0ZW5zaW9ucyA9IGZ1bmN0aW9uKHNob3VsZCkge1xuICB2YXIgaSA9IHNob3VsZC5mb3JtYXQ7XG5cbiAgLypcbiAgICogRXhwb3NlIGFzc2VydCB0byBzaG91bGRcbiAgICpcbiAgICogVGhpcyBhbGxvd3MgeW91IHRvIGRvIHRoaW5ncyBsaWtlIGJlbG93XG4gICAqIHdpdGhvdXQgcmVxdWlyZSgpaW5nIHRoZSBhc3NlcnQgbW9kdWxlLlxuICAgKlxuICAgKiAgICBzaG91bGQuZXF1YWwoZm9vLmJhciwgdW5kZWZpbmVkKTtcbiAgICpcbiAgICovXG4gIHNob3VsZFV0aWwubWVyZ2Uoc2hvdWxkLCBhc3NlcnQpO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgX29ial8gZXhpc3RzLCB3aXRoIG9wdGlvbmFsIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIHNob3VsZFxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGFzc2VydFxuICAgKiBAYWxpYXMgc2hvdWxkLmV4aXN0c1xuICAgKiBAcGFyYW0geyp9IG9ialxuICAgKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogc2hvdWxkLmV4aXN0KDEpO1xuICAgKiBzaG91bGQuZXhpc3QobmV3IERhdGUoKSk7XG4gICAqL1xuICBzaG91bGQuZXhpc3QgPSBzaG91bGQuZXhpc3RzID0gZnVuY3Rpb24ob2JqLCBtc2cpIHtcbiAgICBpZiAobnVsbCA9PSBvYmopIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcih7XG4gICAgICAgIG1lc3NhZ2U6IG1zZyB8fCBcImV4cGVjdGVkIFwiICsgaShvYmopICsgXCIgdG8gZXhpc3RcIixcbiAgICAgICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzaG91bGQuZXhpc3RcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBzaG91bGQubm90ID0ge307XG4gIC8qKlxuICAgKiBBc3NlcnRzIF9vYmpfIGRvZXMgbm90IGV4aXN0LCB3aXRoIG9wdGlvbmFsIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBuYW1lIG5vdC5leGlzdFxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBzaG91bGRcbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBhc3NlcnRcbiAgICogQGFsaWFzIHNob3VsZC5ub3QuZXhpc3RzXG4gICAqIEBwYXJhbSB7Kn0gb2JqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBzaG91bGQubm90LmV4aXN0KG51bGwpO1xuICAgKiBzaG91bGQubm90LmV4aXN0KHZvaWQgMCk7XG4gICAqL1xuICBzaG91bGQubm90LmV4aXN0ID0gc2hvdWxkLm5vdC5leGlzdHMgPSBmdW5jdGlvbihvYmosIG1zZykge1xuICAgIGlmIChudWxsICE9IG9iaikge1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKHtcbiAgICAgICAgbWVzc2FnZTogbXNnIHx8IFwiZXhwZWN0ZWQgXCIgKyBpKG9iaikgKyBcIiB0byBub3QgZXhpc3RcIixcbiAgICAgICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzaG91bGQubm90LmV4aXN0XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59O1xuXG4vKlxuICogc2hvdWxkLmpzIC0gYXNzZXJ0aW9uIGxpYnJhcnlcbiAqIENvcHlyaWdodChjKSAyMDEwLTIwMTMgVEogSG9sb3dheWNodWsgPHRqQHZpc2lvbi1tZWRpYS5jYT5cbiAqIENvcHlyaWdodChjKSAyMDEzLTIwMTcgRGVuaXMgQmFyZGFkeW0gPGJhcmRhZHltY2hpa0BnbWFpbC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG52YXIgY2hhaW5Bc3NlcnRpb25zID0gZnVuY3Rpb24oc2hvdWxkLCBBc3NlcnRpb24pIHtcbiAgLyoqXG4gICAqIFNpbXBsZSBjaGFpbmluZyB0byBpbXByb3ZlIHJlYWRhYmlsaXR5LiBEb2VzIG5vdGhpbmcuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQG5hbWUgYmVcbiAgICogQHByb3BlcnR5IHtzaG91bGQuQXNzZXJ0aW9ufSBiZVxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2FuXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jb2ZcbiAgICogQGFsaWFzIEFzc2VydGlvbiNhXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jYW5kXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jYmVlblxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2hhdmVcbiAgICogQGFsaWFzIEFzc2VydGlvbiNoYXNcbiAgICogQGFsaWFzIEFzc2VydGlvbiN3aXRoXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jaXNcbiAgICogQGFsaWFzIEFzc2VydGlvbiN3aGljaFxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI3RoZVxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2l0XG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gY2hhaW5pbmdcbiAgICovXG4gIFtcbiAgICBcImFuXCIsXG4gICAgXCJvZlwiLFxuICAgIFwiYVwiLFxuICAgIFwiYW5kXCIsXG4gICAgXCJiZVwiLFxuICAgIFwiYmVlblwiLFxuICAgIFwiaGFzXCIsXG4gICAgXCJoYXZlXCIsXG4gICAgXCJ3aXRoXCIsXG4gICAgXCJpc1wiLFxuICAgIFwid2hpY2hcIixcbiAgICBcInRoZVwiLFxuICAgIFwiaXRcIlxuICBdLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgIEFzc2VydGlvbi5hZGRDaGFpbihuYW1lKTtcbiAgfSk7XG59O1xuXG4vKlxuICogc2hvdWxkLmpzIC0gYXNzZXJ0aW9uIGxpYnJhcnlcbiAqIENvcHlyaWdodChjKSAyMDEwLTIwMTMgVEogSG9sb3dheWNodWsgPHRqQHZpc2lvbi1tZWRpYS5jYT5cbiAqIENvcHlyaWdodChjKSAyMDEzLTIwMTcgRGVuaXMgQmFyZGFkeW0gPGJhcmRhZHltY2hpa0BnbWFpbC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG52YXIgYm9vbGVhbkFzc2VydGlvbnMgPSBmdW5jdGlvbihzaG91bGQsIEFzc2VydGlvbikge1xuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG9iamVjdCBpcyBleGFjdGx5IGB0cnVlYC5cbiAgICpcbiAgICogQG5hbWUgdHJ1ZVxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gYm9vbFxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI1RydWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICh0cnVlKS5zaG91bGQuYmUudHJ1ZSgpO1xuICAgKiBmYWxzZS5zaG91bGQubm90LmJlLnRydWUoKTtcbiAgICpcbiAgICogKHsgYTogMTB9KS5zaG91bGQubm90LmJlLnRydWUoKTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJ0cnVlXCIsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB0aGlzLmlzLmV4YWN0bHkodHJ1ZSwgbWVzc2FnZSk7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcInRydWVcIiwgXCJUcnVlXCIpO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IGlzIGV4YWN0bHkgYGZhbHNlYC5cbiAgICpcbiAgICogQG5hbWUgZmFsc2VcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGJvb2xcbiAgICogQGFsaWFzIEFzc2VydGlvbiNGYWxzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIE9wdGlvbmFsIG1lc3NhZ2VcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogKHRydWUpLnNob3VsZC5ub3QuYmUuZmFsc2UoKTtcbiAgICogZmFsc2Uuc2hvdWxkLmJlLmZhbHNlKCk7XG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiZmFsc2VcIiwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHRoaXMuaXMuZXhhY3RseShmYWxzZSwgbWVzc2FnZSk7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcImZhbHNlXCIsIFwiRmFsc2VcIik7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgdHJ1dGh5IGFjY29yZGluZyBqYXZhc2NyaXB0IHR5cGUgY29udmVyc2lvbnMuXG4gICAqXG4gICAqIEBuYW1lIG9rXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBib29sXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICh0cnVlKS5zaG91bGQuYmUub2soKTtcbiAgICogJycuc2hvdWxkLm5vdC5iZS5vaygpO1xuICAgKiBzaG91bGQobnVsbCkubm90LmJlLm9rKCk7XG4gICAqIHNob3VsZCh2b2lkIDApLm5vdC5iZS5vaygpO1xuICAgKlxuICAgKiAoMTApLnNob3VsZC5iZS5vaygpO1xuICAgKiAoMCkuc2hvdWxkLm5vdC5iZS5vaygpO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIm9rXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSB0cnV0aHlcIiB9O1xuXG4gICAgdGhpcy5hc3NlcnQodGhpcy5vYmopO1xuICB9KTtcbn07XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciBudW1iZXJBc3NlcnRpb25zID0gZnVuY3Rpb24oc2hvdWxkLCBBc3NlcnRpb24pIHtcbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgTmFOXG4gICAqIEBuYW1lIE5hTlxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gbnVtYmVyc1xuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiAoMTApLnNob3VsZC5ub3QuYmUuTmFOKCk7XG4gICAqIE5hTi5zaG91bGQuYmUuTmFOKCk7XG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiTmFOXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBOYU5cIiB9O1xuXG4gICAgdGhpcy5hc3NlcnQodGhpcy5vYmogIT09IHRoaXMub2JqKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgbm90IGZpbml0ZSAocG9zaXRpdmUgb3IgbmVnYXRpdmUpXG4gICAqXG4gICAqIEBuYW1lIEluZmluaXR5XG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBudW1iZXJzXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICgxMCkuc2hvdWxkLm5vdC5iZS5JbmZpbml0eSgpO1xuICAgKiBOYU4uc2hvdWxkLm5vdC5iZS5JbmZpbml0eSgpO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIkluZmluaXR5XCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBJbmZpbml0eVwiIH07XG5cbiAgICB0aGlzLmlzLmFcbiAgICAgIC5OdW1iZXIoKVxuICAgICAgLmFuZC5ub3QuYS5OYU4oKVxuICAgICAgLmFuZC5hc3NlcnQoIWlzRmluaXRlKHRoaXMub2JqKSk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gbnVtYmVyIGJldHdlZW4gYHN0YXJ0YCBhbmQgYGZpbmlzaGAgb3IgZXF1YWwgb25lIG9mIHRoZW0uXG4gICAqXG4gICAqIEBuYW1lIHdpdGhpblxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gbnVtYmVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgbnVtYmVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBmaW5pc2ggRmluaXNoIG51bWJlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICgxMCkuc2hvdWxkLmJlLndpdGhpbigwLCAyMCk7XG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwid2l0aGluXCIsIGZ1bmN0aW9uKHN0YXJ0LCBmaW5pc2gsIGRlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5wYXJhbXMgPSB7XG4gICAgICBvcGVyYXRvcjogXCJ0byBiZSB3aXRoaW4gXCIgKyBzdGFydCArIFwiLi5cIiArIGZpbmlzaCxcbiAgICAgIG1lc3NhZ2U6IGRlc2NyaXB0aW9uXG4gICAgfTtcblxuICAgIHRoaXMuYXNzZXJ0KHRoaXMub2JqID49IHN0YXJ0ICYmIHRoaXMub2JqIDw9IGZpbmlzaCk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gbnVtYmVyIG5lYXIgc29tZSBvdGhlciBgdmFsdWVgIHdpdGhpbiBgZGVsdGFgXG4gICAqXG4gICAqIEBuYW1lIGFwcHJveGltYXRlbHlcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIG51bWJlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIENlbnRlciBudW1iZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRlbHRhIFJhZGl1c1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICg5Ljk5KS5zaG91bGQuYmUuYXBwcm94aW1hdGVseSgxMCwgMC4xKTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJhcHByb3hpbWF0ZWx5XCIsIGZ1bmN0aW9uKHZhbHVlLCBkZWx0YSwgZGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLnBhcmFtcyA9IHtcbiAgICAgIG9wZXJhdG9yOiBcInRvIGJlIGFwcHJveGltYXRlbHkgXCIgKyB2YWx1ZSArIFwiIMKxXCIgKyBkZWx0YSxcbiAgICAgIG1lc3NhZ2U6IGRlc2NyaXB0aW9uXG4gICAgfTtcblxuICAgIHRoaXMuYXNzZXJ0KE1hdGguYWJzKHRoaXMub2JqIC0gdmFsdWUpIDw9IGRlbHRhKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBudW1iZXIgYWJvdmUgYG5gLlxuICAgKlxuICAgKiBAbmFtZSBhYm92ZVxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2dyZWF0ZXJUaGFuXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBudW1iZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuIE1hcmdpbiBudW1iZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtkZXNjcmlwdGlvbl0gT3B0aW9uYWwgbWVzc2FnZVxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiAoMTApLnNob3VsZC5iZS5hYm92ZSgwKTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJhYm92ZVwiLCBmdW5jdGlvbihuLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBhYm92ZSBcIiArIG4sIG1lc3NhZ2U6IGRlc2NyaXB0aW9uIH07XG5cbiAgICB0aGlzLmFzc2VydCh0aGlzLm9iaiA+IG4pO1xuICB9KTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG51bWJlciBiZWxvdyBgbmAuXG4gICAqXG4gICAqIEBuYW1lIGJlbG93XG4gICAqIEBhbGlhcyBBc3NlcnRpb24jbGVzc1RoYW5cbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIG51bWJlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IG4gTWFyZ2luIG51bWJlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICgwKS5zaG91bGQuYmUuYmVsb3coMTApO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcImJlbG93XCIsIGZ1bmN0aW9uKG4sIGRlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIGJlbG93IFwiICsgbiwgbWVzc2FnZTogZGVzY3JpcHRpb24gfTtcblxuICAgIHRoaXMuYXNzZXJ0KHRoaXMub2JqIDwgbik7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcImFib3ZlXCIsIFwiZ3JlYXRlclRoYW5cIik7XG4gIEFzc2VydGlvbi5hbGlhcyhcImJlbG93XCIsIFwibGVzc1RoYW5cIik7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBudW1iZXIgYWJvdmUgYG5gLlxuICAgKlxuICAgKiBAbmFtZSBhYm92ZU9yRXF1YWxcbiAgICogQGFsaWFzIEFzc2VydGlvbiNncmVhdGVyVGhhbk9yRXF1YWxcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIG51bWJlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IG4gTWFyZ2luIG51bWJlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICgxMCkuc2hvdWxkLmJlLmFib3ZlT3JFcXVhbCgwKTtcbiAgICogKDEwKS5zaG91bGQuYmUuYWJvdmVPckVxdWFsKDEwKTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJhYm92ZU9yRXF1YWxcIiwgZnVuY3Rpb24obiwgZGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLnBhcmFtcyA9IHtcbiAgICAgIG9wZXJhdG9yOiBcInRvIGJlIGFib3ZlIG9yIGVxdWFsIFwiICsgbixcbiAgICAgIG1lc3NhZ2U6IGRlc2NyaXB0aW9uXG4gICAgfTtcblxuICAgIHRoaXMuYXNzZXJ0KHRoaXMub2JqID49IG4pO1xuICB9KTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG51bWJlciBiZWxvdyBgbmAuXG4gICAqXG4gICAqIEBuYW1lIGJlbG93T3JFcXVhbFxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2xlc3NUaGFuT3JFcXVhbFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gbnVtYmVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gbiBNYXJnaW4gbnVtYmVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVzY3JpcHRpb25dIE9wdGlvbmFsIG1lc3NhZ2VcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogKDApLnNob3VsZC5iZS5iZWxvd09yRXF1YWwoMTApO1xuICAgKiAoMCkuc2hvdWxkLmJlLmJlbG93T3JFcXVhbCgwKTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJiZWxvd09yRXF1YWxcIiwgZnVuY3Rpb24obiwgZGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLnBhcmFtcyA9IHtcbiAgICAgIG9wZXJhdG9yOiBcInRvIGJlIGJlbG93IG9yIGVxdWFsIFwiICsgbixcbiAgICAgIG1lc3NhZ2U6IGRlc2NyaXB0aW9uXG4gICAgfTtcblxuICAgIHRoaXMuYXNzZXJ0KHRoaXMub2JqIDw9IG4pO1xuICB9KTtcblxuICBBc3NlcnRpb24uYWxpYXMoXCJhYm92ZU9yRXF1YWxcIiwgXCJncmVhdGVyVGhhbk9yRXF1YWxcIik7XG4gIEFzc2VydGlvbi5hbGlhcyhcImJlbG93T3JFcXVhbFwiLCBcImxlc3NUaGFuT3JFcXVhbFwiKTtcbn07XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciB0eXBlQXNzZXJ0aW9ucyA9IGZ1bmN0aW9uKHNob3VsZCwgQXNzZXJ0aW9uKSB7XG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IGlzIG51bWJlclxuICAgKiBAbmFtZSBOdW1iZXJcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHR5cGVzXG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiTnVtYmVyXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBhIG51bWJlclwiIH07XG5cbiAgICB0aGlzLmhhdmUudHlwZShcIm51bWJlclwiKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgYXJndW1lbnRzXG4gICAqIEBuYW1lIGFyZ3VtZW50c1xuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI0FyZ3VtZW50c1xuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gdHlwZXNcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJhcmd1bWVudHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIGFyZ3VtZW50c1wiIH07XG5cbiAgICB0aGlzLmhhdmUuY2xhc3MoXCJBcmd1bWVudHNcIik7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcImFyZ3VtZW50c1wiLCBcIkFyZ3VtZW50c1wiKTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG9iamVjdCBoYXMgc29tZSB0eXBlIHVzaW5nIGB0eXBlb2ZgXG4gICAqIEBuYW1lIHR5cGVcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUeXBlIG5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtkZXNjcmlwdGlvbl0gT3B0aW9uYWwgbWVzc2FnZVxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHR5cGVzXG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwidHlwZVwiLCBmdW5jdGlvbih0eXBlLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBoYXZlIHR5cGUgXCIgKyB0eXBlLCBtZXNzYWdlOiBkZXNjcmlwdGlvbiB9O1xuXG4gICAgc2hvdWxkKHR5cGVvZiB0aGlzLm9iaikuYmUuZXhhY3RseSh0eXBlKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgaW5zdGFuY2Ugb2YgYGNvbnN0cnVjdG9yYFxuICAgKiBAbmFtZSBpbnN0YW5jZW9mXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jaW5zdGFuY2VPZlxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbnN0cnVjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVzY3JpcHRpb25dIE9wdGlvbmFsIG1lc3NhZ2VcbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcImluc3RhbmNlb2ZcIiwgZnVuY3Rpb24oY29uc3RydWN0b3IsIGRlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5wYXJhbXMgPSB7XG4gICAgICBvcGVyYXRvcjogXCJ0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiArIGZ1bmN0aW9uTmFtZShjb25zdHJ1Y3RvciksXG4gICAgICBtZXNzYWdlOiBkZXNjcmlwdGlvblxuICAgIH07XG5cbiAgICB0aGlzLmFzc2VydChPYmplY3QodGhpcy5vYmopIGluc3RhbmNlb2YgY29uc3RydWN0b3IpO1xuICB9KTtcblxuICBBc3NlcnRpb24uYWxpYXMoXCJpbnN0YW5jZW9mXCIsIFwiaW5zdGFuY2VPZlwiKTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG9iamVjdCBpcyBmdW5jdGlvblxuICAgKiBAbmFtZSBGdW5jdGlvblxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gdHlwZXNcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJGdW5jdGlvblwiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFzc2VydFplcm9Bcmd1bWVudHMoYXJndW1lbnRzKTtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmUgYSBmdW5jdGlvblwiIH07XG5cbiAgICB0aGlzLmhhdmUudHlwZShcImZ1bmN0aW9uXCIpO1xuICB9KTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG9iamVjdCBpcyBvYmplY3RcbiAgICogQG5hbWUgT2JqZWN0XG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIk9iamVjdFwiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFzc2VydFplcm9Bcmd1bWVudHMoYXJndW1lbnRzKTtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmUgYW4gb2JqZWN0XCIgfTtcblxuICAgIHRoaXMuaXMubm90Lm51bGwoKS5hbmQuaGF2ZS50eXBlKFwib2JqZWN0XCIpO1xuICB9KTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG9iamVjdCBpcyBzdHJpbmdcbiAgICogQG5hbWUgU3RyaW5nXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIlN0cmluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFzc2VydFplcm9Bcmd1bWVudHMoYXJndW1lbnRzKTtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmUgYSBzdHJpbmdcIiB9O1xuXG4gICAgdGhpcy5oYXZlLnR5cGUoXCJzdHJpbmdcIik7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IGlzIGFycmF5XG4gICAqIEBuYW1lIEFycmF5XG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIkFycmF5XCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBhbiBhcnJheVwiIH07XG5cbiAgICB0aGlzLmhhdmUuY2xhc3MoXCJBcnJheVwiKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgYm9vbGVhblxuICAgKiBAbmFtZSBCb29sZWFuXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIkJvb2xlYW5cIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIGEgYm9vbGVhblwiIH07XG5cbiAgICB0aGlzLmhhdmUudHlwZShcImJvb2xlYW5cIik7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IGlzIGVycm9yXG4gICAqIEBuYW1lIEVycm9yXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIkVycm9yXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBhbiBlcnJvclwiIH07XG5cbiAgICB0aGlzLmhhdmUuaW5zdGFuY2VPZihFcnJvcik7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IGlzIGEgZGF0ZVxuICAgKiBAbmFtZSBEYXRlXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiB0eXBlc1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIkRhdGVcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIGEgZGF0ZVwiIH07XG5cbiAgICB0aGlzLmhhdmUuaW5zdGFuY2VPZihEYXRlKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgbnVsbFxuICAgKiBAbmFtZSBudWxsXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jTnVsbFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gdHlwZXNcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJudWxsXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBudWxsXCIgfTtcblxuICAgIHRoaXMuYXNzZXJ0KHRoaXMub2JqID09PSBudWxsKTtcbiAgfSk7XG5cbiAgQXNzZXJ0aW9uLmFsaWFzKFwibnVsbFwiLCBcIk51bGxcIik7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaGFzIHNvbWUgaW50ZXJuYWwgW1tDbGFzc11dLCB2aWEgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyBjYWxsXG4gICAqIEBuYW1lIGNsYXNzXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jQ2xhc3NcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHR5cGVzXG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiY2xhc3NcIiwgZnVuY3Rpb24oY2xzKSB7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGhhdmUgW1tDbGFzc11dIFwiICsgY2xzIH07XG5cbiAgICB0aGlzLmFzc2VydChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpcy5vYmopID09PSBcIltvYmplY3QgXCIgKyBjbHMgKyBcIl1cIik7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcImNsYXNzXCIsIFwiQ2xhc3NcIik7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgdW5kZWZpbmVkXG4gICAqIEBuYW1lIHVuZGVmaW5lZFxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI1VuZGVmaW5lZFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gdHlwZXNcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJ1bmRlZmluZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIHVuZGVmaW5lZFwiIH07XG5cbiAgICB0aGlzLmFzc2VydCh0aGlzLm9iaiA9PT0gdm9pZCAwKTtcbiAgfSk7XG5cbiAgQXNzZXJ0aW9uLmFsaWFzKFwidW5kZWZpbmVkXCIsIFwiVW5kZWZpbmVkXCIpO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IHN1cHBvcnRzIGVzNiBpdGVyYWJsZSBwcm90b2NvbCAoanVzdCBjaGVja1xuICAgKiB0aGF0IG9iamVjdCBoYXMgcHJvcGVydHkgU3ltYm9sLml0ZXJhdG9yLCB3aGljaCBpcyBhIGZ1bmN0aW9uKVxuICAgKiBAbmFtZSBpdGVyYWJsZVxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gZXM2XG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiaXRlcmFibGVcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIGl0ZXJhYmxlXCIgfTtcblxuICAgIHNob3VsZCh0aGlzLm9iailcbiAgICAgIC5oYXZlLnByb3BlcnR5KFN5bWJvbC5pdGVyYXRvcilcbiAgICAgIC53aGljaC5pcy5hLkZ1bmN0aW9uKCk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IHN1cHBvcnRzIGVzNiBpdGVyYXRvciBwcm90b2NvbCAoanVzdCBjaGVja1xuICAgKiB0aGF0IG9iamVjdCBoYXMgcHJvcGVydHkgbmV4dCwgd2hpY2ggaXMgYSBmdW5jdGlvbilcbiAgICogQG5hbWUgaXRlcmF0b3JcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGVzNlxuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIml0ZXJhdG9yXCIsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXNzZXJ0WmVyb0FyZ3VtZW50cyhhcmd1bWVudHMpO1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBpdGVyYXRvclwiIH07XG5cbiAgICBzaG91bGQodGhpcy5vYmopXG4gICAgICAuaGF2ZS5wcm9wZXJ0eShcIm5leHRcIilcbiAgICAgIC53aGljaC5pcy5hLkZ1bmN0aW9uKCk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gb2JqZWN0IGlzIGEgZ2VuZXJhdG9yIG9iamVjdFxuICAgKiBAbmFtZSBnZW5lcmF0b3JcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIGVzNlxuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcImdlbmVyYXRvclwiLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFzc2VydFplcm9Bcmd1bWVudHMoYXJndW1lbnRzKTtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmUgZ2VuZXJhdG9yXCIgfTtcblxuICAgIHNob3VsZCh0aGlzLm9iaikuYmUuaXRlcmFibGUuYW5kLml0ZXJhdG9yLmFuZC5pdC5pcy5lcXVhbCh0aGlzLm9ialtTeW1ib2wuaXRlcmF0b3JdKCkpO1xuICB9KTtcbn07XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEVxbFJlc3VsdChyLCBhLCBiKSB7XG4gIHJldHVybiAoKHIucGF0aC5sZW5ndGggPiAwXG4gICAgPyBcImF0IFwiICsgci5wYXRoLm1hcChmb3JtYXRQcm9wKS5qb2luKFwiIC0+IFwiKVxuICAgIDogXCJcIikgK1xuICAgIChyLmEgPT09IGEgPyBcIlwiIDogXCIsIEEgaGFzIFwiICsgZm9ybWF0KHIuYSkpICtcbiAgICAoci5iID09PSBiID8gXCJcIiA6IFwiIGFuZCBCIGhhcyBcIiArIGZvcm1hdChyLmIpKSArXG4gICAgKHIuc2hvd1JlYXNvbiA/IFwiIGJlY2F1c2UgXCIgKyByLnJlYXNvbiA6IFwiXCIpKS50cmltKCk7XG59XG5cbnZhciBlcXVhbGl0eUFzc2VydGlvbnMgPSBmdW5jdGlvbihzaG91bGQsIEFzc2VydGlvbikge1xuICAvKipcbiAgICogRGVlcCBvYmplY3QgZXF1YWxpdHkgY29tcGFyaXNvbi4gRm9yIGZ1bGwgc3BlYyBzZWUgW2BzaG91bGQtZXF1YWwgdGVzdHNgXShodHRwczovL2dpdGh1Yi5jb20vc2hvdWxkanMvZXF1YWwvYmxvYi9tYXN0ZXIvdGVzdC5qcykuXG4gICAqXG4gICAqIEBuYW1lIGVxbFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gZXF1YWxpdHlcbiAgICogQGFsaWFzIEFzc2VydGlvbiNlcWxzXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jZGVlcEVxdWFsXG4gICAqIEBwYXJhbSB7Kn0gdmFsIEV4cGVjdGVkIHZhbHVlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVzY3JpcHRpb25dIE9wdGlvbmFsIG1lc3NhZ2VcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogKDEwKS5zaG91bGQuYmUuZXFsKDEwKTtcbiAgICogKCcxMCcpLnNob3VsZC5ub3QuYmUuZXFsKDEwKTtcbiAgICogKC0wKS5zaG91bGQubm90LmJlLmVxbCgrMCk7XG4gICAqXG4gICAqIE5hTi5zaG91bGQuYmUuZXFsKE5hTik7XG4gICAqXG4gICAqICh7IGE6IDEwfSkuc2hvdWxkLmJlLmVxbCh7IGE6IDEwIH0pO1xuICAgKiBbICdhJyBdLnNob3VsZC5ub3QuYmUuZXFsKHsgJzAnOiAnYScgfSk7XG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiZXFsXCIsIGZ1bmN0aW9uKHZhbCwgZGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gZXF1YWxcIiwgZXhwZWN0ZWQ6IHZhbCwgbWVzc2FnZTogZGVzY3JpcHRpb24gfTtcbiAgICB2YXIgb2JqID0gdGhpcy5vYmo7XG4gICAgdmFyIGZhaWxzID0gZXFsKHRoaXMub2JqLCB2YWwsIHNob3VsZC5jb25maWcpO1xuICAgIHRoaXMucGFyYW1zLmRldGFpbHMgPSBmYWlsc1xuICAgICAgLm1hcChmdW5jdGlvbihmYWlsKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRFcWxSZXN1bHQoZmFpbCwgb2JqLCB2YWwpO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiLCBcIik7XG5cbiAgICB0aGlzLnBhcmFtcy5zaG93RGlmZiA9IGVxbChnZXRUeXBlKG9iaiksIGdldFR5cGUodmFsKSkubGVuZ3RoID09PSAwO1xuXG4gICAgdGhpcy5hc3NlcnQoZmFpbHMubGVuZ3RoID09PSAwKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEV4YWN0IGNvbXBhcmlzb24gdXNpbmcgPT09LlxuICAgKlxuICAgKiBAbmFtZSBlcXVhbFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gZXF1YWxpdHlcbiAgICogQGFsaWFzIEFzc2VydGlvbiNlcXVhbHNcbiAgICogQGFsaWFzIEFzc2VydGlvbiNleGFjdGx5XG4gICAqIEBwYXJhbSB7Kn0gdmFsIEV4cGVjdGVkIHZhbHVlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVzY3JpcHRpb25dIE9wdGlvbmFsIG1lc3NhZ2VcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogMTAuc2hvdWxkLmJlLmVxdWFsKDEwKTtcbiAgICogJ2EnLnNob3VsZC5iZS5leGFjdGx5KCdhJyk7XG4gICAqXG4gICAqIHNob3VsZChudWxsKS5iZS5leGFjdGx5KG51bGwpO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcImVxdWFsXCIsIGZ1bmN0aW9uKHZhbCwgZGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmVcIiwgZXhwZWN0ZWQ6IHZhbCwgbWVzc2FnZTogZGVzY3JpcHRpb24gfTtcblxuICAgIHRoaXMucGFyYW1zLnNob3dEaWZmID0gZXFsKGdldFR5cGUodGhpcy5vYmopLCBnZXRUeXBlKHZhbCkpLmxlbmd0aCA9PT0gMDtcblxuICAgIHRoaXMuYXNzZXJ0KHZhbCA9PT0gdGhpcy5vYmopO1xuICB9KTtcblxuICBBc3NlcnRpb24uYWxpYXMoXCJlcXVhbFwiLCBcImVxdWFsc1wiKTtcbiAgQXNzZXJ0aW9uLmFsaWFzKFwiZXF1YWxcIiwgXCJleGFjdGx5XCIpO1xuICBBc3NlcnRpb24uYWxpYXMoXCJlcWxcIiwgXCJlcWxzXCIpO1xuICBBc3NlcnRpb24uYWxpYXMoXCJlcWxcIiwgXCJkZWVwRXF1YWxcIik7XG5cbiAgZnVuY3Rpb24gYWRkT25lT2YobmFtZSwgbWVzc2FnZSwgbWV0aG9kKSB7XG4gICAgQXNzZXJ0aW9uLmFkZChuYW1lLCBmdW5jdGlvbih2YWxzKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3VsZCh2YWxzKS5iZS5BcnJheSgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IG1lc3NhZ2UsIGV4cGVjdGVkOiB2YWxzIH07XG5cbiAgICAgIHZhciBvYmogPSB0aGlzLm9iajtcbiAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICBzaG91bGRUeXBlQWRhcHRvcnMuZm9yRWFjaCh2YWxzLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzaG91bGQodmFsKVttZXRob2RdKG9iaik7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlIGluc3RhbmNlb2Ygc2hvdWxkLkFzc2VydGlvbkVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm47IC8vZG8gbm90aGluZ1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5hc3NlcnQoZm91bmQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4YWN0IGNvbXBhcmlzb24gdXNpbmcgPT09IHRvIGJlIG9uZSBvZiBzdXBwbGllZCBvYmplY3RzLlxuICAgKlxuICAgKiBAbmFtZSBlcXVhbE9uZU9mXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBlcXVhbGl0eVxuICAgKiBAcGFyYW0ge0FycmF5fCp9IHZhbHMgRXhwZWN0ZWQgdmFsdWVzXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICdhYicuc2hvdWxkLmJlLmVxdWFsT25lT2YoJ2EnLCAxMCwgJ2FiJyk7XG4gICAqICdhYicuc2hvdWxkLmJlLmVxdWFsT25lT2YoWydhJywgMTAsICdhYiddKTtcbiAgICovXG4gIGFkZE9uZU9mKFwiZXF1YWxPbmVPZlwiLCBcInRvIGJlIGVxdWFscyBvbmUgb2ZcIiwgXCJlcXVhbFwiKTtcblxuICAvKipcbiAgICogRXhhY3QgY29tcGFyaXNvbiB1c2luZyAuZXFsIHRvIGJlIG9uZSBvZiBzdXBwbGllZCBvYmplY3RzLlxuICAgKlxuICAgKiBAbmFtZSBvbmVPZlxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gZXF1YWxpdHlcbiAgICogQHBhcmFtIHtBcnJheXwqfSB2YWxzIEV4cGVjdGVkIHZhbHVlc1xuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiAoe2E6IDEwfSkuc2hvdWxkLmJlLm9uZU9mKCdhJywgMTAsICdhYicsIHthOiAxMH0pO1xuICAgKiAoe2E6IDEwfSkuc2hvdWxkLmJlLm9uZU9mKFsnYScsIDEwLCAnYWInLCB7YTogMTB9XSk7XG4gICAqL1xuICBhZGRPbmVPZihcIm9uZU9mXCIsIFwidG8gYmUgb25lIG9mXCIsIFwiZXFsXCIpO1xufTtcblxuLypcbiAqIHNob3VsZC5qcyAtIGFzc2VydGlvbiBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQoYykgMjAxMC0yMDEzIFRKIEhvbG93YXljaHVrIDx0akB2aXNpb24tbWVkaWEuY2E+XG4gKiBDb3B5cmlnaHQoYykgMjAxMy0yMDE3IERlbmlzIEJhcmRhZHltIDxiYXJkYWR5bWNoaWtAZ21haWwuY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxudmFyIHByb21pc2VBc3NlcnRpb25zID0gZnVuY3Rpb24oc2hvdWxkLCBBc3NlcnRpb24kJDEpIHtcbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBvYmplY3QgaXMgYSBQcm9taXNlXG4gICAqXG4gICAqIEBuYW1lIFByb21pc2VcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHByb21pc2VzXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHByb21pc2Uuc2hvdWxkLmJlLlByb21pc2UoKVxuICAgKiAobmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7IHJlc29sdmUoMTApOyB9KSkuc2hvdWxkLmJlLmEuUHJvbWlzZSgpXG4gICAqICgxMCkuc2hvdWxkLm5vdC5iZS5hLlByb21pc2UoKVxuICAgKi9cbiAgQXNzZXJ0aW9uJCQxLmFkZChcIlByb21pc2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIHByb21pc2VcIiB9O1xuXG4gICAgdmFyIG9iaiA9IHRoaXMub2JqO1xuXG4gICAgc2hvdWxkKG9iailcbiAgICAgIC5oYXZlLnByb3BlcnR5KFwidGhlblwiKVxuICAgICAgLndoaWNoLmlzLmEuRnVuY3Rpb24oKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBwcm9taXNlIHdpbGwgYmUgZnVsZmlsbGVkLiBSZXN1bHQgb2YgYXNzZXJ0aW9uIGlzIHN0aWxsIC50aGVuYWJsZSBhbmQgc2hvdWxkIGJlIGhhbmRsZWQgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBuYW1lIGZ1bGZpbGxlZFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jcmVzb2x2ZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gcHJvbWlzZXNcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gZG9uJ3QgZm9yZ2V0IHRvIGhhbmRsZSBhc3luYyBuYXR1cmVcbiAgICogKG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyByZXNvbHZlKDEwKTsgfSkpLnNob3VsZC5iZS5mdWxmaWxsZWQoKTtcbiAgICpcbiAgICogLy8gdGVzdCBleGFtcGxlIHdpdGggbW9jaGEgaXQgaXMgcG9zc2libGUgdG8gcmV0dXJuIHByb21pc2VcbiAgICogaXQoJ2lzIGFzeW5jJywgKCkgPT4ge1xuICAgKiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiByZXNvbHZlKDEwKSlcbiAgICogICAgICAuc2hvdWxkLmJlLmZ1bGZpbGxlZCgpO1xuICAgKiB9KTtcbiAgICovXG4gIEFzc2VydGlvbiQkMS5wcm90b3R5cGUuZnVsZmlsbGVkID0gZnVuY3Rpb24gQXNzZXJ0aW9uJGZ1bGZpbGxlZCgpIHtcbiAgICB0aGlzLmFzc2VydFplcm9Bcmd1bWVudHMoYXJndW1lbnRzKTtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmUgZnVsZmlsbGVkXCIgfTtcblxuICAgIHNob3VsZCh0aGlzLm9iaikuYmUuYS5Qcm9taXNlKCk7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMub2JqLnRoZW4oXG4gICAgICBmdW5jdGlvbiBuZXh0JG9uUmVzb2x2ZSh2YWx1ZSkge1xuICAgICAgICBpZiAodGhhdC5uZWdhdGUpIHtcbiAgICAgICAgICB0aGF0LmZhaWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gbmV4dCRvblJlamVjdChlcnIpIHtcbiAgICAgICAgaWYgKCF0aGF0Lm5lZ2F0ZSkge1xuICAgICAgICAgIHRoYXQucGFyYW1zLm9wZXJhdG9yICs9IFwiLCBidXQgaXQgd2FzIHJlamVjdGVkIHdpdGggXCIgKyBzaG91bGQuZm9ybWF0KGVycik7XG4gICAgICAgICAgdGhhdC5mYWlsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH1cbiAgICApO1xuICB9O1xuXG4gIEFzc2VydGlvbiQkMS5wcm90b3R5cGUucmVzb2x2ZWQgPSBBc3NlcnRpb24kJDEucHJvdG90eXBlLmZ1bGZpbGxlZDtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZC4gUmVzdWx0IG9mIGFzc2VydGlvbiBpcyBzdGlsbCAudGhlbmFibGUgYW5kIHNob3VsZCBiZSBoYW5kbGVkIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBAbmFtZSByZWplY3RlZFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gcHJvbWlzZXNcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIC8vIGRvbid0IGZvcmdldCB0byBoYW5kbGUgYXN5bmMgbmF0dXJlXG4gICAqIChuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHsgcmVzb2x2ZSgxMCk7IH0pKVxuICAgKiAgICAuc2hvdWxkLm5vdC5iZS5yZWplY3RlZCgpO1xuICAgKlxuICAgKiAvLyB0ZXN0IGV4YW1wbGUgd2l0aCBtb2NoYSBpdCBpcyBwb3NzaWJsZSB0byByZXR1cm4gcHJvbWlzZVxuICAgKiBpdCgnaXMgYXN5bmMnLCAoKSA9PiB7XG4gICAqICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QobmV3IEVycm9yKCdib29tJykpKVxuICAgKiAgICAgIC5zaG91bGQuYmUucmVqZWN0ZWQoKTtcbiAgICogfSk7XG4gICAqL1xuICBBc3NlcnRpb24kJDEucHJvdG90eXBlLnJlamVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hc3NlcnRaZXJvQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGJlIHJlamVjdGVkXCIgfTtcblxuICAgIHNob3VsZCh0aGlzLm9iaikuYmUuYS5Qcm9taXNlKCk7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMub2JqLnRoZW4oXG4gICAgICBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIXRoYXQubmVnYXRlKSB7XG4gICAgICAgICAgdGhhdC5wYXJhbXMub3BlcmF0b3IgKz0gXCIsIGJ1dCBpdCB3YXMgZnVsZmlsbGVkXCI7XG4gICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT0gMCkge1xuICAgICAgICAgICAgdGhhdC5wYXJhbXMub3BlcmF0b3IgKz0gXCIgd2l0aCBcIiArIHNob3VsZC5mb3JtYXQodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGF0LmZhaWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gbmV4dCRvbkVycm9yKGVycikge1xuICAgICAgICBpZiAodGhhdC5uZWdhdGUpIHtcbiAgICAgICAgICB0aGF0LmZhaWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBwcm9taXNlIHdpbGwgYmUgZnVsZmlsbGVkIHdpdGggc29tZSBleHBlY3RlZCB2YWx1ZSAodmFsdWUgY29tcGFyZWQgdXNpbmcgLmVxbCkuXG4gICAqIFJlc3VsdCBvZiBhc3NlcnRpb24gaXMgc3RpbGwgLnRoZW5hYmxlIGFuZCBzaG91bGQgYmUgaGFuZGxlZCBhY2NvcmRpbmdseS5cbiAgICpcbiAgICogQG5hbWUgZnVsZmlsbGVkV2l0aFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jcmVzb2x2ZWRXaXRoXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gcHJvbWlzZXNcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIC8vIGRvbid0IGZvcmdldCB0byBoYW5kbGUgYXN5bmMgbmF0dXJlXG4gICAqIChuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHsgcmVzb2x2ZSgxMCk7IH0pKVxuICAgKiAgICAuc2hvdWxkLmJlLmZ1bGZpbGxlZFdpdGgoMTApO1xuICAgKlxuICAgKiAvLyB0ZXN0IGV4YW1wbGUgd2l0aCBtb2NoYSBpdCBpcyBwb3NzaWJsZSB0byByZXR1cm4gcHJvbWlzZVxuICAgKiBpdCgnaXMgYXN5bmMnLCAoKSA9PiB7XG4gICAqICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZXNvbHZlKDEwKSlcbiAgICogICAgICAgLnNob3VsZC5iZS5mdWxmaWxsZWRXaXRoKDEwKTtcbiAgICogfSk7XG4gICAqL1xuICBBc3NlcnRpb24kJDEucHJvdG90eXBlLmZ1bGZpbGxlZFdpdGggPSBmdW5jdGlvbihleHBlY3RlZFZhbHVlKSB7XG4gICAgdGhpcy5wYXJhbXMgPSB7XG4gICAgICBvcGVyYXRvcjogXCJ0byBiZSBmdWxmaWxsZWQgd2l0aCBcIiArIHNob3VsZC5mb3JtYXQoZXhwZWN0ZWRWYWx1ZSlcbiAgICB9O1xuXG4gICAgc2hvdWxkKHRoaXMub2JqKS5iZS5hLlByb21pc2UoKTtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy5vYmoudGhlbihcbiAgICAgIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGF0Lm5lZ2F0ZSkge1xuICAgICAgICAgIHRoYXQuZmFpbCgpO1xuICAgICAgICB9XG4gICAgICAgIHNob3VsZCh2YWx1ZSkuZXFsKGV4cGVjdGVkVmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gbmV4dCRvbkVycm9yKGVycikge1xuICAgICAgICBpZiAoIXRoYXQubmVnYXRlKSB7XG4gICAgICAgICAgdGhhdC5wYXJhbXMub3BlcmF0b3IgKz0gXCIsIGJ1dCBpdCB3YXMgcmVqZWN0ZWQgd2l0aCBcIiArIHNob3VsZC5mb3JtYXQoZXJyKTtcbiAgICAgICAgICB0aGF0LmZhaWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgQXNzZXJ0aW9uJCQxLnByb3RvdHlwZS5yZXNvbHZlZFdpdGggPSBBc3NlcnRpb24kJDEucHJvdG90eXBlLmZ1bGZpbGxlZFdpdGg7XG5cbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBwcm9taXNlIHdpbGwgYmUgcmVqZWN0ZWQgd2l0aCBzb21lIHNvcnQgb2YgZXJyb3IuIEFyZ3VtZW50cyBpcyB0aGUgc2FtZSBmb3IgQXNzZXJ0aW9uI3Rocm93LlxuICAgKiBSZXN1bHQgb2YgYXNzZXJ0aW9uIGlzIHN0aWxsIC50aGVuYWJsZSBhbmQgc2hvdWxkIGJlIGhhbmRsZWQgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBuYW1lIHJlamVjdGVkV2l0aFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gcHJvbWlzZXNcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIGZ1bmN0aW9uIGZhaWxlZFByb21pc2UoKSB7XG4gICAqICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgKiAgICAgcmVqZWN0KG5ldyBFcnJvcignYm9vbScpKVxuICAgKiAgIH0pXG4gICAqIH1cbiAgICogZmFpbGVkUHJvbWlzZSgpLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoRXJyb3IpO1xuICAgKiBmYWlsZWRQcm9taXNlKCkuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgnYm9vbScpO1xuICAgKiBmYWlsZWRQcm9taXNlKCkuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvYm9vbS8pO1xuICAgKiBmYWlsZWRQcm9taXNlKCkuc2hvdWxkLmJlLnJlamVjdGVkV2l0aChFcnJvciwgeyBtZXNzYWdlOiAnYm9vbScgfSk7XG4gICAqIGZhaWxlZFByb21pc2UoKS5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKHsgbWVzc2FnZTogJ2Jvb20nIH0pO1xuICAgKlxuICAgKiAvLyB0ZXN0IGV4YW1wbGUgd2l0aCBtb2NoYSBpdCBpcyBwb3NzaWJsZSB0byByZXR1cm4gcHJvbWlzZVxuICAgKiBpdCgnaXMgYXN5bmMnLCAoKSA9PiB7XG4gICAqICAgIHJldHVybiBmYWlsZWRQcm9taXNlKCkuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCh7IG1lc3NhZ2U6ICdib29tJyB9KTtcbiAgICogfSk7XG4gICAqL1xuICBBc3NlcnRpb24kJDEucHJvdG90eXBlLnJlamVjdGVkV2l0aCA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHByb3BlcnRpZXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gYmUgcmVqZWN0ZWRcIiB9O1xuXG4gICAgc2hvdWxkKHRoaXMub2JqKS5iZS5hLlByb21pc2UoKTtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy5vYmoudGhlbihcbiAgICAgIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghdGhhdC5uZWdhdGUpIHtcbiAgICAgICAgICB0aGF0LmZhaWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gbmV4dCRvbkVycm9yKGVycikge1xuICAgICAgICBpZiAodGhhdC5uZWdhdGUpIHtcbiAgICAgICAgICB0aGF0LmZhaWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvck1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZXJyb3JJbmZvID0gXCJcIjtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIG1lc3NhZ2UpIHtcbiAgICAgICAgICBlcnJvck1hdGNoZWQgPSBtZXNzYWdlID09PSBlcnIubWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgZXJyb3JNYXRjaGVkID0gbWVzc2FnZS50ZXN0KGVyci5tZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBtZXNzYWdlKSB7XG4gICAgICAgICAgZXJyb3JNYXRjaGVkID0gZXJyIGluc3RhbmNlb2YgbWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlICE9PSBudWxsICYmIHR5cGVvZiBtZXNzYWdlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNob3VsZChlcnIpLm1hdGNoKG1lc3NhZ2UpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2Ygc2hvdWxkLkFzc2VydGlvbkVycm9yKSB7XG4gICAgICAgICAgICAgIGVycm9ySW5mbyA9IFwiOiBcIiArIGUubWVzc2FnZTtcbiAgICAgICAgICAgICAgZXJyb3JNYXRjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZXJyb3JNYXRjaGVkKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiIHx8IG1lc3NhZ2UgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIGVycm9ySW5mbyA9IFwiIHdpdGggYSBtZXNzYWdlIG1hdGNoaW5nIFwiICsgc2hvdWxkLmZvcm1hdChtZXNzYWdlKSArIFwiLCBidXQgZ290ICdcIiArIGVyci5tZXNzYWdlICsgXCInXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBtZXNzYWdlKSB7XG4gICAgICAgICAgICBlcnJvckluZm8gPSBcIiBvZiB0eXBlIFwiICsgZnVuY3Rpb25OYW1lKG1lc3NhZ2UpICsgXCIsIGJ1dCBnb3QgXCIgKyBmdW5jdGlvbk5hbWUoZXJyLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgbWVzc2FnZSAmJiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNob3VsZChlcnIpLm1hdGNoKHByb3BlcnRpZXMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2Ygc2hvdWxkLkFzc2VydGlvbkVycm9yKSB7XG4gICAgICAgICAgICAgIGVycm9ySW5mbyA9IFwiOiBcIiArIGUubWVzc2FnZTtcbiAgICAgICAgICAgICAgZXJyb3JNYXRjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQucGFyYW1zLm9wZXJhdG9yICs9IGVycm9ySW5mbztcblxuICAgICAgICB0aGF0LmFzc2VydChlcnJvck1hdGNoZWQpO1xuXG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9XG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IGdpdmVuIG9iamVjdCBpcyBwcm9taXNlIGFuZCB3cmFwIGl0IGluIFByb21pc2VkQXNzZXJ0aW9uLCB3aGljaCBoYXMgYWxsIHByb3BlcnRpZXMgb2YgQXNzZXJ0aW9uLlxuICAgKiBUaGF0IG1lYW5zIHlvdSBjYW4gY2hhaW4gYXMgd2l0aCB1c3VhbCBBc3NlcnRpb24uXG4gICAqIFJlc3VsdCBvZiBhc3NlcnRpb24gaXMgc3RpbGwgLnRoZW5hYmxlIGFuZCBzaG91bGQgYmUgaGFuZGxlZCBhY2NvcmRpbmdseS5cbiAgICpcbiAgICogQG5hbWUgZmluYWxseVxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jZXZlbnR1YWxseVxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHByb21pc2VzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlZEFzc2VydGlvbn0gTGlrZSBBc3NlcnRpb24sIGJ1dCAudGhlbiB0aGlzLm9iaiBpbiBBc3NlcnRpb25cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogKG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyByZXNvbHZlKDEwKTsgfSkpXG4gICAqICAgIC5zaG91bGQuYmUuZXZlbnR1YWxseS5lcXVhbCgxMCk7XG4gICAqXG4gICAqIC8vIHRlc3QgZXhhbXBsZSB3aXRoIG1vY2hhIGl0IGlzIHBvc3NpYmxlIHRvIHJldHVybiBwcm9taXNlXG4gICAqIGl0KCdpcyBhc3luYycsICgpID0+IHtcbiAgICogICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcmVzb2x2ZSgxMCkpXG4gICAqICAgICAgLnNob3VsZC5iZS5maW5hbGx5LmVxdWFsKDEwKTtcbiAgICogfSk7XG4gICAqL1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uJCQxLnByb3RvdHlwZSwgXCJmaW5hbGx5XCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgc2hvdWxkKHRoaXMub2JqKS5iZS5hLlByb21pc2UoKTtcblxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2VkQXNzZXJ0aW9uKFxuICAgICAgICB0aGlzLm9iai50aGVuKGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgIHZhciBhID0gc2hvdWxkKG9iaik7XG5cbiAgICAgICAgICBhLm5lZ2F0ZSA9IHRoYXQubmVnYXRlO1xuICAgICAgICAgIGEuYW55T25lID0gdGhhdC5hbnlPbmU7XG5cbiAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICBBc3NlcnRpb24kJDEuYWxpYXMoXCJmaW5hbGx5XCIsIFwiZXZlbnR1YWxseVwiKTtcbn07XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciBzdHJpbmdBc3NlcnRpb25zID0gZnVuY3Rpb24oc2hvdWxkLCBBc3NlcnRpb24pIHtcbiAgLyoqXG4gICAqIEFzc2VydCBnaXZlbiBzdHJpbmcgc3RhcnRzIHdpdGggcHJlZml4XG4gICAqIEBuYW1lIHN0YXJ0V2l0aFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gc3RyaW5nc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIFByZWZpeFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICdhYmMnLnNob3VsZC5zdGFydFdpdGgoJ2EnKTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJzdGFydFdpdGhcIiwgZnVuY3Rpb24oc3RyLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0ge1xuICAgICAgb3BlcmF0b3I6IFwidG8gc3RhcnQgd2l0aCBcIiArIHNob3VsZC5mb3JtYXQoc3RyKSxcbiAgICAgIG1lc3NhZ2U6IGRlc2NyaXB0aW9uXG4gICAgfTtcblxuICAgIHRoaXMuYXNzZXJ0KDAgPT09IHRoaXMub2JqLmluZGV4T2Yoc3RyKSk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gc3RyaW5nIGVuZHMgd2l0aCBwcmVmaXhcbiAgICogQG5hbWUgZW5kV2l0aFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gc3RyaW5nc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIFByZWZpeFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqICdhYmNhJy5zaG91bGQuZW5kV2l0aCgnYScpO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcImVuZFdpdGhcIiwgZnVuY3Rpb24oc3RyLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0ge1xuICAgICAgb3BlcmF0b3I6IFwidG8gZW5kIHdpdGggXCIgKyBzaG91bGQuZm9ybWF0KHN0ciksXG4gICAgICBtZXNzYWdlOiBkZXNjcmlwdGlvblxuICAgIH07XG5cbiAgICB0aGlzLmFzc2VydCh0aGlzLm9iai5pbmRleE9mKHN0ciwgdGhpcy5vYmoubGVuZ3RoIC0gc3RyLmxlbmd0aCkgPj0gMCk7XG4gIH0pO1xufTtcblxuLypcbiAqIHNob3VsZC5qcyAtIGFzc2VydGlvbiBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQoYykgMjAxMC0yMDEzIFRKIEhvbG93YXljaHVrIDx0akB2aXNpb24tbWVkaWEuY2E+XG4gKiBDb3B5cmlnaHQoYykgMjAxMy0yMDE3IERlbmlzIEJhcmRhZHltIDxiYXJkYWR5bWNoaWtAZ21haWwuY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxudmFyIGNvbnRhaW5Bc3NlcnRpb25zID0gZnVuY3Rpb24oc2hvdWxkLCBBc3NlcnRpb24pIHtcbiAgdmFyIGkgPSBzaG91bGQuZm9ybWF0O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgdGhhdCBnaXZlbiBvYmplY3QgY29udGFpbiBzb21ldGhpbmcgdGhhdCBlcXVhbCB0byBgb3RoZXJgLiBJdCB1c2VzIGBzaG91bGQtZXF1YWxgIGZvciBlcXVhbGl0eSBjaGVja3MuXG4gICAqIElmIGdpdmVuIG9iamVjdCBpcyBhcnJheSBpdCBzZWFyY2ggdGhhdCBvbmUgb2YgZWxlbWVudHMgd2FzIGVxdWFsIHRvIGBvdGhlcmAuXG4gICAqIElmIGdpdmVuIG9iamVjdCBpcyBzdHJpbmcgaXQgY2hlY2tzIGlmIGBvdGhlcmAgaXMgYSBzdWJzdHJpbmcgLSBleHBlY3RlZCB0aGF0IGBvdGhlcmAgaXMgYSBzdHJpbmcuXG4gICAqIElmIGdpdmVuIG9iamVjdCBpcyBPYmplY3QgaXQgY2hlY2tzIHRoYXQgYG90aGVyYCBpcyBhIHN1Ym9iamVjdCAtIGV4cGVjdGVkIHRoYXQgYG90aGVyYCBpcyBhIG9iamVjdC5cbiAgICpcbiAgICogQG5hbWUgY29udGFpbkVxbFxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gY29udGFpblxuICAgKiBAcGFyYW0geyp9IG90aGVyIE5lc3RlZCBvYmplY3RcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogWzEsIDIsIDNdLnNob3VsZC5jb250YWluRXFsKDEpO1xuICAgKiBbeyBhOiAxIH0sICdhJywgMTBdLnNob3VsZC5jb250YWluRXFsKHsgYTogMSB9KTtcbiAgICpcbiAgICogJ2FiYycuc2hvdWxkLmNvbnRhaW5FcWwoJ2InKTtcbiAgICogJ2FiMWMnLnNob3VsZC5jb250YWluRXFsKDEpO1xuICAgKlxuICAgKiAoeyBhOiAxMCwgYzogeyBkOiAxMCB9fSkuc2hvdWxkLmNvbnRhaW5FcWwoeyBhOiAxMCB9KTtcbiAgICogKHsgYTogMTAsIGM6IHsgZDogMTAgfX0pLnNob3VsZC5jb250YWluRXFsKHsgYzogeyBkOiAxMCB9fSk7XG4gICAqICh7IGE6IDEwLCBjOiB7IGQ6IDEwIH19KS5zaG91bGQuY29udGFpbkVxbCh7IGI6IDEwIH0pO1xuICAgKiAvLyB0aHJvd3MgQXNzZXJ0aW9uRXJyb3I6IGV4cGVjdGVkIHsgYTogMTAsIGM6IHsgZDogMTAgfSB9IHRvIGNvbnRhaW4geyBiOiAxMCB9XG4gICAqIC8vICAgICAgICAgICAgZXhwZWN0ZWQgeyBhOiAxMCwgYzogeyBkOiAxMCB9IH0gdG8gaGF2ZSBwcm9wZXJ0eSBiXG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwiY29udGFpbkVxbFwiLCBmdW5jdGlvbihvdGhlcikge1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBjb250YWluIFwiICsgaShvdGhlcikgfTtcblxuICAgIHRoaXMuaXMubm90Lm51bGwoKS5hbmQubm90LnVuZGVmaW5lZCgpO1xuXG4gICAgdmFyIG9iaiA9IHRoaXMub2JqO1xuXG4gICAgaWYgKHR5cGVvZiBvYmogPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5hc3NlcnQob2JqLmluZGV4T2YoU3RyaW5nKG90aGVyKSkgPj0gMCk7XG4gICAgfSBlbHNlIGlmIChzaG91bGRUeXBlQWRhcHRvcnMuaXNJdGVyYWJsZShvYmopKSB7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgc2hvdWxkVHlwZUFkYXB0b3JzLnNvbWUob2JqLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgcmV0dXJuIGVxbCh2LCBvdGhlcikubGVuZ3RoID09PSAwO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvdWxkVHlwZUFkYXB0b3JzLmZvckVhY2goXG4gICAgICAgIG90aGVyLFxuICAgICAgICBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgc2hvdWxkKG9iaikuaGF2ZS52YWx1ZShrZXksIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGhpc1xuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgdGhhdCBnaXZlbiBvYmplY3QgaXMgY29udGFpbiBlcXVhbGx5IHN0cnVjdHVyZWQgb2JqZWN0IG9uIHRoZSBzYW1lIGRlcHRoIGxldmVsLlxuICAgKiBJZiBnaXZlbiBvYmplY3QgaXMgYW4gYXJyYXkgYW5kIGBvdGhlcmAgaXMgYW4gYXJyYXkgaXQgY2hlY2tzIHRoYXQgdGhlIGVxbCBlbGVtZW50cyBpcyBnb2luZyBpbiB0aGUgc2FtZSBzZXF1ZW5jZSBpbiBnaXZlbiBhcnJheSAocmVjdXJzaXZlKVxuICAgKiBJZiBnaXZlbiBvYmplY3QgaXMgYW4gb2JqZWN0IGl0IGNoZWNrcyB0aGF0IHRoZSBzYW1lIGtleXMgY29udGFpbiBkZWVwIGVxdWFsIHZhbHVlcyAocmVjdXJzaXZlKVxuICAgKiBPbiBvdGhlciBjYXNlcyBpdCB0cnkgdG8gY2hlY2sgd2l0aCBgLmVxbGBcbiAgICpcbiAgICogQG5hbWUgY29udGFpbkRlZXBPcmRlcmVkXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBjb250YWluXG4gICAqIEBwYXJhbSB7Kn0gb3RoZXIgTmVzdGVkIG9iamVjdFxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBbIDEsIDIsIDNdLnNob3VsZC5jb250YWluRGVlcE9yZGVyZWQoWzEsIDJdKTtcbiAgICogWyAxLCAyLCBbIDEsIDIsIDMgXV0uc2hvdWxkLmNvbnRhaW5EZWVwT3JkZXJlZChbIDEsIFsgMiwgMyBdXSk7XG4gICAqXG4gICAqICh7IGE6IDEwLCBiOiB7IGM6IDEwLCBkOiBbMSwgMiwgM10gfX0pLnNob3VsZC5jb250YWluRGVlcE9yZGVyZWQoe2E6IDEwfSk7XG4gICAqICh7IGE6IDEwLCBiOiB7IGM6IDEwLCBkOiBbMSwgMiwgM10gfX0pLnNob3VsZC5jb250YWluRGVlcE9yZGVyZWQoe2I6IHtjOiAxMH19KTtcbiAgICogKHsgYTogMTAsIGI6IHsgYzogMTAsIGQ6IFsxLCAyLCAzXSB9fSkuc2hvdWxkLmNvbnRhaW5EZWVwT3JkZXJlZCh7Yjoge2Q6IFsxLCAzXX19KTtcbiAgICovXG4gIEFzc2VydGlvbi5hZGQoXCJjb250YWluRGVlcE9yZGVyZWRcIiwgZnVuY3Rpb24ob3RoZXIpIHtcbiAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6IFwidG8gY29udGFpbiBcIiArIGkob3RoZXIpIH07XG5cbiAgICB2YXIgb2JqID0gdGhpcy5vYmo7XG4gICAgaWYgKHR5cGVvZiBvYmogPT0gXCJzdHJpbmdcIikge1xuICAgICAgLy8gZXhwZWN0IG90aGVyIHRvIGJlIHN0cmluZ1xuICAgICAgdGhpcy5pcy5lcXVhbChTdHJpbmcob3RoZXIpKTtcbiAgICB9IGVsc2UgaWYgKHNob3VsZFR5cGVBZGFwdG9ycy5pc0l0ZXJhYmxlKG9iaikgJiYgc2hvdWxkVHlwZUFkYXB0b3JzLmlzSXRlcmFibGUob3RoZXIpKSB7XG4gICAgICB2YXIgb2JqSXRlcmF0b3IgPSBzaG91bGRUeXBlQWRhcHRvcnMuaXRlcmF0b3Iob2JqKTtcbiAgICAgIHZhciBvdGhlckl0ZXJhdG9yID0gc2hvdWxkVHlwZUFkYXB0b3JzLml0ZXJhdG9yKG90aGVyKTtcblxuICAgICAgdmFyIG5leHRPYmogPSBvYmpJdGVyYXRvci5uZXh0KCk7XG4gICAgICB2YXIgbmV4dE90aGVyID0gb3RoZXJJdGVyYXRvci5uZXh0KCk7XG4gICAgICB3aGlsZSAoIW5leHRPYmouZG9uZSAmJiAhbmV4dE90aGVyLmRvbmUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzaG91bGQobmV4dE9iai52YWx1ZVsxXSkuY29udGFpbkRlZXBPcmRlcmVkKG5leHRPdGhlci52YWx1ZVsxXSk7XG4gICAgICAgICAgbmV4dE90aGVyID0gb3RoZXJJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpZiAoIShlIGluc3RhbmNlb2Ygc2hvdWxkLkFzc2VydGlvbkVycm9yKSkge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmV4dE9iaiA9IG9iakl0ZXJhdG9yLm5leHQoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5hc3NlcnQobmV4dE90aGVyLmRvbmUpO1xuICAgIH0gZWxzZSBpZiAob2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PSBcIm9iamVjdFwiICYmIG90aGVyICE9IG51bGwgJiYgdHlwZW9mIG90aGVyID09IFwib2JqZWN0XCIpIHtcbiAgICAgIC8vVE9ETyBjb21wYXJlIHR5cGVzIG9iamVjdCBjb250YWlucyBvYmplY3QgY2FzZVxuICAgICAgc2hvdWxkVHlwZUFkYXB0b3JzLmZvckVhY2gob3RoZXIsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgc2hvdWxkKG9ialtrZXldKS5jb250YWluRGVlcE9yZGVyZWQodmFsdWUpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGlmIGJvdGggb2JqZWN0cyBpcyBlbXB0eSBtZWFucyB3ZSBmaW5pc2ggdHJhdmVyc2luZyAtIGFuZCB3ZSBuZWVkIHRvIGNvbXBhcmUgZm9yIGhpZGRlbiB2YWx1ZXNcbiAgICAgIGlmIChzaG91bGRUeXBlQWRhcHRvcnMuaXNFbXB0eShvdGhlcikpIHtcbiAgICAgICAgdGhpcy5lcWwob3RoZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVxbChvdGhlcik7XG4gICAgfVxuICB9KTtcblxuICAvKipcbiAgICogVGhlIHNhbWUgbGlrZSBgQXNzZXJ0aW9uI2NvbnRhaW5EZWVwT3JkZXJlZGAgYnV0IGFsbCBjaGVja3Mgb24gYXJyYXlzIHdpdGhvdXQgb3JkZXIuXG4gICAqXG4gICAqIEBuYW1lIGNvbnRhaW5EZWVwXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBjb250YWluXG4gICAqIEBwYXJhbSB7Kn0gb3RoZXIgTmVzdGVkIG9iamVjdFxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBbIDEsIDIsIDNdLnNob3VsZC5jb250YWluRGVlcChbMiwgMV0pO1xuICAgKiBbIDEsIDIsIFsgMSwgMiwgMyBdXS5zaG91bGQuY29udGFpbkRlZXAoWyAxLCBbIDMsIDEgXV0pO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcImNvbnRhaW5EZWVwXCIsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGNvbnRhaW4gXCIgKyBpKG90aGVyKSB9O1xuXG4gICAgdmFyIG9iaiA9IHRoaXMub2JqO1xuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBvdGhlciA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgLy8gZXhwZWN0IG90aGVyIHRvIGJlIHN0cmluZ1xuICAgICAgdGhpcy5pcy5lcXVhbChTdHJpbmcob3RoZXIpKTtcbiAgICB9IGVsc2UgaWYgKHNob3VsZFR5cGVBZGFwdG9ycy5pc0l0ZXJhYmxlKG9iaikgJiYgc2hvdWxkVHlwZUFkYXB0b3JzLmlzSXRlcmFibGUob3RoZXIpKSB7XG4gICAgICB2YXIgdXNlZEtleXMgPSB7fTtcbiAgICAgIHNob3VsZFR5cGVBZGFwdG9ycy5mb3JFYWNoKFxuICAgICAgICBvdGhlcixcbiAgICAgICAgZnVuY3Rpb24ob3RoZXJJdGVtKSB7XG4gICAgICAgICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICAgICBzaG91bGRUeXBlQWRhcHRvcnMuc29tZShvYmosIGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICAgIGlmIChpbmRleCBpbiB1c2VkS2V5cykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkKGl0ZW0pLmNvbnRhaW5EZWVwKG90aGVySXRlbSk7XG4gICAgICAgICAgICAgICAgdXNlZEtleXNbaW5kZXhdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2Ygc2hvdWxkLkFzc2VydGlvbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGhpc1xuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKG9iaiAhPSBudWxsICYmIG90aGVyICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvdGhlciA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAvLyBvYmplY3QgY29udGFpbnMgb2JqZWN0IGNhc2VcbiAgICAgIHNob3VsZFR5cGVBZGFwdG9ycy5mb3JFYWNoKG90aGVyLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHNob3VsZChvYmpba2V5XSkuY29udGFpbkRlZXAodmFsdWUpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGlmIGJvdGggb2JqZWN0cyBpcyBlbXB0eSBtZWFucyB3ZSBmaW5pc2ggdHJhdmVyc2luZyAtIGFuZCB3ZSBuZWVkIHRvIGNvbXBhcmUgZm9yIGhpZGRlbiB2YWx1ZXNcbiAgICAgIGlmIChzaG91bGRUeXBlQWRhcHRvcnMuaXNFbXB0eShvdGhlcikpIHtcbiAgICAgICAgdGhpcy5lcWwob3RoZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVxbChvdGhlcik7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qXHJcbiAqIHNob3VsZC5qcyAtIGFzc2VydGlvbiBsaWJyYXJ5XHJcbiAqIENvcHlyaWdodChjKSAyMDEwLTIwMTMgVEogSG9sb3dheWNodWsgPHRqQHZpc2lvbi1tZWRpYS5jYT5cclxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cclxuICogTUlUIExpY2Vuc2VkXHJcbiAqL1xyXG5cclxudmFyIGFTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcclxuXHJcbnZhciBwcm9wZXJ0eUFzc2VydGlvbnMgPSBmdW5jdGlvbihzaG91bGQsIEFzc2VydGlvbikge1xyXG4gIHZhciBpID0gc2hvdWxkLmZvcm1hdDtcclxuICAvKipcclxuICAgKiBBc3NlcnRzIGdpdmVuIG9iamVjdCBoYXMgc29tZSBkZXNjcmlwdG9yLiAqKk9uIHN1Y2Nlc3MgaXQgY2hhbmdlIGdpdmVuIG9iamVjdCB0byBiZSB2YWx1ZSBvZiBwcm9wZXJ0eSoqLlxyXG4gICAqXHJcbiAgICogQG5hbWUgcHJvcGVydHlXaXRoRGVzY3JpcHRvclxyXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cclxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHByb3BlcnR5XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTmFtZSBvZiBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjIERlc2NyaXB0b3IgbGlrZSB1c2VkIGluIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSAobm90IHJlcXVpcmVkIHRvIGFkZCBhbGwgcHJvcGVydGllcylcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogKHsgYTogMTAgfSkuc2hvdWxkLmhhdmUucHJvcGVydHlXaXRoRGVzY3JpcHRvcignYScsIHsgZW51bWVyYWJsZTogdHJ1ZSB9KTtcclxuICAgKi9cclxuICBBc3NlcnRpb24uYWRkKFwicHJvcGVydHlXaXRoRGVzY3JpcHRvclwiLCBmdW5jdGlvbihuYW1lLCBkZXNjKSB7XHJcbiAgICB0aGlzLnBhcmFtcyA9IHtcclxuICAgICAgYWN0dWFsOiB0aGlzLm9iaixcclxuICAgICAgb3BlcmF0b3I6IFwidG8gaGF2ZSBvd24gcHJvcGVydHkgd2l0aCBkZXNjcmlwdG9yIFwiICsgaShkZXNjKVxyXG4gICAgfTtcclxuICAgIHZhciBvYmogPSB0aGlzLm9iajtcclxuICAgIHRoaXMuaGF2ZS5vd25Qcm9wZXJ0eShuYW1lKTtcclxuICAgIHNob3VsZChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE9iamVjdChvYmopLCBuYW1lKSkuaGF2ZS5wcm9wZXJ0aWVzKGRlc2MpO1xyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBc3NlcnRzIGdpdmVuIG9iamVjdCBoYXMgcHJvcGVydHkgd2l0aCBvcHRpb25hbGx5IHZhbHVlLiAqKk9uIHN1Y2Nlc3MgaXQgY2hhbmdlIGdpdmVuIG9iamVjdCB0byBiZSB2YWx1ZSBvZiBwcm9wZXJ0eSoqLlxyXG4gICAqXHJcbiAgICogQG5hbWUgcHJvcGVydHlcclxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXHJcbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2YgcHJvcGVydHlcclxuICAgKiBAcGFyYW0geyp9IFt2YWxdIE9wdGlvbmFsIHByb3BlcnR5IHZhbHVlIHRvIGNoZWNrXHJcbiAgICogQGV4YW1wbGVcclxuICAgKlxyXG4gICAqICh7IGE6IDEwIH0pLnNob3VsZC5oYXZlLnByb3BlcnR5KCdhJyk7XHJcbiAgICovXHJcbiAgQXNzZXJ0aW9uLmFkZChcInByb3BlcnR5XCIsIGZ1bmN0aW9uKG5hbWUsIHZhbCkge1xyXG4gICAgbmFtZSA9IGNvbnZlcnRQcm9wZXJ0eU5hbWUobmFtZSk7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdmFyIHAgPSB7fTtcclxuICAgICAgcFtuYW1lXSA9IHZhbDtcclxuICAgICAgdGhpcy5oYXZlLnByb3BlcnRpZXMocCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmhhdmUucHJvcGVydGllcyhuYW1lKTtcclxuICAgIH1cclxuICAgIHRoaXMub2JqID0gdGhpcy5vYmpbbmFtZV07XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzc2VydHMgZ2l2ZW4gb2JqZWN0IGhhcyBwcm9wZXJ0aWVzLiBPbiB0aGlzIG1ldGhvZCBhZmZlY3QgLmFueSBtb2RpZmllciwgd2hpY2ggYWxsb3cgdG8gY2hlY2sgbm90IGFsbCBwcm9wZXJ0aWVzLlxyXG4gICAqXHJcbiAgICogQG5hbWUgcHJvcGVydGllc1xyXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cclxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHByb3BlcnR5XHJcbiAgICogQHBhcmFtIHtBcnJheXwuLi5zdHJpbmd8T2JqZWN0fSBuYW1lcyBOYW1lcyBvZiBwcm9wZXJ0eVxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiAoeyBhOiAxMCB9KS5zaG91bGQuaGF2ZS5wcm9wZXJ0aWVzKCdhJyk7XHJcbiAgICogKHsgYTogMTAsIGI6IDIwIH0pLnNob3VsZC5oYXZlLnByb3BlcnRpZXMoWyAnYScgXSk7XHJcbiAgICogKHsgYTogMTAsIGI6IDIwIH0pLnNob3VsZC5oYXZlLnByb3BlcnRpZXMoeyBiOiAyMCB9KTtcclxuICAgKi9cclxuICBBc3NlcnRpb24uYWRkKFwicHJvcGVydGllc1wiLCBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgdmFyIHZhbHVlcyA9IHt9O1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIG5hbWVzID0gYVNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgbmFtZXMgPT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgbmFtZXMgPT0gXCJzeW1ib2xcIikge1xyXG4gICAgICAgIG5hbWVzID0gW25hbWVzXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YWx1ZXMgPSBuYW1lcztcclxuICAgICAgICBuYW1lcyA9IE9iamVjdC5rZXlzKG5hbWVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBvYmogPSBPYmplY3QodGhpcy5vYmopLFxyXG4gICAgICBtaXNzaW5nUHJvcGVydGllcyA9IFtdO1xyXG5cclxuICAgIC8vanVzdCBlbnVtZXJhdGUgcHJvcGVydGllcyBhbmQgY2hlY2sgaWYgdGhleSBhbGwgcHJlc2VudFxyXG4gICAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgIGlmICghKG5hbWUgaW4gb2JqKSkge1xyXG4gICAgICAgIG1pc3NpbmdQcm9wZXJ0aWVzLnB1c2goZm9ybWF0UHJvcChuYW1lKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBwcm9wcyA9IG1pc3NpbmdQcm9wZXJ0aWVzO1xyXG4gICAgaWYgKHByb3BzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBwcm9wcyA9IG5hbWVzLm1hcChmb3JtYXRQcm9wKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5hbnlPbmUpIHtcclxuICAgICAgcHJvcHMgPSBuYW1lc1xyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgICAgcmV0dXJuIG1pc3NpbmdQcm9wZXJ0aWVzLmluZGV4T2YoZm9ybWF0UHJvcChuYW1lKSkgPCAwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm1hcChmb3JtYXRQcm9wKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb3BlcmF0b3IgPVxyXG4gICAgICAocHJvcHMubGVuZ3RoID09PSAxID8gXCJ0byBoYXZlIHByb3BlcnR5IFwiIDogXCJ0byBoYXZlIFwiICsgKHRoaXMuYW55T25lID8gXCJhbnkgb2YgXCIgOiBcIlwiKSArIFwicHJvcGVydGllcyBcIikgK1xyXG4gICAgICBwcm9wcy5qb2luKFwiLCBcIik7XHJcblxyXG4gICAgdGhpcy5wYXJhbXMgPSB7IG9iajogdGhpcy5vYmosIG9wZXJhdG9yOiBvcGVyYXRvciB9O1xyXG5cclxuICAgIC8vY2hlY2sgdGhhdCBhbGwgcHJvcGVydGllcyBwcmVzZW50ZWRcclxuICAgIC8vb3IgaWYgd2UgcmVxdWVzdCBvbmUgb2YgdGhlbSB0aGF0IGF0IGxlYXN0IG9uZSB0aGVtIHByZXNlbnRlZFxyXG4gICAgdGhpcy5hc3NlcnQobWlzc2luZ1Byb3BlcnRpZXMubGVuZ3RoID09PSAwIHx8ICh0aGlzLmFueU9uZSAmJiBtaXNzaW5nUHJvcGVydGllcy5sZW5ndGggIT0gbmFtZXMubGVuZ3RoKSk7XHJcblxyXG4gICAgLy8gY2hlY2sgaWYgdmFsdWVzIGluIG9iamVjdCBtYXRjaGVkIGV4cGVjdGVkXHJcbiAgICB2YXIgdmFsdWVDaGVja05hbWVzID0gT2JqZWN0LmtleXModmFsdWVzKTtcclxuICAgIGlmICh2YWx1ZUNoZWNrTmFtZXMubGVuZ3RoKSB7XHJcbiAgICAgIHZhciB3cm9uZ1ZhbHVlcyA9IFtdO1xyXG4gICAgICBwcm9wcyA9IFtdO1xyXG5cclxuICAgICAgLy8gbm93IGNoZWNrIHZhbHVlcywgYXMgdGhlcmUgd2UgaGF2ZSBhbGwgcHJvcGVydGllc1xyXG4gICAgICB2YWx1ZUNoZWNrTmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW25hbWVdO1xyXG4gICAgICAgIGlmIChlcWwob2JqW25hbWVdLCB2YWx1ZSkubGVuZ3RoICE9PSAwKSB7XHJcbiAgICAgICAgICB3cm9uZ1ZhbHVlcy5wdXNoKGZvcm1hdFByb3AobmFtZSkgKyBcIiBvZiBcIiArIGkodmFsdWUpICsgXCIgKGdvdCBcIiArIGkob2JqW25hbWVdKSArIFwiKVwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcHJvcHMucHVzaChmb3JtYXRQcm9wKG5hbWUpICsgXCIgb2YgXCIgKyBpKHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICgod3JvbmdWYWx1ZXMubGVuZ3RoICE9PSAwICYmICF0aGlzLmFueU9uZSkgfHwgKHRoaXMuYW55T25lICYmIHByb3BzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICBwcm9wcyA9IHdyb25nVmFsdWVzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBvcGVyYXRvciA9XHJcbiAgICAgICAgKHByb3BzLmxlbmd0aCA9PT0gMSA/IFwidG8gaGF2ZSBwcm9wZXJ0eSBcIiA6IFwidG8gaGF2ZSBcIiArICh0aGlzLmFueU9uZSA/IFwiYW55IG9mIFwiIDogXCJcIikgKyBcInByb3BlcnRpZXMgXCIpICtcclxuICAgICAgICBwcm9wcy5qb2luKFwiLCBcIik7XHJcblxyXG4gICAgICB0aGlzLnBhcmFtcyA9IHsgb2JqOiB0aGlzLm9iaiwgb3BlcmF0b3I6IG9wZXJhdG9yIH07XHJcblxyXG4gICAgICAvL2lmIHRoZXJlIGlzIG5vIG5vdCBtYXRjaGVkIHZhbHVlc1xyXG4gICAgICAvL29yIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBtYXRjaGVkXHJcbiAgICAgIHRoaXMuYXNzZXJ0KHdyb25nVmFsdWVzLmxlbmd0aCA9PT0gMCB8fCAodGhpcy5hbnlPbmUgJiYgd3JvbmdWYWx1ZXMubGVuZ3RoICE9IHZhbHVlQ2hlY2tOYW1lcy5sZW5ndGgpKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQXNzZXJ0cyBnaXZlbiBvYmplY3QgaGFzIHByb3BlcnR5IGBsZW5ndGhgIHdpdGggZ2l2ZW4gdmFsdWUgYG5gXHJcbiAgICpcclxuICAgKiBAbmFtZSBsZW5ndGhcclxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2xlbmd0aE9mXHJcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxyXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gcHJvcGVydHlcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbiBFeHBlY3RlZCBsZW5ndGhcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXHJcbiAgICogQGV4YW1wbGVcclxuICAgKlxyXG4gICAqIFsxLCAyXS5zaG91bGQuaGF2ZS5sZW5ndGgoMik7XHJcbiAgICovXHJcbiAgQXNzZXJ0aW9uLmFkZChcImxlbmd0aFwiLCBmdW5jdGlvbihuLCBkZXNjcmlwdGlvbikge1xyXG4gICAgdGhpcy5oYXZlLnByb3BlcnR5KFwibGVuZ3RoXCIsIG4sIGRlc2NyaXB0aW9uKTtcclxuICB9KTtcclxuXHJcbiAgQXNzZXJ0aW9uLmFsaWFzKFwibGVuZ3RoXCIsIFwibGVuZ3RoT2ZcIik7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzc2VydHMgZ2l2ZW4gb2JqZWN0IGhhcyBvd24gcHJvcGVydHkuICoqT24gc3VjY2VzcyBpdCBjaGFuZ2UgZ2l2ZW4gb2JqZWN0IHRvIGJlIHZhbHVlIG9mIHByb3BlcnR5KiouXHJcbiAgICpcclxuICAgKiBAbmFtZSBvd25Qcm9wZXJ0eVxyXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jaGFzT3duUHJvcGVydHlcclxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXHJcbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2YgcHJvcGVydHlcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXHJcbiAgICogQGV4YW1wbGVcclxuICAgKlxyXG4gICAqICh7IGE6IDEwIH0pLnNob3VsZC5oYXZlLm93blByb3BlcnR5KCdhJyk7XHJcbiAgICovXHJcbiAgQXNzZXJ0aW9uLmFkZChcIm93blByb3BlcnR5XCIsIGZ1bmN0aW9uKG5hbWUsIGRlc2NyaXB0aW9uKSB7XHJcbiAgICBuYW1lID0gY29udmVydFByb3BlcnR5TmFtZShuYW1lKTtcclxuICAgIHRoaXMucGFyYW1zID0ge1xyXG4gICAgICBhY3R1YWw6IHRoaXMub2JqLFxyXG4gICAgICBvcGVyYXRvcjogXCJ0byBoYXZlIG93biBwcm9wZXJ0eSBcIiArIGZvcm1hdFByb3AobmFtZSksXHJcbiAgICAgIG1lc3NhZ2U6IGRlc2NyaXB0aW9uXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYXNzZXJ0KHNob3VsZFV0aWwuaGFzT3duUHJvcGVydHkodGhpcy5vYmosIG5hbWUpKTtcclxuXHJcbiAgICB0aGlzLm9iaiA9IHRoaXMub2JqW25hbWVdO1xyXG4gIH0pO1xyXG5cclxuICBBc3NlcnRpb24uYWxpYXMoXCJvd25Qcm9wZXJ0eVwiLCBcImhhc093blByb3BlcnR5XCIpO1xyXG5cclxuICAvKipcclxuICAgKiBBc3NlcnRzIGdpdmVuIG9iamVjdCBpcyBlbXB0eS4gRm9yIHN0cmluZ3MsIGFycmF5cyBhbmQgYXJndW1lbnRzIGl0IGNoZWNrcyAubGVuZ3RoIHByb3BlcnR5LCBmb3Igb2JqZWN0cyBpdCBjaGVja3Mga2V5cy5cclxuICAgKlxyXG4gICAqIEBuYW1lIGVtcHR5XHJcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxyXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gcHJvcGVydHlcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogJycuc2hvdWxkLmJlLmVtcHR5KCk7XHJcbiAgICogW10uc2hvdWxkLmJlLmVtcHR5KCk7XHJcbiAgICogKHt9KS5zaG91bGQuYmUuZW1wdHkoKTtcclxuICAgKi9cclxuICBBc3NlcnRpb24uYWRkKFxyXG4gICAgXCJlbXB0eVwiLFxyXG4gICAgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBiZSBlbXB0eVwiIH07XHJcbiAgICAgIHRoaXMuYXNzZXJ0KHNob3VsZFR5cGVBZGFwdG9ycy5pc0VtcHR5KHRoaXMub2JqKSk7XHJcbiAgICB9LFxyXG4gICAgdHJ1ZVxyXG4gICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzc2VydHMgZ2l2ZW4gb2JqZWN0IGhhcyBzdWNoIGtleXMuIENvbXBhcmVkIHRvIGBwcm9wZXJ0aWVzYCwgYGtleXNgIGRvZXMgbm90IGFjY2VwdCBPYmplY3QgYXMgYSBhcmd1bWVudC5cclxuICAgKiBXaGVuIGNhbGxpbmcgdmlhIC5rZXkgY3VycmVudCBvYmplY3QgaW4gYXNzZXJ0aW9uIGNoYW5nZWQgdG8gdmFsdWUgb2YgdGhpcyBrZXlcclxuICAgKlxyXG4gICAqIEBuYW1lIGtleXNcclxuICAgKiBAYWxpYXMgQXNzZXJ0aW9uI2tleVxyXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cclxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHByb3BlcnR5XHJcbiAgICogQHBhcmFtIHsuLi4qfSBrZXlzIEtleXMgdG8gY2hlY2tcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogKHsgYTogMTAgfSkuc2hvdWxkLmhhdmUua2V5cygnYScpO1xyXG4gICAqICh7IGE6IDEwLCBiOiAyMCB9KS5zaG91bGQuaGF2ZS5rZXlzKCdhJywgJ2InKTtcclxuICAgKiAobmV3IE1hcChbWzEsIDJdXSkpLnNob3VsZC5oYXZlLmtleSgxKTtcclxuICAgKlxyXG4gICAqIGpzb24uc2hvdWxkLmhhdmUub25seS5rZXlzKCd0eXBlJywgJ3ZlcnNpb24nKVxyXG4gICAqL1xyXG4gIEFzc2VydGlvbi5hZGQoXCJrZXlzXCIsIGZ1bmN0aW9uKGtleXMpIHtcclxuICAgIGtleXMgPSBhU2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cclxuICAgIHZhciBvYmogPSBPYmplY3QodGhpcy5vYmopO1xyXG5cclxuICAgIC8vIGZpcnN0IGNoZWNrIGlmIHNvbWUga2V5cyBhcmUgbWlzc2luZ1xyXG4gICAgdmFyIG1pc3NpbmdLZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgIHJldHVybiAhc2hvdWxkVHlwZUFkYXB0b3JzLmhhcyhvYmosIGtleSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgdmVyYiA9IFwidG8gaGF2ZSBcIiArICh0aGlzLm9ubHlUaGlzID8gXCJvbmx5IFwiIDogXCJcIikgKyAoa2V5cy5sZW5ndGggPT09IDEgPyBcImtleSBcIiA6IFwia2V5cyBcIik7XHJcblxyXG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiB2ZXJiICsga2V5cy5qb2luKFwiLCBcIikgfTtcclxuXHJcbiAgICBpZiAobWlzc2luZ0tleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLnBhcmFtcy5vcGVyYXRvciArPSBcIlxcblxcdG1pc3Npbmcga2V5czogXCIgKyBtaXNzaW5nS2V5cy5qb2luKFwiLCBcIik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hc3NlcnQobWlzc2luZ0tleXMubGVuZ3RoID09PSAwKTtcclxuXHJcbiAgICBpZiAodGhpcy5vbmx5VGhpcykge1xyXG4gICAgICBvYmouc2hvdWxkLmhhdmUuc2l6ZShrZXlzLmxlbmd0aCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIEFzc2VydGlvbi5hZGQoXCJrZXlcIiwgZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB0aGlzLmhhdmUua2V5cyhrZXkpO1xyXG4gICAgdGhpcy5vYmogPSBzaG91bGRUeXBlQWRhcHRvcnMuZ2V0KHRoaXMub2JqLCBrZXkpO1xyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBc3NlcnRzIGdpdmVuIG9iamVjdCBoYXMgc3VjaCB2YWx1ZSBmb3IgZ2l2ZW4ga2V5XHJcbiAgICpcclxuICAgKiBAbmFtZSB2YWx1ZVxyXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cclxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIHByb3BlcnR5XHJcbiAgICogQHBhcmFtIHsqfSBrZXkgS2V5IHRvIGNoZWNrXHJcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBWYWx1ZSB0byBjaGVja1xyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiAoeyBhOiAxMCB9KS5zaG91bGQuaGF2ZS52YWx1ZSgnYScsIDEwKTtcclxuICAgKiAobmV3IE1hcChbWzEsIDJdXSkpLnNob3VsZC5oYXZlLnZhbHVlKDEsIDIpO1xyXG4gICAqL1xyXG4gIEFzc2VydGlvbi5hZGQoXCJ2YWx1ZVwiLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICB0aGlzLmhhdmUua2V5KGtleSkud2hpY2guaXMuZXFsKHZhbHVlKTtcclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQXNzZXJ0cyBnaXZlbiBvYmplY3QgaGFzIHN1Y2ggc2l6ZS5cclxuICAgKlxyXG4gICAqIEBuYW1lIHNpemVcclxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXHJcbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzIFNpemUgdG8gY2hlY2tcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogKHsgYTogMTAgfSkuc2hvdWxkLmhhdmUuc2l6ZSgxKTtcclxuICAgKiAobmV3IE1hcChbWzEsIDJdXSkpLnNob3VsZC5oYXZlLnNpemUoMSk7XHJcbiAgICovXHJcbiAgQXNzZXJ0aW9uLmFkZChcInNpemVcIiwgZnVuY3Rpb24ocykge1xyXG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIGhhdmUgc2l6ZSBcIiArIHMgfTtcclxuICAgIHNob3VsZFR5cGVBZGFwdG9ycy5zaXplKHRoaXMub2JqKS5zaG91bGQuYmUuZXhhY3RseShzKTtcclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQXNzZXJ0cyBnaXZlbiBvYmplY3QgaGFzIG5lc3RlZCBwcm9wZXJ0eSBpbiBkZXB0aCBieSBwYXRoLiAqKk9uIHN1Y2Nlc3MgaXQgY2hhbmdlIGdpdmVuIG9iamVjdCB0byBiZSB2YWx1ZSBvZiBmaW5hbCBwcm9wZXJ0eSoqLlxyXG4gICAqXHJcbiAgICogQG5hbWUgcHJvcGVydHlCeVBhdGhcclxuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXHJcbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB7QXJyYXl8Li4uc3RyaW5nfSBwcm9wZXJ0aWVzIFByb3BlcnRpZXMgcGF0aCB0byBzZWFyY2hcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogKHsgYToge2I6IDEwfX0pLnNob3VsZC5oYXZlLnByb3BlcnR5QnlQYXRoKCdhJywgJ2InKS5lcWwoMTApO1xyXG4gICAqL1xyXG4gIEFzc2VydGlvbi5hZGQoXCJwcm9wZXJ0eUJ5UGF0aFwiLCBmdW5jdGlvbihwcm9wZXJ0aWVzKSB7XHJcbiAgICBwcm9wZXJ0aWVzID0gYVNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHJcbiAgICB2YXIgYWxsUHJvcHMgPSBwcm9wZXJ0aWVzLm1hcChmb3JtYXRQcm9wKTtcclxuXHJcbiAgICBwcm9wZXJ0aWVzID0gcHJvcGVydGllcy5tYXAoY29udmVydFByb3BlcnR5TmFtZSk7XHJcblxyXG4gICAgdmFyIG9iaiA9IHNob3VsZChPYmplY3QodGhpcy5vYmopKTtcclxuXHJcbiAgICB2YXIgZm91bmRQcm9wZXJ0aWVzID0gW107XHJcblxyXG4gICAgdmFyIGN1cnJlbnRQcm9wZXJ0eTtcclxuICAgIHdoaWxlIChwcm9wZXJ0aWVzLmxlbmd0aCkge1xyXG4gICAgICBjdXJyZW50UHJvcGVydHkgPSBwcm9wZXJ0aWVzLnNoaWZ0KCk7XHJcbiAgICAgIHRoaXMucGFyYW1zID0ge1xyXG4gICAgICAgIG9wZXJhdG9yOiBcInRvIGhhdmUgcHJvcGVydHkgYnkgcGF0aCBcIiArIGFsbFByb3BzLmpvaW4oXCIsIFwiKSArIFwiIC0gZmFpbGVkIG9uIFwiICsgZm9ybWF0UHJvcChjdXJyZW50UHJvcGVydHkpXHJcbiAgICAgIH07XHJcbiAgICAgIG9iaiA9IG9iai5oYXZlLnByb3BlcnR5KGN1cnJlbnRQcm9wZXJ0eSk7XHJcbiAgICAgIGZvdW5kUHJvcGVydGllcy5wdXNoKGN1cnJlbnRQcm9wZXJ0eSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wYXJhbXMgPSB7XHJcbiAgICAgIG9iajogdGhpcy5vYmosXHJcbiAgICAgIG9wZXJhdG9yOiBcInRvIGhhdmUgcHJvcGVydHkgYnkgcGF0aCBcIiArIGFsbFByb3BzLmpvaW4oXCIsIFwiKVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm9iaiA9IG9iai5vYmo7XHJcbiAgfSk7XHJcbn07XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG52YXIgZXJyb3JBc3NlcnRpb25zID0gZnVuY3Rpb24oc2hvdWxkLCBBc3NlcnRpb24pIHtcbiAgdmFyIGkgPSBzaG91bGQuZm9ybWF0O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgZ2l2ZW4gZnVuY3Rpb24gdGhyb3dzIGVycm9yIHdpdGggc3VjaCBtZXNzYWdlLlxuICAgKlxuICAgKiBAbmFtZSB0aHJvd1xuICAgKiBAbWVtYmVyT2YgQXNzZXJ0aW9uXG4gICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gZXJyb3JzXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jdGhyb3dFcnJvclxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8RnVuY3Rpb258T2JqZWN0fEdlbmVyYXRvckZ1bmN0aW9ufEdlbmVyYXRvck9iamVjdH0gW21lc3NhZ2VdIE1lc3NhZ2UgdG8gbWF0Y2ggb3IgcHJvcGVydGllc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdIE9wdGlvbmFsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIG1hdGNoZWQgdG8gdGhyb3duIGVycm9yXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIChmdW5jdGlvbigpeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWwnKSB9KS5zaG91bGQudGhyb3coKTtcbiAgICogKGZ1bmN0aW9uKCl7IHRocm93IG5ldyBFcnJvcignZmFpbCcpIH0pLnNob3VsZC50aHJvdygnZmFpbCcpO1xuICAgKiAoZnVuY3Rpb24oKXsgdGhyb3cgbmV3IEVycm9yKCdmYWlsJykgfSkuc2hvdWxkLnRocm93KC9mYWlsLyk7XG4gICAqXG4gICAqIChmdW5jdGlvbigpeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWwnKSB9KS5zaG91bGQudGhyb3coRXJyb3IpO1xuICAgKiB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICogZXJyb3IuYSA9IDEwO1xuICAgKiAoZnVuY3Rpb24oKXsgdGhyb3cgZXJyb3I7IH0pLnNob3VsZC50aHJvdyhFcnJvciwgeyBhOiAxMCB9KTtcbiAgICogKGZ1bmN0aW9uKCl7IHRocm93IGVycm9yOyB9KS5zaG91bGQudGhyb3coeyBhOiAxMCB9KTtcbiAgICogKGZ1bmN0aW9uKigpIHtcbiAgICogICB5aWVsZCB0aHJvd0Vycm9yKCk7XG4gICAqIH0pLnNob3VsZC50aHJvdygpO1xuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcInRocm93XCIsIGZ1bmN0aW9uKG1lc3NhZ2UsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgZm4gPSB0aGlzLm9iajtcbiAgICB2YXIgZXJyID0ge307XG4gICAgdmFyIGVycm9ySW5mbyA9IFwiXCI7XG4gICAgdmFyIHRocm93biA9IGZhbHNlO1xuXG4gICAgaWYgKHNob3VsZFV0aWwuaXNHZW5lcmF0b3JGdW5jdGlvbihmbikpIHtcbiAgICAgIHJldHVybiBzaG91bGQoZm4oKSkudGhyb3cobWVzc2FnZSwgcHJvcGVydGllcyk7XG4gICAgfSBlbHNlIGlmIChzaG91bGRVdGlsLmlzSXRlcmF0b3IoZm4pKSB7XG4gICAgICByZXR1cm4gc2hvdWxkKGZuLm5leHQuYmluZChmbikpLnRocm93KG1lc3NhZ2UsIHByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIHRoaXMuaXMuYS5GdW5jdGlvbigpO1xuXG4gICAgdmFyIGVycm9yTWF0Y2hlZCA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgZm4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvd24gPSB0cnVlO1xuICAgICAgZXJyID0gZTtcbiAgICB9XG5cbiAgICBpZiAodGhyb3duKSB7XG4gICAgICBpZiAobWVzc2FnZSkge1xuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PSB0eXBlb2YgbWVzc2FnZSkge1xuICAgICAgICAgIGVycm9yTWF0Y2hlZCA9IG1lc3NhZ2UgPT0gZXJyLm1lc3NhZ2U7XG4gICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgIGVycm9yTWF0Y2hlZCA9IG1lc3NhZ2UudGVzdChlcnIubWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJmdW5jdGlvblwiID09IHR5cGVvZiBtZXNzYWdlKSB7XG4gICAgICAgICAgZXJyb3JNYXRjaGVkID0gZXJyIGluc3RhbmNlb2YgbWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIGlmIChudWxsICE9IG1lc3NhZ2UpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2hvdWxkKGVycikubWF0Y2gobWVzc2FnZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBzaG91bGQuQXNzZXJ0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgZXJyb3JJbmZvID0gXCI6IFwiICsgZS5tZXNzYWdlO1xuICAgICAgICAgICAgICBlcnJvck1hdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlcnJvck1hdGNoZWQpIHtcbiAgICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PSB0eXBlb2YgbWVzc2FnZSB8fCBtZXNzYWdlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICBlcnJvckluZm8gPVxuICAgICAgICAgICAgICBcIiB3aXRoIGEgbWVzc2FnZSBtYXRjaGluZyBcIiArXG4gICAgICAgICAgICAgIGkobWVzc2FnZSkgK1xuICAgICAgICAgICAgICBcIiwgYnV0IGdvdCAnXCIgK1xuICAgICAgICAgICAgICBlcnIubWVzc2FnZSArXG4gICAgICAgICAgICAgIFwiJ1wiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXCJmdW5jdGlvblwiID09IHR5cGVvZiBtZXNzYWdlKSB7XG4gICAgICAgICAgICBlcnJvckluZm8gPVxuICAgICAgICAgICAgICBcIiBvZiB0eXBlIFwiICtcbiAgICAgICAgICAgICAgZnVuY3Rpb25OYW1lKG1lc3NhZ2UpICtcbiAgICAgICAgICAgICAgXCIsIGJ1dCBnb3QgXCIgK1xuICAgICAgICAgICAgICBmdW5jdGlvbk5hbWUoZXJyLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXCJmdW5jdGlvblwiID09IHR5cGVvZiBtZXNzYWdlICYmIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2hvdWxkKGVycikubWF0Y2gocHJvcGVydGllcyk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBzaG91bGQuQXNzZXJ0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgZXJyb3JJbmZvID0gXCI6IFwiICsgZS5tZXNzYWdlO1xuICAgICAgICAgICAgICBlcnJvck1hdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvckluZm8gPSBcIiAoZ290IFwiICsgaShlcnIpICsgXCIpXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wYXJhbXMgPSB7IG9wZXJhdG9yOiBcInRvIHRocm93IGV4Y2VwdGlvblwiICsgZXJyb3JJbmZvIH07XG5cbiAgICB0aGlzLmFzc2VydCh0aHJvd24pO1xuICAgIHRoaXMuYXNzZXJ0KGVycm9yTWF0Y2hlZCk7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcInRocm93XCIsIFwidGhyb3dFcnJvclwiKTtcbn07XG5cbi8qXG4gKiBzaG91bGQuanMgLSBhc3NlcnRpb24gbGlicmFyeVxuICogQ29weXJpZ2h0KGMpIDIwMTAtMjAxMyBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0KGMpIDIwMTMtMjAxNyBEZW5pcyBCYXJkYWR5bSA8YmFyZGFkeW1jaGlrQGdtYWlsLmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciBtYXRjaGluZ0Fzc2VydGlvbnMgPSBmdW5jdGlvbihzaG91bGQsIEFzc2VydGlvbikge1xuICB2YXIgaSA9IHNob3VsZC5mb3JtYXQ7XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgaWYgZ2l2ZW4gb2JqZWN0IG1hdGNoIGBvdGhlcmAgb2JqZWN0LCB1c2luZyBzb21lIGFzc3VtcHRpb25zOlxuICAgKiBGaXJzdCBvYmplY3QgbWF0Y2hlZCBpZiB0aGV5IGFyZSBlcXVhbCxcbiAgICogSWYgYG90aGVyYCBpcyBhIHJlZ2V4cCBhbmQgZ2l2ZW4gb2JqZWN0IGlzIGEgc3RyaW5nIGNoZWNrIG9uIG1hdGNoaW5nIHdpdGggcmVnZXhwXG4gICAqIElmIGBvdGhlcmAgaXMgYSByZWdleHAgYW5kIGdpdmVuIG9iamVjdCBpcyBhbiBhcnJheSBjaGVjayBpZiBhbGwgZWxlbWVudHMgbWF0Y2hlZCByZWdleHBcbiAgICogSWYgYG90aGVyYCBpcyBhIHJlZ2V4cCBhbmQgZ2l2ZW4gb2JqZWN0IGlzIGFuIG9iamVjdCBjaGVjayB2YWx1ZXMgb24gbWF0Y2hpbmcgcmVnZXhwXG4gICAqIElmIGBvdGhlcmAgaXMgYSBmdW5jdGlvbiBjaGVjayBpZiB0aGlzIGZ1bmN0aW9uIHRocm93cyBBc3NlcnRpb25FcnJvciBvbiBnaXZlbiBvYmplY3Qgb3IgcmV0dXJuIGZhbHNlIC0gaXQgd2lsbCBiZSBhc3N1bWVkIGFzIG5vdCBtYXRjaGVkXG4gICAqIElmIGBvdGhlcmAgaXMgYW4gb2JqZWN0IGNoZWNrIGlmIHRoZSBzYW1lIGtleXMgbWF0Y2hlZCB3aXRoIGFib3ZlIHJ1bGVzXG4gICAqIEFsbCBvdGhlciBjYXNlcyBmYWlsZWQuXG4gICAqXG4gICAqIFVzdWFsbHkgaXQgaXMgcmlnaHQgaWRlYSB0byBhZGQgcHJlIHR5cGUgYXNzZXJ0aW9ucywgbGlrZSBgLlN0cmluZygpYCBvciBgLk9iamVjdCgpYCB0byBiZSBzdXJlIGFzc2VydGlvbnMgd2lsbCBkbyB3aGF0IHlvdSBhcmUgZXhwZWN0aW5nLlxuICAgKiBPYmplY3QgaXRlcmF0aW9uIGhhcHBlbiBieSBrZXlzIChwcm9wZXJ0aWVzIHdpdGggZW51bWVyYWJsZTogdHJ1ZSksIHRodXMgc29tZSBvYmplY3RzIGNhbiBjYXVzZSBzbWFsbCBwYWluLiBUeXBpY2FsIGV4YW1wbGUgaXMganNcbiAgICogRXJyb3IgLSBpdCBieSBkZWZhdWx0IGhhcyAyIHByb3BlcnRpZXMgYG5hbWVgIGFuZCBgbWVzc2FnZWAsIGJ1dCB0aGV5IGJvdGggbm9uLWVudW1lcmFibGUuIEluIHRoaXMgY2FzZSBtYWtlIHN1cmUgeW91IHNwZWNpZnkgY2hlY2tpbmcgcHJvcHMgKHNlZSBleGFtcGxlcykuXG4gICAqXG4gICAqIEBuYW1lIG1hdGNoXG4gICAqIEBtZW1iZXJPZiBBc3NlcnRpb25cbiAgICogQGNhdGVnb3J5IGFzc2VydGlvbiBtYXRjaGluZ1xuICAgKiBAcGFyYW0geyp9IG90aGVyIE9iamVjdCB0byBtYXRjaFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqICdmb29iYXInLnNob3VsZC5tYXRjaCgvXmZvby8pO1xuICAgKiAnZm9vYmFyJy5zaG91bGQubm90Lm1hdGNoKC9eYmFyLyk7XG4gICAqXG4gICAqICh7IGE6ICdmb28nLCBjOiAnYmFyZm9vJyB9KS5zaG91bGQubWF0Y2goL2ZvbyQvKTtcbiAgICpcbiAgICogWydhJywgJ2InLCAnYyddLnNob3VsZC5tYXRjaCgvW2Etel0vKTtcbiAgICpcbiAgICogKDUpLnNob3VsZC5ub3QubWF0Y2goZnVuY3Rpb24obikge1xuICAgKiAgIHJldHVybiBuIDwgMDtcbiAgICogfSk7XG4gICAqICg1KS5zaG91bGQubm90Lm1hdGNoKGZ1bmN0aW9uKGl0KSB7XG4gICAqICAgIGl0LnNob3VsZC5iZS5hbi5BcnJheSgpO1xuICAgKiB9KTtcbiAgICogKHsgYTogMTAsIGI6ICdhYmMnLCBjOiB7IGQ6IDEwIH0sIGQ6IDAgfSkuc2hvdWxkXG4gICAqIC5tYXRjaCh7IGE6IDEwLCBiOiAvYyQvLCBjOiBmdW5jdGlvbihpdCkge1xuICAgKiAgICByZXR1cm4gaXQuc2hvdWxkLmhhdmUucHJvcGVydHkoJ2QnLCAxMCk7XG4gICAqIH19KTtcbiAgICpcbiAgICogWzEwLCAnYWJjJywgeyBkOiAxMCB9LCAwXS5zaG91bGRcbiAgICogLm1hdGNoKHsgJzAnOiAxMCwgJzEnOiAvYyQvLCAnMic6IGZ1bmN0aW9uKGl0KSB7XG4gICAqICAgIHJldHVybiBpdC5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnZCcsIDEwKTtcbiAgICogfX0pO1xuICAgKlxuICAgKiB2YXIgbXlTdHJpbmcgPSAnYWJjJztcbiAgICpcbiAgICogbXlTdHJpbmcuc2hvdWxkLmJlLmEuU3RyaW5nKCkuYW5kLm1hdGNoKC9hYmMvKTtcbiAgICpcbiAgICogbXlTdHJpbmcgPSB7fTtcbiAgICpcbiAgICogbXlTdHJpbmcuc2hvdWxkLm1hdGNoKC9hYmMvKTsgLy95ZXMgdGhpcyB3aWxsIHBhc3NcbiAgICogLy9iZXR0ZXIgdG8gZG9cbiAgICogbXlTdHJpbmcuc2hvdWxkLmJlLmFuLk9iamVjdCgpLmFuZC5ub3QuZW1wdHkoKS5hbmQubWF0Y2goL2FiYy8pOy8vZml4ZWRcbiAgICpcbiAgICogKG5ldyBFcnJvcignYm9vbScpKS5zaG91bGQubWF0Y2goL2FiYy8pOy8vcGFzc2VkIGJlY2F1c2Ugbm8ga2V5c1xuICAgKiAobmV3IEVycm9yKCdib29tJykpLnNob3VsZC5ub3QubWF0Y2goeyBtZXNzYWdlOiAvYWJjLyB9KTsvL2NoZWNrIHNwZWNpZmllZCBwcm9wZXJ0eVxuICAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIm1hdGNoXCIsIGZ1bmN0aW9uKG90aGVyLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0geyBvcGVyYXRvcjogXCJ0byBtYXRjaCBcIiArIGkob3RoZXIpLCBtZXNzYWdlOiBkZXNjcmlwdGlvbiB9O1xuXG4gICAgaWYgKGVxbCh0aGlzLm9iaiwgb3RoZXIpLmxlbmd0aCAhPT0gMCkge1xuICAgICAgaWYgKG90aGVyIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIC8vIHNvbWV0aGluZyAtIHJlZ2V4XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9iaiA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgdGhpcy5hc3NlcnQob3RoZXIuZXhlYyh0aGlzLm9iaikpO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT0gdGhpcy5vYmogJiYgdHlwZW9mIHRoaXMub2JqID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICB2YXIgbm90TWF0Y2hlZFByb3BzID0gW10sXG4gICAgICAgICAgICBtYXRjaGVkUHJvcHMgPSBbXTtcbiAgICAgICAgICBzaG91bGRUeXBlQWRhcHRvcnMuZm9yRWFjaChcbiAgICAgICAgICAgIHRoaXMub2JqLFxuICAgICAgICAgICAgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgICAgaWYgKG90aGVyLmV4ZWModmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlZFByb3BzLnB1c2goZm9ybWF0UHJvcChuYW1lKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm90TWF0Y2hlZFByb3BzLnB1c2goZm9ybWF0UHJvcChuYW1lKSArIFwiIChcIiArIGkodmFsdWUpICsgXCIpXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGhpc1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAobm90TWF0Y2hlZFByb3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wYXJhbXMub3BlcmF0b3IgKz0gXCJcXG4gICAgbm90IG1hdGNoZWQgcHJvcGVydGllczogXCIgKyBub3RNYXRjaGVkUHJvcHMuam9pbihcIiwgXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWF0Y2hlZFByb3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wYXJhbXMub3BlcmF0b3IgKz0gXCJcXG4gICAgbWF0Y2hlZCBwcm9wZXJ0aWVzOiBcIiArIG1hdGNoZWRQcm9wcy5qb2luKFwiLCBcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5hc3NlcnQobm90TWF0Y2hlZFByb3BzLmxlbmd0aCA9PT0gMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc2hvdWxkIHdlIHRyeSB0byBjb252ZXJ0IHRvIFN0cmluZyBhbmQgZXhlYz9cbiAgICAgICAgICB0aGlzLmFzc2VydChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG90aGVyID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgcmVzO1xuXG4gICAgICAgIHJlcyA9IG90aGVyKHRoaXMub2JqKTtcblxuICAgICAgICAvL2lmIHdlIHRocm93IGV4Y2VwdGlvbiBvayAtIGl0IGlzIHVzZWQgLnNob3VsZCBpbnNpZGVcbiAgICAgICAgaWYgKHR5cGVvZiByZXMgPT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICB0aGlzLmFzc2VydChyZXMpOyAvLyBpZiBpdCBpcyBqdXN0IGJvb2xlYW4gZnVuY3Rpb24gYXNzZXJ0IG9uIGl0XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMub2JqID09IFwib2JqZWN0XCIgJiYgdGhpcy5vYmogIT0gbnVsbCAmJiAoaXNQbGFpbk9iamVjdChvdGhlcikgfHwgQXJyYXkuaXNBcnJheShvdGhlcikpKSB7XG4gICAgICAgIC8vIHRyeSB0byBtYXRjaCBwcm9wZXJ0aWVzIChmb3IgT2JqZWN0IGFuZCBBcnJheSlcbiAgICAgICAgbm90TWF0Y2hlZFByb3BzID0gW107XG4gICAgICAgIG1hdGNoZWRQcm9wcyA9IFtdO1xuXG4gICAgICAgIHNob3VsZFR5cGVBZGFwdG9ycy5mb3JFYWNoKFxuICAgICAgICAgIG90aGVyLFxuICAgICAgICAgIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHNob3VsZCh0aGlzLm9iailcbiAgICAgICAgICAgICAgICAuaGF2ZS5wcm9wZXJ0eShrZXkpXG4gICAgICAgICAgICAgICAgLndoaWNoLm1hdGNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgbWF0Y2hlZFByb3BzLnB1c2goZm9ybWF0UHJvcChrZXkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBzaG91bGQuQXNzZXJ0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBub3RNYXRjaGVkUHJvcHMucHVzaChmb3JtYXRQcm9wKGtleSkgKyBcIiAoXCIgKyBpKHRoaXMub2JqW2tleV0pICsgXCIpXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHRoaXNcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAobm90TWF0Y2hlZFByb3BzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMucGFyYW1zLm9wZXJhdG9yICs9IFwiXFxuICAgIG5vdCBtYXRjaGVkIHByb3BlcnRpZXM6IFwiICsgbm90TWF0Y2hlZFByb3BzLmpvaW4oXCIsIFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0Y2hlZFByb3BzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMucGFyYW1zLm9wZXJhdG9yICs9IFwiXFxuICAgIG1hdGNoZWQgcHJvcGVydGllczogXCIgKyBtYXRjaGVkUHJvcHMuam9pbihcIiwgXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hc3NlcnQobm90TWF0Y2hlZFByb3BzLmxlbmd0aCA9PT0gMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFzc2VydChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvKipcbiAgICogQXNzZXJ0cyBpZiBnaXZlbiBvYmplY3QgdmFsdWVzIG9yIGFycmF5IGVsZW1lbnRzIGFsbCBtYXRjaCBgb3RoZXJgIG9iamVjdCwgdXNpbmcgc29tZSBhc3N1bXB0aW9uczpcbiAgICogRmlyc3Qgb2JqZWN0IG1hdGNoZWQgaWYgdGhleSBhcmUgZXF1YWwsXG4gICAqIElmIGBvdGhlcmAgaXMgYSByZWdleHAgLSBtYXRjaGluZyB3aXRoIHJlZ2V4cFxuICAgKiBJZiBgb3RoZXJgIGlzIGEgZnVuY3Rpb24gY2hlY2sgaWYgdGhpcyBmdW5jdGlvbiB0aHJvd3MgQXNzZXJ0aW9uRXJyb3Igb24gZ2l2ZW4gb2JqZWN0IG9yIHJldHVybiBmYWxzZSAtIGl0IHdpbGwgYmUgYXNzdW1lZCBhcyBub3QgbWF0Y2hlZFxuICAgKiBBbGwgb3RoZXIgY2FzZXMgY2hlY2sgaWYgdGhpcyBgb3RoZXJgIGVxdWFsIHRvIGVhY2ggZWxlbWVudFxuICAgKlxuICAgKiBAbmFtZSBtYXRjaEVhY2hcbiAgICogQG1lbWJlck9mIEFzc2VydGlvblxuICAgKiBAY2F0ZWdvcnkgYXNzZXJ0aW9uIG1hdGNoaW5nXG4gICAqIEBhbGlhcyBBc3NlcnRpb24jbWF0Y2hFdmVyeVxuICAgKiBAcGFyYW0geyp9IG90aGVyIE9iamVjdCB0byBtYXRjaFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSBPcHRpb25hbCBtZXNzYWdlXG4gICAqIEBleGFtcGxlXG4gICAqIFsgJ2EnLCAnYicsICdjJ10uc2hvdWxkLm1hdGNoRWFjaCgvXFx3Ky8pO1xuICAgKiBbICdhJywgJ2EnLCAnYSddLnNob3VsZC5tYXRjaEVhY2goJ2EnKTtcbiAgICpcbiAgICogWyAnYScsICdhJywgJ2EnXS5zaG91bGQubWF0Y2hFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7IHZhbHVlLnNob3VsZC5iZS5lcWwoJ2EnKSB9KTtcbiAgICpcbiAgICogeyBhOiAnYScsIGI6ICdhJywgYzogJ2EnIH0uc2hvdWxkLm1hdGNoRWFjaChmdW5jdGlvbih2YWx1ZSkgeyB2YWx1ZS5zaG91bGQuYmUuZXFsKCdhJykgfSk7XG4gICAqL1xuICBBc3NlcnRpb24uYWRkKFwibWF0Y2hFYWNoXCIsIGZ1bmN0aW9uKG90aGVyLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0ge1xuICAgICAgb3BlcmF0b3I6IFwidG8gbWF0Y2ggZWFjaCBcIiArIGkob3RoZXIpLFxuICAgICAgbWVzc2FnZTogZGVzY3JpcHRpb25cbiAgICB9O1xuXG4gICAgc2hvdWxkVHlwZUFkYXB0b3JzLmZvckVhY2goXG4gICAgICB0aGlzLm9iaixcbiAgICAgIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHNob3VsZCh2YWx1ZSkubWF0Y2gob3RoZXIpO1xuICAgICAgfSxcbiAgICAgIHRoaXNcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgKiBBc3NlcnRzIGlmIGFueSBvZiBnaXZlbiBvYmplY3QgdmFsdWVzIG9yIGFycmF5IGVsZW1lbnRzIG1hdGNoIGBvdGhlcmAgb2JqZWN0LCB1c2luZyBzb21lIGFzc3VtcHRpb25zOlxuICAqIEZpcnN0IG9iamVjdCBtYXRjaGVkIGlmIHRoZXkgYXJlIGVxdWFsLFxuICAqIElmIGBvdGhlcmAgaXMgYSByZWdleHAgLSBtYXRjaGluZyB3aXRoIHJlZ2V4cFxuICAqIElmIGBvdGhlcmAgaXMgYSBmdW5jdGlvbiBjaGVjayBpZiB0aGlzIGZ1bmN0aW9uIHRocm93cyBBc3NlcnRpb25FcnJvciBvbiBnaXZlbiBvYmplY3Qgb3IgcmV0dXJuIGZhbHNlIC0gaXQgd2lsbCBiZSBhc3N1bWVkIGFzIG5vdCBtYXRjaGVkXG4gICogQWxsIG90aGVyIGNhc2VzIGNoZWNrIGlmIHRoaXMgYG90aGVyYCBlcXVhbCB0byBlYWNoIGVsZW1lbnRcbiAgKlxuICAqIEBuYW1lIG1hdGNoQW55XG4gICogQG1lbWJlck9mIEFzc2VydGlvblxuICAqIEBjYXRlZ29yeSBhc3NlcnRpb24gbWF0Y2hpbmdcbiAgKiBAcGFyYW0geyp9IG90aGVyIE9iamVjdCB0byBtYXRjaFxuICAqIEBhbGlhcyBBc3NlcnRpb24jbWF0Y2hTb21lXG4gICogQHBhcmFtIHtzdHJpbmd9IFtkZXNjcmlwdGlvbl0gT3B0aW9uYWwgbWVzc2FnZVxuICAqIEBleGFtcGxlXG4gICogWyAnYScsICdiJywgJ2MnXS5zaG91bGQubWF0Y2hBbnkoL1xcdysvKTtcbiAgKiBbICdhJywgJ2InLCAnYyddLnNob3VsZC5tYXRjaEFueSgnYScpO1xuICAqXG4gICogWyAnYScsICdiJywgJ2MnXS5zaG91bGQubWF0Y2hBbnkoZnVuY3Rpb24odmFsdWUpIHsgdmFsdWUuc2hvdWxkLmJlLmVxbCgnYScpIH0pO1xuICAqXG4gICogeyBhOiAnYScsIGI6ICdiJywgYzogJ2MnIH0uc2hvdWxkLm1hdGNoQW55KGZ1bmN0aW9uKHZhbHVlKSB7IHZhbHVlLnNob3VsZC5iZS5lcWwoJ2EnKSB9KTtcbiAgKi9cbiAgQXNzZXJ0aW9uLmFkZChcIm1hdGNoQW55XCIsIGZ1bmN0aW9uKG90aGVyLCBkZXNjcmlwdGlvbikge1xuICAgIHRoaXMucGFyYW1zID0ge1xuICAgICAgb3BlcmF0b3I6IFwidG8gbWF0Y2ggYW55IFwiICsgaShvdGhlciksXG4gICAgICBtZXNzYWdlOiBkZXNjcmlwdGlvblxuICAgIH07XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgIHNob3VsZFR5cGVBZGFwdG9ycy5zb21lKHRoaXMub2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHNob3VsZCh2YWx1ZSkubWF0Y2gob3RoZXIpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBzaG91bGQuQXNzZXJ0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgIC8vIENhdWdodCBhbiBBc3NlcnRpb25FcnJvciwgcmV0dXJuIGZhbHNlIHRvIHRoZSBpdGVyYXRvclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH0pO1xuXG4gIEFzc2VydGlvbi5hbGlhcyhcIm1hdGNoQW55XCIsIFwibWF0Y2hTb21lXCIpO1xuICBBc3NlcnRpb24uYWxpYXMoXCJtYXRjaEVhY2hcIiwgXCJtYXRjaEV2ZXJ5XCIpO1xufTtcblxuLypcbiAqIHNob3VsZC5qcyAtIGFzc2VydGlvbiBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQoYykgMjAxMC0yMDEzIFRKIEhvbG93YXljaHVrIDx0akB2aXNpb24tbWVkaWEuY2E+XG4gKiBDb3B5cmlnaHQoYykgMjAxMy0yMDE3IERlbmlzIEJhcmRhZHltIDxiYXJkYWR5bWNoaWtAZ21haWwuY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cbi8qKlxuICogT3VyIGZ1bmN0aW9uIHNob3VsZFxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqIE9iamVjdCB0byBhc3NlcnRcbiAqIEByZXR1cm5zIHtzaG91bGQuQXNzZXJ0aW9ufSBSZXR1cm5zIG5ldyBBc3NlcnRpb24gZm9yIGJlZ2lubmluZyBhc3NlcnRpb24gY2hhaW5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHNob3VsZCA9IHJlcXVpcmUoJ3Nob3VsZCcpO1xuICogc2hvdWxkKCdhYmMnKS5iZS5hLlN0cmluZygpO1xuICovXG5mdW5jdGlvbiBzaG91bGQkMShvYmopIHtcbiAgcmV0dXJuIG5ldyBBc3NlcnRpb24ob2JqKTtcbn1cblxuc2hvdWxkJDEuQXNzZXJ0aW9uRXJyb3IgPSBBc3NlcnRpb25FcnJvcjtcbnNob3VsZCQxLkFzc2VydGlvbiA9IEFzc2VydGlvbjtcblxuLy8gZXhwb3NpbmcgbW9kdWxlcyBkaXJ0eSB3YXlcbnNob3VsZCQxLm1vZHVsZXMgPSB7XG4gIGZvcm1hdDogc2Zvcm1hdCQxLFxuICB0eXBlOiBnZXRUeXBlLFxuICBlcXVhbDogZXFsXG59O1xuc2hvdWxkJDEuZm9ybWF0ID0gZm9ybWF0O1xuXG4vKipcbiAqIE9iamVjdCB3aXRoIGNvbmZpZ3VyYXRpb24uXG4gKiBJdCBjb250YWlucyBzdWNoIHByb3BlcnRpZXM6XG4gKiAqIGBjaGVja1Byb3RvRXFsYCBib29sZWFuIC0gQWZmZWN0IGlmIGAuZXFsYCB3aWxsIGNoZWNrIG9iamVjdHMgcHJvdG90eXBlc1xuICogKiBgcGx1c1plcm9BbmRNaW51c1plcm9FcXVhbGAgYm9vbGVhbiAtIEFmZmVjdCBpZiBgLmVxbGAgd2lsbCB0cmVhdCArMCBhbmQgLTAgYXMgZXF1YWxcbiAqIEFsc28gaXQgY2FuIGNvbnRhaW4gb3B0aW9ucyBmb3Igc2hvdWxkLWZvcm1hdC5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQG1lbWJlck9mIHNob3VsZFxuICogQHN0YXRpY1xuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgYSA9IHsgYTogMTAgfSwgYiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gKiBiLmEgPSAxMDtcbiAqXG4gKiBhLnNob3VsZC5iZS5lcWwoYik7XG4gKiAvL25vdCB0aHJvd3NcbiAqXG4gKiBzaG91bGQuY29uZmlnLmNoZWNrUHJvdG9FcWwgPSB0cnVlO1xuICogYS5zaG91bGQuYmUuZXFsKGIpO1xuICogLy90aHJvd3MgQXNzZXJ0aW9uRXJyb3I6IGV4cGVjdGVkIHsgYTogMTAgfSB0byBlcXVhbCB7IGE6IDEwIH0gKGJlY2F1c2UgQSBhbmQgQiBoYXZlIGRpZmZlcmVudCBwcm90b3R5cGVzKVxuICovXG5zaG91bGQkMS5jb25maWcgPSBjb25maWc7XG5cbi8qKlxuICogQWxsb3cgdG8gZXh0ZW5kIGdpdmVuIHByb3RvdHlwZSB3aXRoIHNob3VsZCBwcm9wZXJ0eSB1c2luZyBnaXZlbiBuYW1lLiBUaGlzIGdldHRlciB3aWxsICoqdW53cmFwKiogYWxsIHN0YW5kYXJkIHdyYXBwZXJzIGxpa2UgYE51bWJlcmAsIGBCb29sZWFuYCwgYFN0cmluZ2AuXG4gKiBVc2luZyBgc2hvdWxkKG9iailgIGlzIHRoZSBlcXVpdmFsZW50IG9mIHVzaW5nIGBvYmouc2hvdWxkYCB3aXRoIGtub3duIGlzc3VlcyAobGlrZSBudWxscyBhbmQgbWV0aG9kIGNhbGxzIGV0YykuXG4gKlxuICogVG8gYWRkIG5ldyBhc3NlcnRpb25zLCBuZWVkIHRvIHVzZSBBc3NlcnRpb24uYWRkIG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3BlcnR5TmFtZV0gTmFtZSBvZiBwcm9wZXJ0eSB0byBhZGQuIERlZmF1bHQgaXMgYCdzaG91bGQnYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvdG9dIFByb3RvdHlwZSB0byBleHRlbmQgd2l0aC4gRGVmYXVsdCBpcyBgT2JqZWN0LnByb3RvdHlwZWAuXG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAcmV0dXJucyB7eyBuYW1lOiBzdHJpbmcsIGRlc2NyaXB0b3I6IE9iamVjdCwgcHJvdG86IE9iamVjdCB9fSBEZXNjcmlwdG9yIGVub3VnaCB0byByZXR1cm4gYWxsIGJhY2tcbiAqIEBzdGF0aWNcbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHByZXYgPSBzaG91bGQuZXh0ZW5kKCdtdXN0JywgT2JqZWN0LnByb3RvdHlwZSk7XG4gKlxuICogJ2FiYycubXVzdC5zdGFydFdpdGgoJ2EnKTtcbiAqXG4gKiB2YXIgc2hvdWxkID0gc2hvdWxkLm5vQ29uZmxpY3QocHJldik7XG4gKiBzaG91bGQubm90LmV4aXN0KE9iamVjdC5wcm90b3R5cGUubXVzdCk7XG4gKi9cbnNob3VsZCQxLmV4dGVuZCA9IGZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvdG8pIHtcbiAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lIHx8IFwic2hvdWxkXCI7XG4gIHByb3RvID0gcHJvdG8gfHwgT2JqZWN0LnByb3RvdHlwZTtcblxuICB2YXIgcHJldkRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvLCBwcm9wZXJ0eU5hbWUpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgcHJvcGVydHlOYW1lLCB7XG4gICAgc2V0OiBmdW5jdGlvbigpIHt9LFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2hvdWxkJDEoaXNXcmFwcGVyVHlwZSh0aGlzKSA/IHRoaXMudmFsdWVPZigpIDogdGhpcyk7XG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG5cbiAgcmV0dXJuIHsgbmFtZTogcHJvcGVydHlOYW1lLCBkZXNjcmlwdG9yOiBwcmV2RGVzY3JpcHRvciwgcHJvdG86IHByb3RvIH07XG59O1xuXG4vKipcbiAqIERlbGV0ZSBwcmV2aW91cyBleHRlbnNpb24uIElmIGBkZXNjYCBtaXNzaW5nIGl0IHdpbGwgcmVtb3ZlIGRlZmF1bHQgZXh0ZW5zaW9uLlxuICpcbiAqIEBwYXJhbSB7eyBuYW1lOiBzdHJpbmcsIGRlc2NyaXB0b3I6IE9iamVjdCwgcHJvdG86IE9iamVjdCB9fSBbZGVzY10gUmV0dXJuZWQgZnJvbSBgc2hvdWxkLmV4dGVuZGAgb2JqZWN0XG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgc2hvdWxkIGZ1bmN0aW9uXG4gKiBAc3RhdGljXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBzaG91bGQgPSByZXF1aXJlKCdzaG91bGQnKS5ub0NvbmZsaWN0KCk7XG4gKlxuICogc2hvdWxkKE9iamVjdC5wcm90b3R5cGUpLm5vdC5oYXZlLnByb3BlcnR5KCdzaG91bGQnKTtcbiAqXG4gKiB2YXIgcHJldiA9IHNob3VsZC5leHRlbmQoJ211c3QnLCBPYmplY3QucHJvdG90eXBlKTtcbiAqICdhYmMnLm11c3Quc3RhcnRXaXRoKCdhJyk7XG4gKiBzaG91bGQubm9Db25mbGljdChwcmV2KTtcbiAqXG4gKiBzaG91bGQoT2JqZWN0LnByb3RvdHlwZSkubm90LmhhdmUucHJvcGVydHkoJ211c3QnKTtcbiAqL1xuc2hvdWxkJDEubm9Db25mbGljdCA9IGZ1bmN0aW9uKGRlc2MpIHtcbiAgZGVzYyA9IGRlc2MgfHwgc2hvdWxkJDEuX3ByZXZTaG91bGQ7XG5cbiAgaWYgKGRlc2MpIHtcbiAgICBkZWxldGUgZGVzYy5wcm90b1tkZXNjLm5hbWVdO1xuXG4gICAgaWYgKGRlc2MuZGVzY3JpcHRvcikge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRlc2MucHJvdG8sIGRlc2MubmFtZSwgZGVzYy5kZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNob3VsZCQxO1xufTtcblxuLyoqXG4gKiBTaW1wbGUgdXRpbGl0eSBmdW5jdGlvbiBmb3IgYSBiaXQgbW9yZSBlYXNpZXIgc2hvdWxkIGFzc2VydGlvbiBleHRlbnNpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGYgU28gY2FsbGVkIHBsdWdpbiBmdW5jdGlvbi4gSXQgc2hvdWxkIGFjY2VwdCAyIGFyZ3VtZW50czogYHNob3VsZGAgZnVuY3Rpb24gYW5kIGBBc3NlcnRpb25gIGNvbnN0cnVjdG9yXG4gKiBAbWVtYmVyT2Ygc2hvdWxkXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgYHNob3VsZGAgZnVuY3Rpb25cbiAqIEBzdGF0aWNcbiAqIEBleGFtcGxlXG4gKlxuICogc2hvdWxkLnVzZShmdW5jdGlvbihzaG91bGQsIEFzc2VydGlvbikge1xuICogICBBc3NlcnRpb24uYWRkKCdhc3NldCcsIGZ1bmN0aW9uKCkge1xuICogICAgICB0aGlzLnBhcmFtcyA9IHsgb3BlcmF0b3I6ICd0byBiZSBhc3NldCcgfTtcbiAqXG4gKiAgICAgIHRoaXMub2JqLnNob3VsZC5oYXZlLnByb3BlcnR5KCdpZCcpLndoaWNoLmlzLmEuTnVtYmVyKCk7XG4gKiAgICAgIHRoaXMub2JqLnNob3VsZC5oYXZlLnByb3BlcnR5KCdwYXRoJyk7XG4gKiAgfSlcbiAqIH0pXG4gKi9cbnNob3VsZCQxLnVzZSA9IGZ1bmN0aW9uKGYpIHtcbiAgZihzaG91bGQkMSwgc2hvdWxkJDEuQXNzZXJ0aW9uKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5zaG91bGQkMVxuICAudXNlKGFzc2VydEV4dGVuc2lvbnMpXG4gIC51c2UoY2hhaW5Bc3NlcnRpb25zKVxuICAudXNlKGJvb2xlYW5Bc3NlcnRpb25zKVxuICAudXNlKG51bWJlckFzc2VydGlvbnMpXG4gIC51c2UoZXF1YWxpdHlBc3NlcnRpb25zKVxuICAudXNlKHR5cGVBc3NlcnRpb25zKVxuICAudXNlKHN0cmluZ0Fzc2VydGlvbnMpXG4gIC51c2UocHJvcGVydHlBc3NlcnRpb25zKVxuICAudXNlKGVycm9yQXNzZXJ0aW9ucylcbiAgLnVzZShtYXRjaGluZ0Fzc2VydGlvbnMpXG4gIC51c2UoY29udGFpbkFzc2VydGlvbnMpXG4gIC51c2UocHJvbWlzZUFzc2VydGlvbnMpO1xuXG52YXIgZGVmYXVsdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcbnZhciBkZWZhdWx0UHJvcGVydHkgPSBcInNob3VsZFwiO1xuXG52YXIgZnJlZUdsb2JhbCA9XG4gIHR5cGVvZiBnbG9iYWwgPT0gXCJvYmplY3RcIiAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9XG4gIHR5cGVvZiBzZWxmID09IFwib2JqZWN0XCIgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG5cbi8qKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKTtcblxuLy9FeHBvc2UgYXBpIHZpYSBgT2JqZWN0I3Nob3VsZGAuXG50cnkge1xuICB2YXIgcHJldlNob3VsZCA9IHNob3VsZCQxLmV4dGVuZChkZWZhdWx0UHJvcGVydHksIGRlZmF1bHRQcm90byk7XG4gIHNob3VsZCQxLl9wcmV2U2hvdWxkID0gcHJldlNob3VsZDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocm9vdCwgXCJzaG91bGRcIiwge1xuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogc2hvdWxkJDFcbiAgfSk7XG59IGNhdGNoIChlKSB7XG4gIC8vaWdub3JlIGVycm9yc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZCQxO1xuIiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIGZvcm1hdCBzdHJpbmdzIGFjY29yZGluZyB0byBhIHBhdHRlcm5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRm9ybWF0dGVyIHtcblxuICAvKipcbiAgICogU2VwYXJhdGVzIGEgcGF0dGVybiBvZiBpbnB1dHMgYW5kIGNvbnN0YW50cyBpbnRvIGFycmF5IG9mIHRva2Vuc1xuICAgKlxuICAgKiBlLmcuICcoOTk5KTk5OS05OTk5JyBmb3IgbnVtYmVyc1xuICAgKiAgICAgICdhOWEgOWE5JyBmb3IgbGV0dGVycyBhbmQgbnVtYmVyc1xuICAgKiAgICAgICcqKioqLSoqKiotKioqKi0qKioqJyBmb3IgbGV0dGVycyBvciBudW1iZXJzXG4gICAqXG4gICAqIEBwYXJhbSBwYXR0ZXJuXG4gICAqIEBwYXJhbSBsZXR0ZXIgQ2hhcmFjdGVyIHRvIHJlcHJlc2VudCBsZXR0ZXIgaW5wdXRcbiAgICogQHBhcmFtIG51bWJlciBDaGFyYWN0ZXIgdG8gcmVwcmVzZW50IG51bWJlciBpbnB1dFxuICAgKiBAcGFyYW0gZWl0aGVyIENoYXJhY3RlciB0byByZXByZXNlbnQgbnVtYmVyL2xldHRlciBpbnB1dFxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0YXRpYyB0b2tlbml6ZShwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgbGV0dGVyID0gJ2EnLFxuICAgICAgICAgICAgICAgICAgbnVtYmVyID0gJzknLFxuICAgICAgICAgICAgICAgICAgZWl0aGVyID0gJyonKSB7XG4gICAgcmV0dXJuIHBhdHRlcm4uc3BsaXQoJycpLm1hcCgoY2hhcmFjdGVyKSA9PiB7XG4gICAgICBzd2l0Y2ggKGNoYXJhY3Rlcikge1xuICAgICAgICBjYXNlIGxldHRlcjpcbiAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUb2tlbignaW5wdXQnLCAnbGV0dGVyJyk7XG4gICAgICAgIGNhc2UgbnVtYmVyOlxuICAgICAgICAgIHJldHVybiB0aGlzLmdldFRva2VuKCdpbnB1dCcsICdudW1iZXInKTtcbiAgICAgICAgY2FzZSBlaXRoZXI6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VG9rZW4oJ2lucHV0JywgJ2VpdGhlcicpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiB0aGlzLmdldFRva2VuKCdjb25zdGFudCcsIGNoYXJhY3Rlcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0VG9rZW4odHlwZSwgdmFsdWUpIHtcbiAgICByZXR1cm4ge3R5cGU6IHR5cGUsIHZhbHVlOiB2YWx1ZX07XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFxuICAgKiBAcGFyYW0ge0FycmF5IDx0b2tlbnM+fSB0b2tlbnNcbiAgICogQHJldHVybiB7c3RyaW5nfSBGb3JtYXR0ZWQgc3RyaW5nXG4gICAqXG4gICAqIENvbnN0cnVjdCBhIGZvcm1hdHRlZCBzdHJpbmcgdXNpbmcgYW4gYXJyYXkgb2YgdG9rZW5zXG4gICAqL1xuICBzdGF0aWMgY29uc3RydWN0KGlucHV0LCB0b2tlbnMpIHtcbiAgICByZXR1cm4gdG9rZW5zLnJlZHVjZSgoZm9ybWF0dGVkLCB0b2tlbiwgaW5kZXgpID0+IHtcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSAnY29uc3RhbnQnICYmIGZvcm1hdHRlZC5sZW5ndGggPiBpbmRleCAtIDEpIHtcbiAgICAgICAgZm9ybWF0dGVkICs9IHRva2VuLnZhbHVlO1xuICAgICAgfSBlbHNlIGlmICh0b2tlbi50eXBlID09PSAnaW5wdXQnKSB7XG4gICAgICAgIGlucHV0ID0gdGhpcy5yZW1vdmVKdW5rKGlucHV0LCB0b2tlbi52YWx1ZSk7XG5cbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3JtYXR0ZWQgKz0gaW5wdXRbMF07XG4gICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMSwgaW5wdXQubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZm9ybWF0dGVkO1xuICAgIH0sICcnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIHRocm91Z2ggc3RyaW5nIGFuZCByZW1vdmUganVuayBjaGFycywgc3RvcHMgd2hlbiB0YXJnZXQgaXMgZm91bmRcbiAgICovXG4gIHN0YXRpYyByZW1vdmVKdW5rKHN0ciwgdGFyZ2V0KSB7XG4gICAgd2hpbGUgKCF0aGlzLnZhbGlkYXRlU3RyaW5nQnlUeXBlKHN0clswXSwgdGFyZ2V0KSAmJiBzdHIubGVuZ3RoID4gMCkge1xuICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygxLCBzdHIubGVuZ3RoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgc3RhdGljIGZvcm1hdChzdHIsIGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdChzdHIsIHRoaXMudG9rZW5pemUoZm9ybWF0KSk7XG4gIH1cblxuICBzdGF0aWMgcmV2ZXJzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJyk7XG4gIH1cblxuICBzdGF0aWMgZm9ybWF0UGhvbmUoc3RyKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0KHN0ciwgJyg5OTkpOTk5LTk5OTknKTtcbiAgfVxuXG4gIHN0YXRpYyBmb3JtYXREYXRlKHN0cikge1xuICAgIHJldHVybiB0aGlzLmZvcm1hdChzdHIsICc5OS85OS85OTk5Jyk7XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0cyBhIHN0cmluZyBpbnRvIGl0cyByZWFkYWJsZSBudW1iZXIgcmVwcmVzZW50YXRpb25cbiAgICpcbiAgICogaWUuIGEgcGF0dGVybiBvZiB1bmtub3duIGxlbmd0aFxuICAgKi9cbiAgc3RhdGljIGZvcm1hdE51bWJlcihzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcgfHwgc3RyLmxlbmd0aCA9PT0gMCB8fCBzdHIudG9TdHJpbmcoKS5yZXBsYWNlKC9bXlxcZF0rL2dpLCAnJykubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgc3RyID0gc3RyLnRvU3RyaW5nKCkucmVwbGFjZSgvW15cXGRdKy9naSwgJycpO1xuXG4gICAgdmFyIHBhdHRlcm4gPSAnOTk5JztcblxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc3RyLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgcGF0dGVybiArPSAnLDk5OSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmV2ZXJzZSh0aGlzLmZvcm1hdCh0aGlzLnJldmVyc2Uoc3RyKSwgcGF0dGVybikpO1xuICB9XG5cbiAgc3RhdGljIGZvcm1hdERvbGxhcnMoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgPT09ICd1bmRlZmluZWQnIHx8IHN0ci5sZW5ndGggPT09IDAgfHwgc3RyLnRvU3RyaW5nKCkucmVwbGFjZSgvW15cXGRdKy9naSwgJycpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHJldHVybiAnJCcgKyB0aGlzLmZvcm1hdE51bWJlcihzdHIpO1xuICB9XG5cbiAgc3RhdGljIGlzTGV0dGVyKHN0cikge1xuICAgIHJldHVybiAhL1teYS16XS9pLnRlc3Qoc3RyKTtcbiAgfVxuXG4gIHN0YXRpYyBpc051bWJlcihzdHIpIHtcbiAgICByZXR1cm4gIS9bXlxcZF0vaS50ZXN0KHN0cik7XG4gIH1cblxuICBzdGF0aWMgaXNFaXRoZXIoc3RyKSB7XG4gICAgcmV0dXJuICEvW15hLXowLTldL2kudGVzdChzdHIpO1xuICB9XG5cbiAgc3RhdGljIHZhbGlkYXRlU3RyaW5nQnlUeXBlKHN0ciwgdHlwZSkge1xuICAgIGlmICghc3RyIHx8IHN0ci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiB0aGlzLmlzTnVtYmVyKHN0cik7XG4gICAgICBjYXNlICdsZXR0ZXInOlxuICAgICAgICByZXR1cm4gdGhpcy5pc0xldHRlcihzdHIpO1xuICAgICAgY2FzZSAnZWl0aGVyJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNFaXRoZXIoc3RyKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCBGb3JtYXR0ZXIgZnJvbSAnLi4vLi4vc3JjL3V0aWxpdGllcy9mb3JtYXR0ZXInO1xuaW1wb3J0IHNob3VsZCBmcm9tICdzaG91bGQnO1xuXG5kZXNjcmliZSgnRm9ybWF0dGVyJywgZnVuY3Rpb24gKCkge1xuICBkZXNjcmliZSgndmFsaWRhdGVTdHJpbmdCeVR5cGUnLCBmdW5jdGlvbigpIHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIGlmIHN0cmluZyBtYXRjaGVzIHR5cGUgKGxldHRlciwgbnVtYmVyLCBlaXRoZXIpJywgZnVuY3Rpb24oKSB7XG4gICAgICBzaG91bGQub2soRm9ybWF0dGVyLnZhbGlkYXRlU3RyaW5nQnlUeXBlKCdmbG93ZXJwdW5rJywgJ2xldHRlcicpKTtcbiAgICAgIHNob3VsZC5vayhGb3JtYXR0ZXIudmFsaWRhdGVTdHJpbmdCeVR5cGUoJ2FzWScsICdsZXR0ZXInKSk7XG4gICAgICBzaG91bGQub2soRm9ybWF0dGVyLnZhbGlkYXRlU3RyaW5nQnlUeXBlKCczMjQnLCAnbnVtYmVyJykpO1xuICAgICAgc2hvdWxkLm9rKEZvcm1hdHRlci52YWxpZGF0ZVN0cmluZ0J5VHlwZSgnYScsICdsZXR0ZXInKSk7XG4gICAgICBzaG91bGQub2soRm9ybWF0dGVyLnZhbGlkYXRlU3RyaW5nQnlUeXBlKCcyMDBtb3RlbHMnLCAnZWl0aGVyJykpO1xuICAgICAgc2hvdWxkLm9rKEZvcm1hdHRlci52YWxpZGF0ZVN0cmluZ0J5VHlwZSgnMScsICdlaXRoZXInKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSBpZiBzdHJpbmcgZG9lcyBub3QgbWF0Y2ggc3BlY2lmaWVkIHR5cGUnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNob3VsZC5pZkVycm9yKEZvcm1hdHRlci52YWxpZGF0ZVN0cmluZ0J5VHlwZSgnMScsICdsZXR0ZXInKSk7XG4gICAgICBzaG91bGQuaWZFcnJvcihGb3JtYXR0ZXIudmFsaWRhdGVTdHJpbmdCeVR5cGUoJzEyUScsICdudW1iZXInKSk7XG4gICAgICBzaG91bGQuaWZFcnJvcihGb3JtYXR0ZXIudmFsaWRhdGVTdHJpbmdCeVR5cGUoJ3MyJmknLCAnZWl0aGVyJykpO1xuICAgICAgc2hvdWxkLmlmRXJyb3IoRm9ybWF0dGVyLnZhbGlkYXRlU3RyaW5nQnlUeXBlKCdhYSUnLCAnbGV0dGVyJykpO1xuICAgICAgc2hvdWxkLmlmRXJyb3IoRm9ybWF0dGVyLnZhbGlkYXRlU3RyaW5nQnlUeXBlKCcnLCAnZWl0aGVyJykpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVtb3ZlSnVuaycsIGZ1bmN0aW9uKCkge1xuICAgIGl0KCdzaG91bGQgcmVtb3ZlIGNoYXJhY3RlcnMgZnJvbSB0aGUgYmVnaW5pbmcgb2YgYSBzdHJpbmcgdW50aWwgYSB0YXJnZXQgY2hhciBpcyBmb3VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIucmVtb3ZlSnVuaygnYXNkMTEnLCAnbnVtYmVyJyksICcxMScpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIucmVtb3ZlSnVuaygnODIgXyEzMlEyMicsICdsZXR0ZXInKSwgJ1EyMicpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIucmVtb3ZlSnVuaygnISEhYTEnLCAnZWl0aGVyJyksICdhMScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY29uc3RydWN0JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbnN0cnVjdCA9IEZvcm1hdHRlci5jb25zdHJ1Y3QoJzIzYXMyczItZHcyJywgRm9ybWF0dGVyLnRva2VuaXplKCc5OTktOTktOTk5OScpLCAnMjNhczJzMi1kdzInKTtcbiAgICB2YXIgY29uc3RydWN0QWxpZW4gPSBGb3JtYXR0ZXIuY29uc3RydWN0KCdhYWEyMzIzMicsIEZvcm1hdHRlci50b2tlbml6ZSgnYS05OTk5OTknLCAnYicpKTtcbiAgICB2YXIgY29uc3RydWN0RG9iID0gRm9ybWF0dGVyLmNvbnN0cnVjdCgnMTIyNjE5OTEnLCBGb3JtYXR0ZXIudG9rZW5pemUoJzk5Lzk5Lzk5OTknKSk7XG4gICAgdmFyIGNvbnN0cnVjdEVtcHR5ID0gRm9ybWF0dGVyLmNvbnN0cnVjdCgnJywgRm9ybWF0dGVyLnRva2VuaXplKCc5OTktOTktOTk5OScpKTtcblxuICAgIGl0KCdzaG91bGQgZm9ybWF0IGEgc3RyaW5nIGFjY29yZGluZyB0byBhbiBhcnJheSBvZiB0b2tlbnMnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNob3VsZC5kZWVwRXF1YWwoY29uc3RydWN0LCAnMjMyLTIyLScpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChjb25zdHJ1Y3RBbGllbiwgJ2EtMjMyMzInKTtcbiAgICAgIHNob3VsZC5kZWVwRXF1YWwoY29uc3RydWN0RG9iLCAnMTIvMjYvMTk5MScpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChjb25zdHJ1Y3RFbXB0eSwgJycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZm9ybWF0JywgZnVuY3Rpb24oKSB7XG4gICAgaXQoJ3Nob3VsZCBmb3JtYXQgYSBzdHJpbmcgYWNjb3JkaW5nIHRvIGEgcGF0dGVybicsIGZ1bmN0aW9uKCkge1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIuZm9ybWF0KCcxMTExMTExMTEnLCAnOTk5LTk5LTk5OTknKSwgJzExMS0xMS0xMTExJyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKEZvcm1hdHRlci5mb3JtYXQoJzEyMy00LWFhc2RkLjU2Xzc4OScsICc5OTktOTktOTk5OScpLCAnMTIzLTQ1LTY3ODknKTtcbiAgICAgIHNob3VsZC5kZWVwRXF1YWwoRm9ybWF0dGVyLmZvcm1hdCgnMTIzNDU2Nzg5MGEnLCAndGQtOTk5OTk5OWEnKSwgJ3RkLTEyMzQ1NjdhJyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKEZvcm1hdHRlci5mb3JtYXQoJzEyMzQ1Njc4OTAnLCAnKDk5OSk5OTktOTk5OScpLCAnKDEyMyk0NTYtNzg5MCcpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIuZm9ybWF0KCcoMTIzKTQ1Ni03ODkwJywgJzk5OSA5OTkgOTk5OScpLCAnMTIzIDQ1NiA3ODkwJyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKEZvcm1hdHRlci5mb3JtYXQoJ2tqbHczMiFhJywgJyoqKiotKioqKicpLCAna2psdy0zMmEnKTtcbiAgICAgIHNob3VsZC5kZWVwRXF1YWwoRm9ybWF0dGVyLmZvcm1hdCgncXdlcnR5JywgJ2FhYScpLCAncXdlJyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKEZvcm1hdHRlci5mb3JtYXQoJ2QyMzN4JywgJycpLCAnJyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKEZvcm1hdHRlci5mb3JtYXQoJzEyLzI2LzE5OTEnLCAnOTkvOTkvOTk5OScpLCAnMTIvMjYvMTk5MScpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIuZm9ybWF0KCcnLCcwMDEgOTk5IDk5OSA5OTk5JyksICcwMDEgJyk7XG5cbiAgICAgIHZhciBmb3JtYXRDcmVkaXRDYXJkID0gKHN0cikgPT4gRm9ybWF0dGVyLmZvcm1hdChzdHIsICc5OTk5IDk5OTkgOTk5OSA5OTk5Jyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKGZvcm1hdENyZWRpdENhcmQoJzEyMzQ1Njc4OTAnKSwgJzEyMzQgNTY3OCA5MCcpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZm9ybWF0RG9sbGFycycsIGZ1bmN0aW9uKCkge1xuICAgIGl0KCdzaG91bGQgY29ycmVjdGx5IGZvcm1hdCBzdGluZyBpbnRvIGRvbGxhciByZXByZXNlbnRhdGlvbicsIGZ1bmN0aW9uKCkge1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIuZm9ybWF0RG9sbGFycygnc2Q0MDAwMDBhJyksICckNDAwLDAwMCcpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIuZm9ybWF0RG9sbGFycygnc2Q0MDAwMDAwMGEnKSwgJyQ0MCwwMDAsMDAwJyk7XG4gICAgICBzaG91bGQuZGVlcEVxdWFsKEZvcm1hdHRlci5mb3JtYXREb2xsYXJzKCdzZGEnKSwgJycpO1xuICAgICAgc2hvdWxkLmRlZXBFcXVhbChGb3JtYXR0ZXIuZm9ybWF0RG9sbGFycygnc2Q0MDBhJyksICckNDAwJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
