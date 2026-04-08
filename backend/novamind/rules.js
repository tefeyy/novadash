const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Rule: Files larger than 100MB in /home, /opt, /var/log
function ruleLargeFiles() {
  const findings = [];
  try {
    const output = execSync(
      'find /home /opt /var/log -maxdepth 6 -type f -size +100M 2>/dev/null || true',
      { timeout: 30000 }
    ).toString().trim();
    if (output) {
      for (const filePath of output.split('\n').filter(Boolean)) {
        try {
          const stat = fs.statSync(filePath);
          const sizeMB = Math.round(stat.size / 1024 / 1024);
          findings.push({
            rule_name: 'large_files',
            severity: 'warning',
            message: `Large file detected: ${filePath}`,
            detail: `Size: ${sizeMB} MB`,
          });
        } catch (e) {
          // file may have disappeared — skip
        }
      }
    }
  } catch (e) {
    console.error('[rules:large_files] error:', e.message);
  }
  return findings;
}

// Rule: Log files older than 30 days in /var/log (excluding system-managed dirs)
function ruleOldLogs() {
  const findings = [];
  try {
    const excl = [
      '/var/log/journal', '/var/log/apt', '/var/log/dpkg',
      '/var/log/unattended-upgrades', '/var/log/dist-upgrade',
      '/var/log/installer', '/var/log/landscape',
    ];
    const notArgs = excl.map(d => '-not -path ' + d + '/*').join(' ');
    const cmd = 'find /var/log -type f -mtime +30 ' + notArgs + ' 2>/dev/null || true';
    const output = execSync(cmd, { timeout: 30000 }).toString().trim();
    if (output) {
      for (const filePath of output.split('\n').filter(Boolean)) {
        findings.push({
          rule_name: 'old_logs',
          severity: 'info',
          message: `Old log file: ${filePath}`,
          detail: 'Last modified more than 30 days ago',
        });
      }
    }
  } catch (e) {
    console.error('[rules:old_logs] error:', e.message);
  }
  return findings;
}

// Rule: PM2 processes with >300 restarts (crash loops)
function rulePm2Restarts() {
  const findings = [];
  try {
    const output = execSync('pm2 jlist 2>/dev/null', { timeout: 15000 }).toString().trim();
    if (!output) return findings;
    const list = JSON.parse(output);
    for (const proc of list) {
      const restarts = proc.pm2_env && proc.pm2_env.restart_time != null
        ? proc.pm2_env.restart_time
        : 0;
      if (restarts > 300) {
        findings.push({
          rule_name: 'pm2_crash_loop',
          severity: 'critical',
          message: `PM2 process "${proc.name}" has ${restarts} restarts — possible crash loop`,
          detail: `Status: ${proc.pm2_env ? proc.pm2_env.status : 'unknown'}`,
        });
      }
    }
  } catch (e) {
    console.error('[rules:pm2_restarts] error:', e.message);
  }
  return findings;
}

// Rule: Processes using >15% RAM
function ruleHighMemory() {
  const findings = [];
  try {
    const output = execSync(
      "ps aux --no-headers | awk '$4 > 15 {print $1, $2, $4, $11}'",
      { timeout: 15000 }
    ).toString().trim();
    if (output) {
      for (const line of output.split('\n').filter(Boolean)) {
        const parts = line.split(/\s+/);
        const user = parts[0];
        const pid = parts[1];
        const memPct = parts[2];
        const cmd = parts.slice(3).join(' ');
        findings.push({
          rule_name: 'high_memory',
          severity: 'warning',
          message: `Process using ${memPct}% RAM: ${cmd}`,
          detail: `PID: ${pid}, User: ${user}`,
        });
      }
    }
  } catch (e) {
    console.error('[rules:high_memory] error:', e.message);
  }
  return findings;
}

module.exports = { ruleLargeFiles, ruleOldLogs, rulePm2Restarts, ruleHighMemory };
