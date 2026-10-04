const CUSTOMER_ART_BASE = '/assets/characters/customers';

const customerArtworkById: Readonly<Record<string, string>> = {
  lily: '01-lily.webp',
  emma: '02-emma.webp',
  sophie: '03-sophie.webp',
  mia: '04-mia.webp',
  zoe: '05-zoe.webp',
  ruby: '06-ruby.webp',
  kai: '07-kai.webp',
  linh: '08-linh.webp',
  an: '09-an.webp',
  bao: '10-bao.webp',
  chloe: '11-chloe.webp',
  nari: '12-nari.webp',
  jade: '13-jade.webp',
  nhi: '14-nhi.webp',
  vy: '15-vy.webp',
  rina: '16-rina.webp',
  may: '17-may.webp',
  thu: '18-thu.webp',
  'zoe-offroute': '19-zoe-offroute.webp',
  elle: '20-elle.webp',
};

/** Fixed normal-state artwork for the 20 authored customer profiles. */
export const customerArtwork = (customerId: string, mood: 'normal' | 'happy' = 'normal'): string | undefined => {
  const filename = customerArtworkById[customerId];
  if (!filename) return undefined;
  const moodFilename = mood === 'happy' ? filename.replace(/\.webp$/, '-happy.webp') : filename;
  return `${CUSTOMER_ART_BASE}/${moodFilename}`;
};

export const customerArtworkIds = Object.freeze(Object.keys(customerArtworkById));
