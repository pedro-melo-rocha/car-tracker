const { supabase } = require('../../lib/supabase');
const { requireSecret } = require('../../lib/auth');

const EDITABLE_FIELDS = ['url', 'title', 'make', 'model', 'year', 'km', 'price', 'fuel', 'engine', 'power', 'source', 'status', 'location', 'notes'];
const NUMERIC_FIELDS = new Set(['year', 'km', 'price', 'power']);

module.exports = async (req, res) => {
  if (!requireSecret(req, res)) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { data: existing, error: fetchErr } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const body = req.body;
    const car = { ...existing };

    const newPrice = body.price !== undefined ? Number(body.price) : car.price;
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
      if (body[f] !== undefined) {
        car[f] = NUMERIC_FIELDS.has(f) ? Number(body[f]) : body[f];
      }
    }

    if (body.status === 'contacted') {
      car.contactedAt = new Date().toISOString();
    }
    if (body.status && !['contacted', 'inactive'].includes(body.status)) {
      car.contactedAt = null;
    }

    delete car.priceNote;

    const { data, error } = await supabase
      .from('cars')
      .update(car)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    const { error, count } = await supabase
      .from('cars')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    if (count === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
