import { describe, expect, it } from 'vitest';
import { EMPLOYEE_APPEARANCE_COUNT, employeeArtwork } from '../src/art/employeeAssets';
import { staffImage } from '../src/ui/format';
import { COURIER_APPEARANCE_COUNT, courierArtwork, courierImage } from '../src/art/courierAssets';
import { GameStore } from '../src/systems/store';
import { initialState, SaveSystem } from '../src/systems/save';
import type { GameState, StaffCandidate, StaffMember } from '../src/types';

class MemorySave extends SaveSystem { override write(_state: GameState) {} }

const candidate = (appearance: number): StaffCandidate => ({
  id: `candidate-${appearance}`, name: `Nhân viên ${appearance + 1}`, role: 'Tư vấn viên', bio: 'Nhân viên thử nghiệm.',
  appearance, salary: 100000, service: 70, persuasion: 70, charm: 70, reliability: 70, appliedDay: 1,
});

const employee = (appearance: number): StaffMember => ({
  ...candidate(appearance), uid: `employee-${appearance}`, hiredDay: 1, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0,
});

describe('employee artwork', () => {
  it('provides ten unique employee images', () => {
    const sources = Array.from({ length: EMPLOYEE_APPEARANCE_COUNT }, (_, appearance) => employeeArtwork(appearance));
    expect(EMPLOYEE_APPEARANCE_COUNT).toBe(10);
    expect(new Set(sources).size).toBe(10);
    expect(sources[0]).toBe('/assets/characters/employees/01.webp');
    expect(sources[9]).toBe('/assets/characters/employees/10.webp');
  });

  it('wraps appearance indexes and renders the new raster asset', () => {
    expect(employeeArtwork(10)).toBe(employeeArtwork(0));
    expect(employeeArtwork(-1)).toBe(employeeArtwork(9));
    expect(staffImage(4, 'Mai An')).toContain('src="/assets/characters/employees/05.webp"');
    expect(staffImage(4, 'Mai An')).not.toContain('data:image/svg+xml');
  });

  it('allows the tenth employee and rejects an eleventh employee', () => {
    const state = initialState();
    state.level = 3;
    state.landLevel = 2;
    state.employees = Array.from({ length: 9 }, (_, appearance) => employee(appearance));
    state.staffApplicants = [candidate(9)];
    const store = new GameStore(state, new MemorySave());
    expect(store.hireStaff('candidate-9')).toBe(true);
    expect(store.state.employees).toHaveLength(10);
    store.state.staffApplicants = [{ ...candidate(0), id: 'candidate-11' }];
    expect(store.hireStaff('candidate-11')).toBe(false);
    expect(store.state.employees).toHaveLength(10);
  });
});

describe('courier artwork', () => {
  it('provides and renders all three new courier images', () => {
    const sources = Array.from({ length: COURIER_APPEARANCE_COUNT }, (_, variant) => courierArtwork(variant));
    expect(COURIER_APPEARANCE_COUNT).toBe(3);
    expect(new Set(sources).size).toBe(3);
    expect(courierArtwork(-1)).toBe('/assets/characters/couriers/03.webp');
    expect(courierImage(1)).toContain('src="/assets/characters/couriers/02.webp"');
    expect(courierImage(1)).not.toContain('<svg');
  });
});
