const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/cars', (req, res) => {
  const cars = readData();
  const now = Date.now();
  let dirty = false;

  cars.forEach(car => {
    // Migrate legacy status values
    if (car.status === 'sem-resposta' || car.status === 'inativo') {
      car.status = 'inactive';
      dirty = true;
    }

    if (!car.contactedAt) return;
    const contactedMs = new Date(car.contactedAt).getTime();
    const daysSinceContact = (now - contactedMs) / (1000 * 60 * 60 * 24);

    if (car.status === 'contacted' && daysSinceContact >= 3) {
      car.status = 'inactive';
      dirty = true;
    }
  });

  if (dirty) writeData(cars);
  res.json(cars);
});

app.post('/api/cars', (req, res) => {
  const cars = readData();
  const car = {
    id: String(Date.now()),
    addedAt: new Date().toISOString(),
    url: req.body.url || '',
    title: req.body.title || '',
    make: req.body.make || '',
    model: req.body.model || '',
    year: Number(req.body.year) || 0,
    km: Number(req.body.km) || 0,
    price: Number(req.body.price) || 0,
    fuel: req.body.fuel || '',
    source: req.body.source || '',
    status: req.body.status || 'to-contact',
    location: req.body.location || '',
    contactedAt: req.body.status === 'contacted' ? new Date().toISOString() : null,
    notes: req.body.notes || '',
    priceHistory: [
      { date: new Date().toISOString(), price: Number(req.body.price) || 0, note: 'Initial price' }
    ]
  };
  cars.push(car);
  writeData(cars);
  res.status(201).json(car);
});

app.put('/api/cars/:id', (req, res) => {
  const cars = readData();
  const idx = cars.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const car = cars[idx];
  const newPrice = req.body.price !== undefined ? Number(req.body.price) : car.price;
  const priceNote = req.body.priceNote || '';

  if (newPrice !== car.price) {
    car.priceHistory.push({
      date: new Date().toISOString(),
      price: newPrice,
      note: priceNote || `Price changed from €${car.price} to €${newPrice}`
    });
  }

  const fields = ['url', 'title', 'make', 'model', 'year', 'km', 'price', 'fuel', 'source', 'status', 'location', 'notes'];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      car[f] = ['year', 'km', 'price'].includes(f) ? Number(req.body[f]) : req.body[f];
    }
  }

  // Refresh contactedAt whenever status is explicitly set to 'contacted'
  // This resets the staleness clock on rollbacks (e.g. sem-resposta → contacted)
  if (req.body.status === 'contacted') {
    car.contactedAt = new Date().toISOString();
  }

  // Clear contactedAt if status is manually moved out of the staleness chain
  if (req.body.status && !['contacted', 'inactive'].includes(req.body.status)) {
    car.contactedAt = null;
  }

  delete car.priceNote;
  cars[idx] = car;
  writeData(cars);
  res.json(car);
});

app.delete('/api/cars/:id', (req, res) => {
  let cars = readData();
  const len = cars.length;
  cars = cars.filter(c => c.id !== req.params.id);
  if (cars.length === len) return res.status(404).json({ error: 'Not found' });
  writeData(cars);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }
  console.log(`Car Tracker running on http://${localIP}:${PORT}`);
});
