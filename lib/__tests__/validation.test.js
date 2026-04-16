import { describe, it, expect } from 'vitest';
import { carCreateSchema, carUpdateSchema } from '../validation.js';

describe('carCreateSchema', () => {
  it('accepts a minimal valid car with just a title', () => {
    const r = carCreateSchema.safeParse({ title: 'Clio 1.5 dCi' });
    expect(r.success).toBe(true);
  });

  it('rejects missing title', () => {
    const r = carCreateSchema.safeParse({ make: 'Renault' });
    expect(r.success).toBe(false);
  });

  it('rejects empty title', () => {
    const r = carCreateSchema.safeParse({ title: '' });
    expect(r.success).toBe(false);
  });

  it('rejects negative price', () => {
    const r = carCreateSchema.safeParse({ title: 'Car', price: -1 });
    expect(r.success).toBe(false);
  });

  it('rejects out-of-range year', () => {
    const r = carCreateSchema.safeParse({ title: 'Car', year: 1800 });
    expect(r.success).toBe(false);
    const r2 = carCreateSchema.safeParse({ title: 'Car', year: 3000 });
    expect(r2.success).toBe(false);
  });

  it('coerces numeric strings for year/km/price/power', () => {
    const r = carCreateSchema.safeParse({
      title: 'Car',
      year: '2010',
      km: '120000',
      price: '5500',
      power: '90',
    });
    expect(r.success).toBe(true);
    expect(r.data.year).toBe(2010);
    expect(r.data.price).toBe(5500);
  });

  it('rejects unknown status values', () => {
    const r = carCreateSchema.safeParse({ title: 'Car', status: 'bought-maybe' });
    expect(r.success).toBe(false);
  });

  it('accepts all defined status values', () => {
    const statuses = ['to-contact', 'contacted', 'inactive', 'negotiating', 'rejected', 'bought'];
    for (const status of statuses) {
      const r = carCreateSchema.safeParse({ title: 'Car', status });
      expect(r.success).toBe(true);
    }
  });

  it('rejects unknown fields', () => {
    const r = carCreateSchema.safeParse({ title: 'Car', magicField: 'x' });
    expect(r.success).toBe(false);
  });
});

describe('carUpdateSchema', () => {
  it('accepts an empty update', () => {
    const r = carUpdateSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('accepts a priceNote (transient field)', () => {
    const r = carUpdateSchema.safeParse({ priceNote: 'Dropped', price: 4500 });
    expect(r.success).toBe(true);
  });

  it('accepts version for optimistic locking', () => {
    const r = carUpdateSchema.safeParse({ version: 3, price: 4500 });
    expect(r.success).toBe(true);
    expect(r.data.version).toBe(3);
  });

  it('rejects negative version', () => {
    const r = carUpdateSchema.safeParse({ version: -1 });
    expect(r.success).toBe(false);
  });
});
