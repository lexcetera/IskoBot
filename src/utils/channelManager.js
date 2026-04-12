function classToChannelName(course, schedule) {
  return `${course}-${schedule}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

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

async function getOrCreateClassChannel(guild, course, schedule, userId) {
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

  return channel;
}

async function removeUserFromChannel(channel, userId) {
  // placeholder for now
}

module.exports = {
  getOrCreateClassChannel,
  classToChannelName,
  removeUserFromChannel
};