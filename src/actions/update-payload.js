import {
  UPDATE_PAYLOAD,
} from './action-types';

export function updatePayload(id, page, text) {
  return {
    type: UPDATE_PAYLOAD,
    id: id,
    page: page,
    text: text
  }
}