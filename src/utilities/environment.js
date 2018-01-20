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