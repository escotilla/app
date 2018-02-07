export function isNode() {
  return typeof process === 'object' && process.title && process.title === 'node';
}

export function hasWindow() {
  return typeof window !== 'undefined' && window !== null;
}

export function getApiUrl() {
  if (process.env.NODE_ENV === 'production') {
    return 'http://api.escotillafinanciera.com';
  }
  return 'http://localhost:5000'
}

export function handleErrors(response) {
  if (response.success === false) {
    throw Error(response.error);
  }

  return response;
}

export function parseSearch(search) {
  let obj = {};

  search = search.substring(1).split('&');

  for (let i = 0; i < search.length; i++) {
    let inner = search[i].split('=');
    obj[inner[0]] = inner[1];
  }

  return obj;
}