const { supabase } = require('../../lib/supabase');
const { requireSecret } = require('../../lib/auth');
const { carUpdateSchema, formatZodError } = require('../../lib/validation');
const { rateLimit } = require('../../lib/rate-limit');

const EDITABLE_FIELDS = [
  'url', 'title', 'make', 'model', 'year', 'km', 'price',
  'fuel', 'engine', 'power', 'source', 'status', 'location', 'notes'
];

function serverError(res, scope, err) {
  console.error(`[cars/[id]] ${scope}:`, err);
  return res.status(500).json({ error: 'Internal error' });
}

module.exports = async (req, res) => {
  if (!requireSecret(req, res)) return;
  if (!rateLimit(req, res)) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    const parsed = carUpdateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid input',
        issues: formatZodError(parsed.error)
      });
    }
    const body = parsed.data;

    const { data: existing, error: fetchErr } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) return serverError(res, 'fetch', fetchErr);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (typeof body.version === 'number' && body.version !== existing.version) {
      return res.status(409).json({
        error: 'Version conflict — car was modified elsewhere. Reload and try again.',
        currentVersion: existing.version
      });
    }

    const car = { ...existing };
    const newPrice = body.price !== undefined ? body.price : car.price;
    const priceNote = body.priceNote || '';

    if (newPrice !== car.price) {
      car.priceHistory = [
        ...(car.priceHistory || []),
        {
          date: new Date().toISOString(),
          price: newPrice,
          note: priceNote || `Price changed from €${car.price} to €${newPrice}`
        }
      ];
    }

    for (const f of EDITABLE_FIELDS) {
      if (body[f] !== undefined) car[f] = body[f];
    }

    if (body.status === 'contacted' && existing.status !== 'contacted') {
      car.contactedAt = new Date().toISOString();
    }
    if (body.status && !['contacted', 'inactive'].includes(body.status)) {
      car.contactedAt = null;
    }

    delete car.priceNote;
    car.version = (existing.version || 1) + 1;

    let q = supabase.from('cars').update(car).eq('id', id);
    if (typeof body.version === 'number') {
      q = q.eq('version', body.version);
    }
    const { data, error } = await q.select().maybeSingle();

    if (error) return serverError(res, 'update', error);
    if (!data) {
      return res.status(409).json({
        error: 'Version conflict — car was modified elsewhere. Reload and try again.'
      });
    }
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    const { error, count } = await supabase
      .from('cars')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) return serverError(res, 'delete', error);
    if (count === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
