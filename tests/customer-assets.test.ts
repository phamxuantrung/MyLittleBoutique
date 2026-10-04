import { describe, expect, it } from 'vitest';
import { customerArtwork, customerArtworkIds } from '../src/art/customerAssets';
import { customers, products } from '../src/data/catalog';
import { avatarImage } from '../src/ui/format';
import { serveModal, socialPanel } from '../src/ui/panels';
import { customerCareModal } from '../src/ui/operationsPanel';
import { initialState } from '../src/systems/save';
import { registerCustomer } from '../src/systems/customerGen';

describe('customer artwork', () => {
  it('maps every authored customer to one unique normal-state image', () => {
    const customerIds = customers.map(customer => customer.id);
    const artwork = customerIds.map(id => customerArtwork(id));

    expect(customerIds).toHaveLength(20);
    expect(new Set(customerIds).size).toBe(20);
    expect(new Set(customerArtworkIds)).toEqual(new Set(customerIds));
    expect(artwork.every(Boolean)).toBe(true);
    expect(new Set(artwork).size).toBe(20);
  });

  it('keeps the advisor model fixed when selected products change and provides its happy state', () => {
    const customer = customers[0];
    const normal = avatarImage(customer);
    const dressed = avatarImage(customer, false, products.slice(0, 3));
    const happy = avatarImage(customer, true, products.slice(0, 3));

    expect(dressed).toBe(normal);
    expect(happy).not.toBe(normal);
    expect(normal).toContain('customer-art-external');
    expect(normal).toContain('data-outfit=""');
    expect(normal).toContain('/assets/characters/customers/01-lily.webp');
    expect(happy).toContain('/assets/characters/customers/01-lily-happy.webp');
  });

  it('uses the in-shop visual identity for a generated customer in advice', () => {
    const generated = { ...customers[0], id: 'generated-customer', name: 'Khách ngẫu nhiên' };
    registerCustomer(generated);
    const state = initialState();
    state.phase = 'open';
    state.activeVisits = [{ uid: 'generated-visit', customerId: generated.id, mode: 'advice', patience: 60, maxPatience: 60 }];
    state.currentVisitId = 'generated-visit';
    state.currentCustomerId = generated.id;
    state.customerMode = 'advice';
    state.patience = 60;

    const markup = serveModal(state, [], 'all', customers[1]);

    expect(markup).toContain('Khách ngẫu nhiên');
    expect(markup).toContain('/assets/characters/customers/02-emma.webp');
    expect(markup).not.toContain('data:image/svg+xml');
  });

  it('uses the new customer artwork for social and customer-care avatars', () => {
    const state = initialState();
    state.level = 5;
    state.posts = [{
      id: 'post-1', name: 'Người theo dõi', handle: '@outside.viewer', text: 'Dễ thương!',
      likes: 12, day: 1, viral: false, color: '#f7a8c4', reviewStars: 5,
      avatar: { id: 'legacy-generated-avatar', skin: '#fff0e6', hair: '#333333', outfit: '#f7a8c4', hairStyle: 1 },
    }];
    state.returnCases = [{
      id: 'return-1', productId: products[0].id, customerName: 'Khách chăm sóc', amount: 100000,
      reason: 'Muốn đổi kích cỡ', availableDay: 1, deadlineDay: 3,
    }];

    const social = socialPanel(state);
    const care = customerCareModal(state);

    expect(social).toMatch(/\/assets\/characters\/customers\/\d{2}-.+-happy\.webp/);
    expect(care).toMatch(/\/assets\/characters\/customers\/\d{2}-.+\.webp/);
    expect(`${social}${care}`).not.toContain('data:image/svg+xml');
  });
});
