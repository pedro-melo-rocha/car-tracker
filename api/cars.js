const { randomUUID } = require('crypto');
const { supabase } = require('../lib/supabase');
const { requireSecret } = require('../lib/auth');
const { applyStaleness } = require('../lib/staleness');
const { carCreateSchema, formatZodError } = require('../lib/validation');
const { rateLimit } = require('../lib/rate-limit');

function serverError(res, scope, err) {
  console.error(`[cars] ${scope}:`, err);
  return res.status(500).json({ error: 'Internal error' });
}

module.exports = async (req, res) => {
  if (!requireSecret(req, res)) return;
  if (!rateLimit(req, res)) return;

  if (req.method === 'GET') {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .order('addedAt', { ascending: false });

    if (error) return serverError(res, 'list', error);

    const changed = applyStaleness(cars);
    if (changed.length > 0) {
      await Promise.all(
        changed.map(c =>
          supabase.from('cars')
            .update({ status: c.status })
            .eq('id', c.id)
            .eq('status', c.previousStatus)
        )
      );
    }

    return res.json(cars);
  }

  if (req.method === 'POST') {
    const parsed = carCreateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid input',
        issues: formatZodError(parsed.error)
      });
    }
    const body = parsed.data;
    const now = new Date().toISOString();
    const status = body.status || 'to-contact';
    const price = body.price ?? 0;
    const car = {
      id: randomUUID(),
      addedAt: now,
      url: body.url || '',
      title: body.title,
      make: body.make || '',
      model: body.model || '',
      year: body.year ?? 0,
      km: body.km ?? 0,
      price,
      fuel: body.fuel || '',
      engine: body.engine || '',
      power: body.power ?? 0,
      source: body.source || '',
      status,
      location: body.location || '',
      contactedAt: status === 'contacted' ? now : null,
      notes: body.notes || '',
      priceHistory: [{ date: now, price, note: 'Initial price' }],
      version: 1
    };

    const { data, error } = await supabase
      .from('cars')
      .insert(car)
      .select()
      .single();

    if (error) return serverError(res, 'insert', error);
    return res.status(201).json(data);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
