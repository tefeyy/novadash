require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getDb } = require('./db');
const { ruleLargeFiles, ruleOldLogs, rulePm2Restarts, ruleHighMemory } = require('./rules');
const { sendTelegram } = require('./telegram');

const ALERT_SEVERITIES = ['critical', 'warning'];

async function runAgent() {
  console.log(`[novamind] Agent run started at ${new Date().toISOString()}`);
  const db = getDb();

  const rules = [
    { fn: ruleLargeFiles, name: 'large_files' },
    { fn: ruleOldLogs, name: 'old_logs' },
    { fn: rulePm2Restarts, name: 'pm2_crash_loop' },
    { fn: ruleHighMemory, name: 'high_memory' },
  ];

  const allFindings = [];

  for (const rule of rules) {
    try {
      const results = rule.fn();
      allFindings.push(...results);
      console.log(`[novamind] ${rule.name}: ${results.length} finding(s)`);
    } catch (e) {
      console.error(`[novamind] Rule ${rule.name} threw:`, e.message);
    }
  }

  // Persist findings and collect new ones that need alerting
  const insertStmt = db.prepare(
    'INSERT INTO findings (rule_name, severity, message, detail, created_at) VALUES (?, ?, ?, ?, ?)'
  );

  const newAlerts = [];

  for (const finding of allFindings) {
    const createdAt = new Date().toISOString();
    const info = insertStmt.run(
      finding.rule_name,
      finding.severity,
      finding.message,
      finding.detail || null,
      createdAt
    );
    if (ALERT_SEVERITIES.includes(finding.severity)) {
      newAlerts.push({ id: info.lastInsertRowid, ...finding });
    }
  }

  // Send Telegram alerts for critical/warning findings
  if (newAlerts.length > 0) {
    const severityEmoji = { critical: '🚨', warning: '⚠️' };
    // Cap alert list to 20 items to avoid Telegram message length limits
    const alertsToSend = newAlerts.slice(0, 20);
    const lines = alertsToSend.map(
      (f) => `${severityEmoji[f.severity] || 'ℹ️'} <b>${f.severity.toUpperCase()}</b> — ${f.message}`
    );
    const extra = newAlerts.length > 20 ? `\n...and ${newAlerts.length - 20} more.` : '';
    const msg = `<b>NovaMind Scan — ${new Date().toLocaleDateString()}</b>\n\n${lines.join('\n')}${extra}`;
    try {
      await sendTelegram(msg);
      console.log(`[novamind] Telegram alert sent for ${newAlerts.length} finding(s)`);
    } catch (e) {
      console.error('[novamind] Telegram send failed:', e.message);
    }
  } else {
    console.log('[novamind] No critical/warning findings — no Telegram alert sent');
  }

  console.log(`[novamind] Done. Total findings: ${allFindings.length}`);
  return allFindings;
}

// Run directly if invoked as a script
if (require.main === module) {
  runAgent().then(() => process.exit(0)).catch((e) => {
    console.error('[novamind] Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { runAgent };
