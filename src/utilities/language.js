import React from 'react';
import l from '../configs/language';

export default class Language {
  static resolve(path, obj) {
    return path.split('.').reduce((prev, current) => {
      return prev ? prev[current] : ''
    }, obj);
  }

  static get(language, path) {
    let fullPath = language + '.' + path;
    return Language.resolve(fullPath, l);
  }
}