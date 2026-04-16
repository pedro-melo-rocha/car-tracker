import { describe, it, expect } from 'vitest';
import { applyStaleness, STALE_AFTER_DAYS } from '../staleness.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days, now = Date.now()) {
  return new Date(now - days * DAY_MS).toISOString();
}

describe('applyStaleness', () => {
  it('returns empty list for fresh-contacted cars', () => {
    const now = Date.now();
    const cars = [
      { id: '1', status: 'contacted', contactedAt: isoDaysAgo(0, now) },
      { id: '2', status: 'contacted', contactedAt: isoDaysAgo(1, now) },
      { id: '3', status: 'contacted', contactedAt: isoDaysAgo(2, now) },
    ];
    expect(applyStaleness(cars, now)).toEqual([]);
    expect(cars.every(c => c.status === 'contacted')).toBe(true);
  });

  it('flips to inactive once exactly at the staleness threshold', () => {
    const now = Date.now();
    const cars = [
      { id: '1', status: 'contacted', contactedAt: isoDaysAgo(STALE_AFTER_DAYS, now) },
    ];
    const changed = applyStaleness(cars, now);
    expect(changed).toEqual([{ id: '1', status: 'inactive', previousStatus: 'contacted' }]);
    expect(cars[0].status).toBe('inactive');
  });

  it('leaves non-contacted statuses alone even when old', () => {
    const now = Date.now();
    const cars = [
      { id: '1', status: 'to-contact', contactedAt: null },
      { id: '2', status: 'negotiating', contactedAt: isoDaysAgo(30, now) },
      { id: '3', status: 'bought', contactedAt: isoDaysAgo(30, now) },
      { id: '4', status: 'rejected', contactedAt: isoDaysAgo(30, now) },
    ];
    expect(applyStaleness(cars, now)).toEqual([]);
  });

  it('migrates legacy sem-resposta and inativo statuses to inactive', () => {
    const now = Date.now();
    const cars = [
      { id: '1', status: 'sem-resposta', contactedAt: isoDaysAgo(10, now) },
      { id: '2', status: 'inativo', contactedAt: null },
    ];
    const changed = applyStaleness(cars, now);
    expect(changed).toHaveLength(2);
    expect(cars.map(c => c.status)).toEqual(['inactive', 'inactive']);
    expect(changed[0].previousStatus).toBe('sem-resposta');
    expect(changed[1].previousStatus).toBe('inativo');
  });

  it('does not re-flip an already inactive car', () => {
    const now = Date.now();
    const cars = [
      { id: '1', status: 'inactive', contactedAt: isoDaysAgo(10, now) },
    ];
    expect(applyStaleness(cars, now)).toEqual([]);
  });

  it('ignores cars without contactedAt', () => {
    const now = Date.now();
    const cars = [
      { id: '1', status: 'contacted', contactedAt: null },
    ];
    expect(applyStaleness(cars, now)).toEqual([]);
    expect(cars[0].status).toBe('contacted');
  });
});
