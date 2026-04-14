function requireSecret(req, res) {
  const expected = process.env.API_SECRET;
  if (!expected) {
    res.status(500).json({ error: 'API_SECRET not configured' });
    return false;
  }
  const got = req.headers['x-api-secret'];
  if (got !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { requireSecret };
