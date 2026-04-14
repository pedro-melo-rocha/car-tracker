#!/usr/bin/env node
// One-time import of data.json into Supabase.
// Usage: node --env-file=.env scripts/migrate.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env scripts/migrate.js');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const file = path.join(__dirname, '..', 'data.json');
  const raw = fs.readFileSync(file, 'utf8');
  const cars = JSON.parse(raw).map(car => ({
    ...car,
    status: ['sem-resposta', 'inativo'].includes(car.status) ? 'inactive' : (car.status || 'to-contact'),
    priceHistory: car.priceHistory || [],
    contactedAt: car.contactedAt || null
  }));

  console.log(`Loaded ${cars.length} cars from data.json`);

  const { data, error } = await supabase.from('cars').insert(cars).select();
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log(`Inserted ${data.length} cars into Supabase.`);
}

main();
