const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, 'storage.json');

function readStorage() {
  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    const empty = { warnings: {}, settings: {} };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
}

function writeStorage(data) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
}

function addWarning(guildId, userId, { moderator, reason, timestamp }) {
  const store = readStorage();
  if (!store.warnings[guildId]) store.warnings[guildId] = {};
  if (!store.warnings[guildId][userId]) store.warnings[guildId][userId] = [];
  store.warnings[guildId][userId].push({ moderator, reason, timestamp });
  writeStorage(store);
}

function removeWarnings(guildId, userId) {
  const store = readStorage();
  if (store.warnings[guildId]) {
    delete store.warnings[guildId][userId];
    writeStorage(store);
  }
}

function getWarnings(guildId, userId) {
  const store = readStorage();
  return (store.warnings[guildId] && store.warnings[guildId][userId]) || [];
}

function setSetting(guildId, key, value) {
  const store = readStorage();
  if (!store.settings[guildId]) store.settings[guildId] = {};
  store.settings[guildId][key] = value;
  writeStorage(store);
}

function getSetting(guildId, key) {
  const store = readStorage();
  return store.settings[guildId] ? store.settings[guildId][key] : undefined;
}

module.exports = {
  readStorage,
  writeStorage,
  addWarning,
  getWarnings,
  removeWarnings,
  setSetting,
  getSetting
};