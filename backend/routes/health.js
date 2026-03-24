const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const os = require('os');

router.get('/health', async (req, res) => {
  try {
    const [cpu, mem, disk, load] = await Promise.all([
      si.cpuTemperature(),
      si.mem(),
      si.fsSize(),
      si.currentLoad()
    ]);

    res.json({
      uptime: Math.floor(os.uptime()),
      cpu: {
        load: load.currentLoad.toFixed(1),
        temp: cpu.main || null
      },
      memory: {
        total: (mem.total / 1024 ** 3).toFixed(2),
        used: (mem.used / 1024 ** 3).toFixed(2),
        free: (mem.free / 1024 ** 3).toFixed(2),
        percent: ((mem.used / mem.total) * 100).toFixed(1)
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: (d.size / 1024 ** 3).toFixed(1),
        used: (d.used / 1024 ** 3).toFixed(1),
        percent: d.use.toFixed(1)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
