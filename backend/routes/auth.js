const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In production this would come from a database
// For now, a single hashed password stored in .env
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const validUser = username === process.env.DASH_USER;
  const validPass = await bcrypt.compare(password, process.env.DASH_PASS_HASH);

  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

module.exports = router;
