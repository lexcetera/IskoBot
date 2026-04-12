const { getUser, updateUser, getClassmatesByClass } = require('../utils/database');

module.exports = async (member) => {
  const userId = member.id;
  const guild = member.client.guilds.cache.get(process.env.GUILD_ID);
  const user = getUser(userId);

  if (!user || user.classes.length === 0) return;

  for (const userClass of user.classes) {
    const { course, schedule } = userClass;

    const channelName = `${course}-${schedule}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Remove user from class
    user.classes = user.classes.filter(
      c => !(c.course === course && c.schedule === schedule)
    );
    updateUser(userId, user);

    const remaining = getClassmatesByClass(course, schedule);
    const channel = guild.channels.cache.find(
      c => c.type === 0 && c.name === channelName
    );

    if (channel) {
      if (remaining.length === 0) {
        await channel.delete(`No more students in ${course} ${schedule}`);
      } else {
        await channel.send(`👋 **${member.user.username}** has left the server and was removed from **${course} ${schedule}**.`);
      }
    }
  }
};