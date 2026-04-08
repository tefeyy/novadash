const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDb } = require('../novamind/db');
const { runAgent } = require('../novamind/agent');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/novamind/findings — all findings, most recent first
router.get('/novamind/findings', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM findings ORDER BY created_at DESC LIMIT 200'
    ).all();
    res.json(rows);
  } catch (e) {
    console.error('[novamind/findings] error:', e.message);
    res.status(500).json({ error: 'Failed to retrieve findings' });
  }
});

// POST /api/novamind/run — trigger agent and return new findings
router.post('/novamind/run', requireAuth, async (req, res) => {
  try {
    const findings = await runAgent();
    res.json({ ok: true, count: findings.length, findings });
  } catch (e) {
    console.error('[novamind/run] error:', e.message);
    res.status(500).json({ error: 'Agent run failed', detail: e.message });
  }
});

module.exports = router;
