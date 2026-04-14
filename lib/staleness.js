function applyStaleness(cars) {
  const now = Date.now();
  const changed = [];

  for (const car of cars) {
    let dirty = false;

    if (car.status === 'sem-resposta' || car.status === 'inativo') {
      car.status = 'inactive';
      dirty = true;
    }

    if (car.contactedAt) {
      const contactedMs = new Date(car.contactedAt).getTime();
      const days = (now - contactedMs) / (1000 * 60 * 60 * 24);
      if (car.status === 'contacted' && days >= 3) {
        car.status = 'inactive';
        dirty = true;
      }
    }

    if (dirty) changed.push({ id: car.id, status: car.status });
  }

  return changed;
}

module.exports = { applyStaleness };
