const express = require('express');
const router = express.Router();
const { status } = require('minecraft-server-util');

router.get('/minecraft', async (req, res) => {
  try {
    const result = await status('37.59.114.19', 25565, { timeout: 5000 });
    res.json({
      online: true,
      players: {
        online: result.players.online,
        max: result.players.max
      },
      version: result.version.name,
      motd: result.motd.clean
    });
  } catch (err) {
    res.json({ online: false, error: err.message });
  }
});

module.exports = router;
