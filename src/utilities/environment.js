export function isNode() {
  return typeof process === 'object' && process.title && process.title === 'node';
}

export function hasWindow() {
  return typeof window !== 'undefined' && window !== null;
}

export function getApiUrl() {
  if (isNode() && process.env.NODE_ENV === 'production') {
    return 'http://34.198.157.92:81/api/';
  } else {
    return 'http://localhost:3000/api/';
  }
}

export function handleErrors(response) {
  if (response.success === false) {
    throw Error(response.error);
  }

  return response;
}