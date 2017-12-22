export function isNode() {
  return typeof process === 'object' && process.title && process.title === 'node';
}

export function hasWindow() {
  return typeof window !== 'undefined' && window !== null;
}

export function getApiUrl() {
    return 'http://flowerpunk-env.us-east-1.elasticbeanstalk.com';
}

export function handleErrors(response) {
  if (response.success === false) {
    throw Error(response.error);
  }

  return response;
}