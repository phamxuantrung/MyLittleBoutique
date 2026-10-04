import { describe, expect, it } from 'vitest';
import { customers, products } from '../src/data/catalog';
import { evaluateStaffAdvice, staffAdviceProfile, staffStockProfile } from '../src/systems/rules';
import { initialState } from '../src/systems/save';
import type { StaffMember } from '../src/types';

const employee = (service: number, persuasion: number, reliability: number, skillLevel: number): StaffMember => ({
  id: 'test', uid: `test-${service}`, name: 'Test', role: 'Stylist', bio: '', appearance: 0,
  salary: 100000, service, persuasion, charm: 70, reliability, appliedDay: 1, hiredDay: 1,
  morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, skillLevel, assignment: 'service',
});

describe('staff outfit advice', () => {
  it('scales outfit size and budget target with employee skill', () => {
    const state = initialState();
    for (const product of products) state.inventory[product.id] = 5;
    state.layout = [{ id: 'rack-sunday', uid: 'test-rack', x: 0, y: 0, rotation: 0, displayItems: products.map(product => product.id) }];
    const customer = { ...customers[0], budget: 1_500_000, personality: 'VIP' as const };
    const junior = employee(25, 25, 35, 1);
    const expert = employee(96, 96, 95, 15);
    const juniorResult = evaluateStaffAdvice(state, customer, junior);
    const expertResult = evaluateStaffAdvice(state, customer, expert);
    expect(juniorResult.items.length).toBeGreaterThanOrEqual(2);
    expect(juniorResult.items.length).toBeLessThanOrEqual(staffAdviceProfile(junior).maxItems);
    expect(expertResult.items.length).toBeGreaterThanOrEqual(juniorResult.items.length);
    expect(expertResult.items.length).toBeLessThanOrEqual(5);
    expect(expertResult.total).toBeLessThanOrEqual(customer.budget);
    expect(expertResult.total / customer.budget).toBeGreaterThanOrEqual(.7);
    expect(expertResult.total / customer.budget).toBeLessThanOrEqual(.98);
    expect(Math.abs(expertResult.total / customer.budget - staffAdviceProfile(expert).targetBudgetRatio))
      .toBeLessThanOrEqual(Math.abs(juniorResult.total / customer.budget - staffAdviceProfile(junior).targetBudgetRatio));
  });

  it('makes a reliable experienced warehouse employee faster and more energy efficient', () => {
    const junior = staffStockProfile(employee(25, 25, 35, 1));
    const expert = staffStockProfile(employee(75, 70, 95, 15));
    expect(expert.packingEnergyPerOrder).toBeLessThan(junior.packingEnergyPerOrder);
    expect(expert.deliveryDaysSaved).toBeGreaterThan(junior.deliveryDaysSaved);
    expect(expert.packingPriority).toBeGreaterThan(junior.packingPriority);
  });
});
