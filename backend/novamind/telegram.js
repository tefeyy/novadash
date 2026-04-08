require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');

function sendTelegram(message) {
  const token = (process.env.NOVAMIND_TELEGRAM_TOKEN || '').trim();
  const chatId = (process.env.NOVAMIND_CHAT_ID || '').trim();
  if (!token || !chatId) {
    console.error('[telegram] Missing NOVAMIND_TELEGRAM_TOKEN or NOVAMIND_CHAT_ID');
    return Promise.resolve();
  }
  const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });
  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.ok) console.error('[telegram] API error:', parsed.description);
        } catch (e) {
          console.error('[telegram] parse error:', e.message);
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.error('[telegram] request error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

module.exports = { sendTelegram };
