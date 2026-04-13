const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/guildConfig.json');

function ensure() {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ reportPingRoleId: null }, null, 2));
  }
}

function readGuildConfig() {
  ensure();
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writeGuildConfig(data) {
  ensure();
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function getReportPingRoleId() {
  const id = readGuildConfig().reportPingRoleId;
  return id || null;
}

function setReportPingRoleId(roleId) {
  const c = readGuildConfig();
  c.reportPingRoleId = roleId || null;
  writeGuildConfig(c);
}

module.exports = { readGuildConfig, writeGuildConfig, getReportPingRoleId, setReportPingRoleId };
