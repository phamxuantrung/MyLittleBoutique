import type { Product } from '../types';

const atelierArtwork: Record<string, string> = {
  'atelier-cloud-tee': '/assets/atelier/products/cloud-tee.png',
  'atelier-linen-poet': '/assets/atelier/products/linen-poet.png',
  'atelier-indigo-street': '/assets/atelier/products/indigo-street.png',
  'atelier-ribbon-dream': '/assets/atelier/products/ribbon-dream.png',
  'atelier-merino-prep': '/assets/atelier/products/merino-prep.png',
  'atelier-silk-minimal': '/assets/atelier/products/silk-minimal.png',
  'atelier-nappa-bag': '/assets/atelier/products/nappa-bag.png',
  'atelier-wool-grunge': '/assets/atelier/products/wool-grunge.png',
  'atelier-aurora-couture': '/assets/atelier/products/aurora-couture.png',
  'atelier-cashmere-clean': '/assets/atelier/products/cashmere-clean.png',
};

/**
 * Optimized product artwork can replace catalogue renderers one category at a
 * time. File names are stable so artwork can be revised without touching data.
 */
const topArtworkFiles: Record<string, string> = {
  'ribbon-kiss-tee': '01-ribbon-kiss-tee.webp',
  'urban-pulse-hoodie': '03-urban-pulse-hoodie.webp',
  'pure-line-tee': '04-pure-line-tee.webp',
  'daily-sky-shirt': '05-daily-sky-shirt.webp',
  'ivy-prep-knit': '06-ivy-prep-knit.webp',
  'retro-rose-blouse': '07-retro-rose-blouse.webp',
  'stage-spark-top': '08-stage-spark-top.webp',
  'mocha-luxe-corset-blouse': '10-mocha-luxe-corset-blouse.webp',
  'pearl-kiss-camisole': '12-pearl-kiss-camisole.webp',
  'rose-whisper-offshoulder': '13-rose-whisper-offshoulder.webp',
  'lavender-haze-offshoulder': '14-lavender-haze-offshoulder.webp',
  'city-girls-jersey': '15-city-girls-jersey.webp',
  'vintage-maison-rose-corset': '16-maison-rose-corset.webp',
};

