const fs = require('fs');
const path = require('path');

const streakPath = path.join(__dirname, '../data/streaks.json');

function readStreaks() {
  const data = fs.readFileSync(streakPath, 'utf-8');
  return JSON.parse(data);
}

function writeStreaks(data) {
  fs.writeFileSync(streakPath, JSON.stringify(data, null, 2));
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // "2024-01-15"
}

function getStreak(channelName) {
  const streaks = readStreaks();
  return streaks[channelName] || {
    streak: 0,
    lastUpdated: null,
    todayUsers: []
  };
}

function recordMessage(channelName, userId) {
  const streaks = readStreaks();
  const today = getTodayDate();

  if (!streaks[channelName]) {
    streaks[channelName] = {
      streak: 0,
      lastUpdated: today,
      todayUsers: []
    };
  }

  const entry = streaks[channelName];

  // If it's a new day, check if yesterday's streak was maintained
  if (entry.lastUpdated !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (entry.lastUpdated === yesterdayStr && entry.todayUsers.length >= 3) {
      // Streak maintained from yesterday
      entry.streak += 1;
    } else if (entry.lastUpdated !== today) {
      // Missed a day — reset
      entry.streak = 0;
    }

    // Reset today's users for the new day
    entry.todayUsers = [];
    entry.lastUpdated = today;
  }

  // Add user if not already counted today
  if (!entry.todayUsers.includes(userId)) {
    entry.todayUsers.push(userId);
  }

  streaks[channelName] = entry;
  writeStreaks(streaks);
}

function checkAndResetStreaks() {
  const streaks = readStreaks();
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  for (const [channelName, entry] of Object.entries(streaks)) {
    // If last updated was yesterday and less than 3 users messaged, reset
    if (entry.lastUpdated === yesterdayStr && entry.todayUsers.length < 3) {
      streaks[channelName].streak = 0;
      streaks[channelName].todayUsers = [];
    }
    // If last updated was before yesterday, reset
    if (entry.lastUpdated < yesterdayStr) {
      streaks[channelName].streak = 0;
      streaks[channelName].todayUsers = [];
    }
  }

  writeStreaks(streaks);
}

function getAllStreaks() {
  return readStreaks();
}

module.exports = { recordMessage, getStreak, checkAndResetStreaks, getAllStreaks };