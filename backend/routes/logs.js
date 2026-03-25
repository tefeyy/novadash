const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Whitelist only — prevents path traversal
const LOG_PATHS = {
  'novadash-backend': '/home/ubuntu/.pm2/logs/novadash-backend-out.log',
  'discord-bot': '/srv/discordbots/.pm2/logs/discord-bot-out.log',
};

router.get('/logs/:process', (req, res) => {
  const procName = req.params.process;

  if (!LOG_PATHS[procName]) {
    return res.status(400).json({ error: 'Process not whitelisted' });
  }

  const logPath = LOG_PATHS[procName];

  fs.access(logPath, fs.constants.R_OK, (accessErr) => {
    if (accessErr) {
      console.error(`[logs] Cannot read ${logPath}:`, accessErr.message);
      return res.status(404).json({ error: 'Log file not found or not readable' });
    }

    fs.readFile(logPath, 'utf8', (err, data) => {
      if (err) {
        console.error(`[logs] readFile failed for ${logPath}:`, err.message);
        return res.status(500).json({ error: 'Failed to read log file' });
      }

      const lines = data.split('\n').filter((l) => l.length > 0);
      const last50 = lines.slice(-50);

      res.json({
        process: procName,
        lines: last50,
        total: lines.length,
      });
    });
  });
});

module.exports = router;
