const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

function parseUptime(startTimestamp) {
  if (!startTimestamp) return 'N/A';
  const ms = Date.now() - startTimestamp;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

router.get('/agents', (req, res) => {
  // Run both pm2 jlist and ps aux in parallel
  const pm2Promise = new Promise((resolve) => {
    exec('pm2 jlist', (err, stdout) => {
      if (err || !stdout.trim()) return resolve([]);
      try {
        const list = JSON.parse(stdout);
        const agents = list.map((p) => ({
          name: p.name,
          status: p.pm2_env && p.pm2_env.status === 'online' ? 'online' : 'offline',
          memoryMB: p.monit ? Math.round(p.monit.memory / 1024 / 1024) : 0,
          uptime: p.pm2_env && p.pm2_env.status === 'online'
            ? parseUptime(p.pm2_env.pm_uptime)
            : 'stopped',
          source: 'pm2',
        }));
        resolve(agents);
      } catch {
        resolve([]);
      }
    });
  });

  const psPromise = new Promise((resolve) => {
    exec("ps aux | grep -i 'openclaw-gateway' | grep -v grep", (err, stdout) => {
      if (!stdout || !stdout.trim()) {
        return resolve({
          name: 'openclaw-gateway',
          status: 'offline',
          memoryMB: 0,
          uptime: 'stopped',
          source: 'ps',
        });
      }
      // ps aux columns: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
      const parts = stdout.trim().split(/\s+/);
      const rssMB = parts[5] ? Math.round(parseInt(parts[5], 10) / 1024) : 0;
      const startTime = parts[8] || 'N/A';
      resolve({
        name: 'openclaw-gateway',
        status: 'online',
        memoryMB: rssMB,
        uptime: `since ${startTime}`,
        source: 'ps',
      });
    });
  });

  Promise.all([pm2Promise, psPromise]).then(([pm2Agents, psAgent]) => {
    // Only include whitelisted PM2 agents relevant to the dashboard
    const RELEVANT_PM2 = ['novadash-backend', 'discord-bot', 'staffbot'];
    const filtered = pm2Agents.filter((a) => RELEVANT_PM2.includes(a.name));

    // Add openclaw-gateway from ps, only if not already in pm2 list
    const alreadyInPm2 = filtered.some((a) => a.name === 'openclaw-gateway');
    if (!alreadyInPm2) {
      filtered.push(psAgent);
    }

    res.json(filtered);
  }).catch((err) => {
    console.error('[agents] error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve agent status' });
  });
});

module.exports = router;
