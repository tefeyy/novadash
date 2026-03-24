const express = require('express');
const router = express.Router();
const si = require('systeminformation');

router.get('/processes', async (req, res) => {
  try {
    const data = await si.processes();

    const top = data.list
      .filter(p => p.mem > 0)
      .sort((a, b) => b.mem - a.mem)
      .slice(0, 10)
      .map(p => ({
        pid: p.pid,
        name: p.name,
        cpu: p.cpu.toFixed(1),
        mem: (p.mem).toFixed(1),
        memMb: (p.memMem / 1024).toFixed(0)
      }));

    res.json({ total: data.all, running: data.running, list: top });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
