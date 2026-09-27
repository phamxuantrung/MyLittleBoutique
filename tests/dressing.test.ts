import { expect, it } from 'vitest';
import { customers, products } from '../src/data/catalog';
import { characterSvg } from '../src/art/svg';
import { renderDressedCustomerLayers } from '../src/art/characters';

it('draws sleeves over arms and hands over sleeves for every character model', () => {
  const hoodie = products.find(p => p.id === 'hoodie')!;
  for (const id of ['lily', 'emma', 'sophie', 'mia', 'zoe', 'ruby']) {
    const svg = characterSvg(customers.find(c => c.id === id)!, 'normal', false, [hoodie]);
    const arms = svg.indexOf('data-body-layer="arms"');
    const top = svg.indexOf('data-worn="hoodie"');
    const hands = svg.indexOf('data-body-layer="hands"');
    expect(arms).toBeGreaterThan(-1);
    expect(top).toBeGreaterThan(arms);
    expect(hands).toBeGreaterThan(top);
    expect(svg).toContain('data-preview-basic="underwear"');
  }
});

it('only draws skin below trouser cuffs, dress hems and set hems', () => {
  const cases = [
    { product: products.find(p => p.id === 'jeans')!, hem: 142 },
    { product: products.find(p => p.id === 'ribbon-dress')!, hem: 104 },
    { product: products.find(p => p.category === 'sets' && p.subcategory === 'pantsSet')!, hem: 142 },
    { product: products.find(p => p.category === 'sets' && p.subcategory === 'skirtSet')!, hem: 101 },
  ];
  for (const { product, hem } of cases) {
    const layers = renderDressedCustomerLayers([product], '#fff0e6');
    expect(layers.body).toContain(`data-exposed="legs" x="0" y="${hem}"`);
    expect(layers.undergarments).not.toContain('data-preview-basic="underwear"');
    if (product.category !== 'bottoms') expect(layers.body).not.toContain('data-exposed="torso"');
  }
});

it('keeps only wrists for a hoodie, forearms for a tee, and underwear when legs are uncovered', () => {
  for (const [id, cuff] of [['hoodie', 90], ['baby-tee', 75]] as const) {
    const layers = renderDressedCustomerLayers([products.find(p => p.id === id)!], '#fff0e6');
    expect(layers.arms).toContain(`data-exposed="arms" x="0" y="${cuff}"`);
    expect(layers.body).not.toContain('data-exposed="torso"');
    expect(layers.undergarments).toContain('data-preview-basic="underwear"');
  }
});

it('omits underwear and the default body under selected bottoms and dresses', () => {
  const customer = customers[0];
  for (const id of ['jeans', 'ribbon-dress']) {
    const svg = characterSvg(customer, 'normal', false, [products.find(p => p.id === id)!]);
    expect(svg).not.toContain('data-preview-basic="underwear"');
    expect(svg).toContain('data-body-layer="exposed-body"');
    expect(svg).toContain(`data-worn="${id}"`);
  }
});
