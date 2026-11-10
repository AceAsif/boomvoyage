// Scene registry. To add a country: create one file next to this one
// (copy sydney.js as a start), import it here and add it to the list.

import sydney from './sydney.js';

export const scenes = [sydney];

export function getScene(id) {
  return scenes.find((s) => s.id === id) || scenes[0];
}
