import type { CashDrawer } from '../types';

export const CASH_DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000] as const;

export function initialCashDrawer(): CashDrawer {
  return { '500000': 0, '200000': 1, '100000': 1, '50000': 2, '20000': 2, '10000': 3, '5000': 2, '2000': 5, '1000': 10 };
}

export function cashDrawerTotal(drawer: CashDrawer) {
  return CASH_DENOMINATIONS.reduce((sum, value) => sum + value * Math.max(0, Math.floor(drawer[String(value)] ?? 0)), 0);
}

export function normalizeCashDrawer(value: unknown): CashDrawer {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : initialCashDrawer();
  return Object.fromEntries(CASH_DENOMINATIONS.map(value => {
    const count = Number(source[String(value)]);
    return [String(value), Number.isFinite(count) ? Math.max(0, Math.min(999, Math.floor(count))) : 0];
  }));
}

const emptyDrawer = (): CashDrawer => Object.fromEntries(CASH_DENOMINATIONS.map(value => [String(value), 0])) as CashDrawer;
const noteCount = (drawer: CashDrawer) => CASH_DENOMINATIONS.reduce((sum, value) => sum + (drawer[String(value)] ?? 0), 0);
const tenderKey = (drawer: CashDrawer) => CASH_DENOMINATIONS.map(value => drawer[String(value)] ?? 0).join(':');

/**
 * Builds a small set of believable ways a customer may cover a bill, then
 * chooses one once for the visit. More expensive bundles with at least as many
 * notes as a cheaper bundle are discarded, so 60k may be 50k+10k, 100k, or
 * 2×50k, while a wasteful 3×50k option is never offered.
 */
export function customerTender(total: number, random?: () => number): CashDrawer {
  const due = Math.max(0, Math.ceil(total / 1000) * 1000);
  if (!due) return emptyDrawer();
  // A customer may reasonably hand over one large note (for example 500k for
  // a 60k bill), but repeated notes always use the minimum count that covers it.
  const maxOverpay = 500000;
  const candidates = new Map<string, CashDrawer>();
  const addCandidate = (drawer: CashDrawer) => {
    const amount = drawerAmount(drawer);
    if (amount < due || amount > due + maxOverpay || noteCount(drawer) > 12) return;
    candidates.set(tenderKey(drawer), drawer);
  };
  const greedy = (amount: number) => {
    let remaining = amount;
    const drawer = emptyDrawer();
    for (const value of CASH_DENOMINATIONS) {
      const count = Math.floor(remaining / value);
      drawer[String(value)] = count;
      remaining -= count * value;
    }
    return drawer;
  };

  addCandidate(greedy(due));
  for (const value of CASH_DENOMINATIONS) {
    const count = Math.ceil(due / value);
    if (count <= 4) {
      const repeated = emptyDrawer();
      repeated[String(value)] = count;
      addCandidate(repeated);
    }
    const rounded = Math.ceil(due / value) * value;
    addCandidate(greedy(rounded));
  }

  const plausible = [...candidates.values()]
    .sort((a, b) => drawerAmount(a) - drawerAmount(b) || noteCount(a) - noteCount(b));

  if (!random) {
    const roundedSingle = plausible.find(candidate => noteCount(candidate) === 1 && drawerAmount(candidate) > due);
    return roundedSingle ?? plausible[0] ?? greedy(due);
  }
  const weights = plausible.map(candidate => {
    const excessRatio = (drawerAmount(candidate) - due) / Math.max(due, 10000);
    return 1 / (1 + noteCount(candidate) * .32 + excessRatio * .7);
  });
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let roll = Math.max(0, Math.min(.999999, random())) * weightTotal;
  for (let index = 0; index < plausible.length; index++) {
    roll -= weights[index];
    if (roll <= 0) return plausible[index];
  }
  return plausible.at(-1) ?? greedy(due);
}

export function drawerAmount(drawer: CashDrawer) { return cashDrawerTotal(drawer); }
export function canRemoveNotes(drawer: CashDrawer, notes: CashDrawer) {
  return CASH_DENOMINATIONS.every(value => (drawer[String(value)] ?? 0) >= (notes[String(value)] ?? 0));
}
export function addNotes(drawer: CashDrawer, notes: CashDrawer, direction: 1 | -1 = 1) {
  for (const value of CASH_DENOMINATIONS) {
    const key = String(value);
    drawer[key] = Math.max(0, Math.floor((drawer[key] ?? 0) + direction * (notes[key] ?? 0)));
  }
}
export function makeChange(drawer: CashDrawer, amount: number): CashDrawer | undefined {
  let remaining = Math.max(0, Math.round(amount / 1000) * 1000);
  const result = Object.fromEntries(CASH_DENOMINATIONS.map(value => [String(value), 0])) as CashDrawer;
  for (const value of CASH_DENOMINATIONS) {
    const count = Math.min(Math.floor(remaining / value), Math.max(0, drawer[String(value)] ?? 0));
    result[String(value)] = count;
    remaining -= value * count;
  }
  return remaining === 0 ? result : undefined;
}
