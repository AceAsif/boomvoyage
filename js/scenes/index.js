// Scene registry. To add a place: create one file next to this one
// (copy sydney.js as a start), import it here and add it to the list.
// The first scene in the list is the default.

import sydney from './sydney.js';
import dubai from './dubai.js';
import paris from './paris.js';
import london from './london.js';
import newyork from './newyork.js';

export const scenes = [sydney, dubai, paris, london, newyork];

export function getScene(id) {
  return scenes.find((s) => s.id === id) || scenes[0];
}
