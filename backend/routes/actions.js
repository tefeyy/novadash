const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const ALLOWED_PROCESSES = ['novadash-backend', 'discord-bot', 'staffbot'];
const ALLOWED_ACTIONS = ['restart'];

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

router.post('/actions', requireAuth, (req, res) => {
  const { action, process: proc } = req.body;

  if (!ALLOWED_ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (!ALLOWED_PROCESSES.includes(proc)) {
    return res.status(400).json({ error: 'Invalid process' });
  }

  exec(`pm2 ${action} ${proc}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`[actions] pm2 ${action} ${proc} failed:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[actions] pm2 ${action} ${proc} OK`);
    res.json({ ok: true, action, process: proc });
  });
});

module.exports = router;
