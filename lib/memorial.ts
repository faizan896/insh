/** Change the tribute copy here; no personal dates or details are assumed. */
export const memorial = {
  name: "Insha",
  subtitle: "The Brightest Star",
  line: "Some stars leave the earth, but never leave our sky.",
  prayer: "Inna lillahi wa inna ilayhi raji‘un.",
  prayerTranslation: "Indeed, we belong to Allah, and to Him we return.",
};

export function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
