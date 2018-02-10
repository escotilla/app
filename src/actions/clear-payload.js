import {
  CLEAR_PAYLOAD,
} from './action-types';

export function clearPayload(page) {
  return {
    type: CLEAR_PAYLOAD,
    page: page
  }
}