#!/usr/bin/env node
// Print 3 baseline cars (top/median/low score) with their computed score breakdowns.
// Usage: node --env-file=.env scripts/capture-baselines.mjs

import { createClient } from '@supabase/supabase-js';
import { computeScoreBreakdown } from '../src/lib/scoring/index.ts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
	console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
	process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: cars, error } = await supabase.from('cars').select('*');
if (error) {
	console.error(error);
	process.exit(1);
}

const scored = cars
	.map((c) => ({ car: c, b: computeScoreBreakdown(c) }))
	.sort((a, b) => b.b.total - a.b.total);

if (scored.length < 3) {
	console.error(`Need at least 3 cars; found ${scored.length}.`);
	process.exit(1);
}

const picks = [
	{ tag: 'high', ...scored[0] },
	{ tag: 'mid', ...scored[Math.floor(scored.length / 2)] },
	{ tag: 'low', ...scored[scored.length - 1] }
];

for (const { tag, car, b } of picks) {
	console.log('---');
	console.log(`[${tag}] ${car.title}`);
	console.log(`  id: ${car.id}`);
	console.log(`  inputs: make=${car.make} engine=${car.engine} year=${car.year} km=${car.km} price=${car.price} fuel=${car.fuel} location=${car.location}`);
	console.log(`  expected breakdown:`);
	console.log(`    total: ${b.total}`);
	console.log(`    km:    ${b.km}`);
	console.log(`    price: ${b.price}`);
	console.log(`    year:  ${b.year}`);
	console.log(`    loc:   ${b.loc}`);
	console.log(`    rel:   ${b.rel.score} (base ${b.rel.base}, delta ${b.rel.delta})`);
	if (b.rel.reason) console.log(`    rel reason: ${b.rel.reason}`);
}
