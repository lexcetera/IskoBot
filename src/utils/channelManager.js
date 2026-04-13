const { OverwriteType } = require('discord.js');
const { getClassmatesByClass } = require('./database');

function classToChannelName(course, schedule) {
  return `${course}-${schedule}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function parseStaffRoleIds() {
  const raw = process.env.CLASS_CHANNEL_STAFF_ROLE_IDS;
  if (!raw) return [];
  return raw.split(',').map(id => id.trim()).filter(Boolean);
}

const MEMBER_PERMS = {
  ViewChannel: true,
  SendMessages: true,
  ReadMessageHistory: true,
  EmbedLinks: true,
  AttachFiles: true,
};

async function getOrCreateClassCategory(guild) {
  let category = guild.channels.cache.find(
    c => c.type === 4 && c.name.toLowerCase() === 'class channels'
  );

  if (!category) {
    category = await guild.channels.create({
      name: 'Class Channels',
      type: 4,
    });
  }

  return category;
}

async function getOrCreateClassChannel(guild, course, schedule) {
  const channelName = classToChannelName(course, schedule);
  const category = await getOrCreateClassCategory(guild);

  let channel = guild.channels.cache.find(
    c => c.type === 0 && c.name === channelName
  );

  if (!channel) {
    channel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: category.id,
      topic: `Class channel for ${course} ${schedule}`,
    });
  }

  await applyClassChannelPermissions(guild, channel, course, schedule);
  return channel;
}

/**
 * Private channel: deny @everyone, allow bot + staff roles + enrolled classmates.
 * Removes stale member overwrites not in the class roster.
 */
async function applyClassChannelPermissions(guild, channel, course, schedule) {
  const me = guild.members.me;
  if (!me) return;

  await channel.permissionOverwrites.edit(guild.id, {
    ViewChannel: false,
  });

  await channel.permissionOverwrites.edit(me.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    ManageChannels: true,
    ManageMessages: true,
    EmbedLinks: true,
    AttachFiles: true,
  });

  for (const roleId of parseStaffRoleIds()) {
    try {
      await channel.permissionOverwrites.edit(roleId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        EmbedLinks: true,
        AttachFiles: true,
      });
    } catch (e) {
      console.error('Staff role overwrite', roleId, e.message);
    }
  }

  const classmates = getClassmatesByClass(course, schedule);
  const allowedIds = new Set(classmates.map(u => u.userId));

  for (const userId of allowedIds) {
    try {
      await channel.permissionOverwrites.edit(userId, MEMBER_PERMS);
    } catch (e) {
      console.error('Member overwrite', userId, e.message);
    }
  }

  for (const [id, overwrite] of channel.permissionOverwrites.cache) {
    if (overwrite.type !== OverwriteType.Member) continue;
    if (id === me.id) continue;
    if (allowedIds.has(id)) continue;
    await channel.permissionOverwrites.delete(id).catch(() => {});
  }
}

async function removeUserFromChannel(channel, userId) {
  await channel.permissionOverwrites.delete(userId).catch(() => {});
}

module.exports = {
  getOrCreateClassChannel,
  classToChannelName,
  getOrCreateClassCategory,
  applyClassChannelPermissions,
  removeUserFromChannel,
};
