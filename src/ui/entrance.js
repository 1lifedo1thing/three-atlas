const KEY = 'three-atlas.entrance';
let claimed = false;

/** A session claim survives navigation and reload; memory also handles blocked storage on rerender. */
export function claimEntrance() {
  if (claimed) return false;
  claimed = true;
  try {
    if (sessionStorage.getItem(KEY) === 'seen') return false;
    sessionStorage.setItem(KEY, 'seen');
  } catch { /* Storage is optional; this document still only enters once. */ }
  return true;
}