const topArtworkModules = import.meta.glob<string>('../assets/products/tops/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const topArtworkByFile = new Map(
  Object.entries(topArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

const bottomArtworkFiles: Record<string, string> = {
  'cloud-sky-jeans': '01-cloud-sky-jeans.webp',
  'cloud-nine-skirt': '02-cloud-nine-skirt.webp',
  'downtown-cargo': '03-downtown-cargo.webp',
  'blue-hour-wide-jeans': '04-blue-hour-wide-jeans.webp',
  'daily-muse-straight-jeans': '05-daily-muse-straight-jeans.webp',
  'matcha-utility-cargo': '06-matcha-utility-cargo.webp',
  'picnic-day-shorts': '07-picnic-day-shorts.webp',
  'ribbon-campus-skirt': '08-ribbon-campus-skirt.webp',
  'cocoa-edit-skirt': '09-cocoa-edit-skirt.webp',
  'campus-crush-skirt': '10-campus-crush-skirt.webp',
};

const bottomArtworkModules = import.meta.glob<string>('../assets/products/bottoms/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const bottomArtworkByFile = new Map(
  Object.entries(bottomArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

const dressArtworkFiles: Record<string, string> = {
  'ribbon-dress': '01-sunday-date.webp',
  vintage: '02-golden-hour.webp',
  silk: '03-moonlight.webp',
  'atelier-mini-dress': '04-mini-pink-spotlight.webp',
  'atelier-maxi-dress': '05-maxi-garden-waltz.webp',
  'blue-slip': '06-slip-cool-blue.webp',
  'meadow-maxi': '07-maxi-meadow-muse.webp',
  'lace-maxi': '08-maxi-golden-lace.webp',
  'nocturne-velvet-dress': '09-midnight-column.webp',
  'global-runway-gown': '10-runway-aurora.webp',
};

const dressArtworkModules = import.meta.glob<string>('../assets/products/dresses/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const dressArtworkByFile = new Map(
  Object.entries(dressArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

const accessoryArtworkFiles: Record<string, string> = {
  ribbon: '01-ballet-bow.webp',
  'pearl-necklace': '02-tiny-pearls.webp',
  'oval-sunnies': '03-oval-sunnies.webp',
  'club-cap': '04-club-cap.webp',
  'leg-warmers': '05-cloud-leg-warmers.webp',
  'daisy-clips': '06-daisy-clips.webp',
  'pearl-headband': '07-pearl-headband.webp',
  'satin-bow': '08-satin-bow.webp',
  'heart-choker': '09-heart-choker.webp',
  'pearl-earrings': '10-pearl-drop-earrings.webp',
  'charm-bracelet': '11-lucky-charms.webp',
  'heart-glasses': '12-heart-glasses.webp',
  'wire-glasses': '13-wire-glasses.webp',
  'ribbon-beret': '14-ribbon-beret.webp',
  'star-bucket-hat': '15-star-bucket-hat.webp',
  'maison-pearl-choker': '16-maison-pearl-choker.webp',
  'global-halo-glasses': '17-global-halo-glasses.webp',
};

const accessoryArtworkModules = import.meta.glob<string>('../assets/products/accessories/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const accessoryArtworkByFile = new Map(
  Object.entries(accessoryArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

const shoeArtworkFiles: Record<string, string> = {
  sneakers: '01-oat-sneakers.webp',
  loafers: '02-editor-loafers.webp',
  'atelier-sneakers': '03-candy-runner.webp',
  'ballet-flats': '04-ribbon-rehearsal.webp',
  'mary-janes': '05-after-school.webp',
  'retro-sneakers': '06-retro-cloud.webp',
  'ballet-sneakers': '07-ballet-pirouette.webp',
  'slim-sneakers': '08-low-profile.webp',
  'platform-sneakers': '09-platform-crush.webp',
  'loafer-mules': '10-loafer-mule.webp',
  'kitten-heels': '11-kitten-heel.webp',
  slingbacks: '12-slingback-muse.webp',
  'ribbon-sandals': '13-daisy-ribbon-sandal.webp',
  'fisherman-sandals': '14-fisherman-diary.webp',
  'chunky-boots': '15-midnight-rebel-boots.webp',
  'chelsea-boots': '16-library-walk-boots.webp',
  'western-boots': '17-desert-bloom-boots.webp',
  'trail-shoes': '18-trail-day.webp',
  'mesh-flats': '19-mesh-whisper.webp',
  'patent-mary-janes': '20-cherry-gloss.webp',
};

const shoeArtworkModules = import.meta.glob<string>('../assets/products/shoes/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const shoeArtworkByFile = new Map(
  Object.entries(shoeArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

const bagArtworkFiles: Record<string, string> = {
  bag: '01-little-baguette.webp',
  'pearl-bag': '02-pearl-muse.webp',
  'canvas-tote': '03-everyday-poetry.webp',
  'nylon-crescent': '04-city-stroll.webp',
  'ribbon-bag': '05-little-bow.webp',
  'east-west-bag': '06-blue-hour.webp',
  'bowling-bag': '07-bowling-club.webp',
  'bucket-bag': '08-oat-milk.webp',
  'suede-hobo': '09-suede-stories.webp',
  'chain-bag': '10-after-dark.webp',
  'mini-handle': '11-tea-time.webp',
  'utility-bag': '12-trail-pocket.webp',
  'book-tote': '13-chapter-one.webp',
  'satchel-bag': '14-library-date.webp',
  'crochet-bag': '15-wildflower.webp',
  'metallic-pouch': '16-silver-encore.webp',
  'charm-bag': '17-charm-diary.webp',
  'fringe-bag': '18-golden-dunes.webp',
  'heart-bag': '19-heart-to-heart.webp',
  'sculpture-clutch': '20-sculpted-moon.webp',
};

const bagArtworkModules = import.meta.glob<string>('../assets/products/bags/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const bagArtworkByFile = new Map(
  Object.entries(bagArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

const outerwearArtworkFiles: Record<string, string> = {
  blazer: '01-blazer-atelier.webp',
  'atelier-cardigan': '02-strawberry-cream.webp',
  'atelier-blazer': '03-vanilla-office.webp',
  'cloud-cardigan': '04-strawberry-cloud.webp',
  'rebel-jacket': '05-rebel-heart.webp',
  'poet-trench': '06-autumn-letters.webp',
  'nocturne-trench': '07-eclipse-atelier.webp',
  'mint-mellow-cardigan': '08-mint-mellow-cardigan.webp',
};

const outerwearArtworkModules = import.meta.glob<string>('../assets/products/outerwear/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const outerwearArtworkByFile = new Map(
  Object.entries(outerwearArtworkModules).map(([path, url]) => [path.split('/').pop()!, url]),
);

export function externalProductArtwork(product: Pick<Product, 'id' | 'category' | 'art'>): string | undefined {
  const atelierFile = atelierArtwork[product.art];
  if (atelierFile) return atelierFile;
  if (product.category === 'tops') {
    const file = topArtworkFiles[product.id];
    return file ? topArtworkByFile.get(file) : undefined;
  }
  if (product.category === 'bottoms') {
    const file = bottomArtworkFiles[product.id];
    return file ? bottomArtworkByFile.get(file) : undefined;
  }
  if (product.category === 'dresses') {
    const file = dressArtworkFiles[product.id];
    return file ? dressArtworkByFile.get(file) : undefined;
  }
  if (product.category === 'accessories') {
    const file = accessoryArtworkFiles[product.id];
    return file ? accessoryArtworkByFile.get(file) : undefined;
  }
  if (product.category === 'shoes') {
    const file = shoeArtworkFiles[product.id];
    return file ? shoeArtworkByFile.get(file) : undefined;
  }
  if (product.category === 'bags') {
    const file = bagArtworkFiles[product.id];
    return file ? bagArtworkByFile.get(file) : undefined;
  }
  if (product.category === 'outerwear') {
    const file = outerwearArtworkFiles[product.id];
    return file ? outerwearArtworkByFile.get(file) : undefined;
  }
  return undefined;
}
