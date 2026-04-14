const { supabase } = require('../lib/supabase');
const { requireSecret } = require('../lib/auth');
const { applyStaleness } = require('../lib/staleness');

module.exports = async (req, res) => {
  if (!requireSecret(req, res)) return;

  if (req.method === 'GET') {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .order('addedAt', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const changed = applyStaleness(cars);
    if (changed.length > 0) {
      await Promise.all(
        changed.map(c =>
          supabase.from('cars').update({ status: c.status }).eq('id', c.id)
        )
      );
    }

    return res.json(cars);
  }

  if (req.method === 'POST') {
    const body = req.body;
    const now = new Date().toISOString();
    const car = {
      id: String(Date.now()),
      addedAt: now,
      url: body.url || '',
      title: body.title || '',
      make: body.make || '',
      model: body.model || '',
      year: Number(body.year) || 0,
      km: Number(body.km) || 0,
      price: Number(body.price) || 0,
      fuel: body.fuel || '',
      engine: body.engine || '',
      power: Number(body.power) || 0,
      source: body.source || '',
      status: body.status || 'to-contact',
      location: body.location || '',
      contactedAt: body.status === 'contacted' ? now : null,
      notes: body.notes || '',
      priceHistory: [
        { date: now, price: Number(body.price) || 0, note: 'Initial price' }
      ]
    };

    const { data, error } = await supabase
      .from('cars')
      .insert(car)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
