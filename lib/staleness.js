const STALE_AFTER_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function applyStaleness(cars, now = Date.now()) {
  const changed = [];

  for (const car of cars) {
    const previousStatus = car.status;
    let dirty = false;

    if (car.status === 'sem-resposta' || car.status === 'inativo') {
      car.status = 'inactive';
      dirty = true;
    }

    if (car.contactedAt) {
      const contactedMs = new Date(car.contactedAt).getTime();
      const days = (now - contactedMs) / MS_PER_DAY;
      if (car.status === 'contacted' && days >= STALE_AFTER_DAYS) {
        car.status = 'inactive';
        dirty = true;
      }
    }

    if (dirty) {
      changed.push({ id: car.id, status: car.status, previousStatus });
    }
  }

  return changed;
}

module.exports = { applyStaleness, STALE_AFTER_DAYS };
