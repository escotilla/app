import {
  UPDATE_PAYLOAD,
} from './action-types';

export function updatePayload(id, text) {
  return {
    type: UPDATE_PAYLOAD,
    id: id,
    text: text
  }
}