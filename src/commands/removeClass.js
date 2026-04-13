const { SlashCommandBuilder } = require('discord.js');
const { getUser, updateUser, getClassmatesByClass } = require('../utils/database');
const { applyClassChannelPermissions } = require('../utils/channelManager');

function normalizeCourse(course) {
  return course
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeclass')
    .setDescription('Remove a class from your list')
    .addStringOption(option =>
      option.setName('course')
        .setDescription('Course name e.g. Math 21')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('schedule')
        .setDescription('Schedule code e.g. TWHFX-1')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const course = normalizeCourse(interaction.options.getString('course').trim());
    const schedule = interaction.options.getString('schedule').trim().toUpperCase();
    const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);

    const user = getUser(userId);

    if (!user) {
      return interaction.editReply({
        content: `⚠️ You don't have any classes yet!`,
      });
    }

    const index = user.classes.findIndex(
      c => c.course === course && c.schedule === schedule
    );

    if (index === -1) {
      return interaction.editReply({
        content: `⚠️ You don't have **${course} ${schedule}** in your list!`,
      });
    }

    user.classes.splice(index, 1);
    updateUser(userId, user);

    await interaction.editReply({
      content: `🗑️ Removed **${course} ${schedule}** from your classes!`,
    });

    try {
      const channelName = `${course}-${schedule}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const channel = guild.channels.cache.find(
        c => c.type === 0 && c.name === channelName
      );

      if (channel) {
        // Check remaining students after removal
        const remaining = getClassmatesByClass(course, schedule);

        if (remaining.length === 0) {
          await channel.send(`👋 <@${userId}> has left. No more students in **${course} ${schedule}**. Deleting channel...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          await channel.delete(`No more students in ${course} ${schedule}`);
        } else {
          await applyClassChannelPermissions(guild, channel, course, schedule);
          await channel.send(`👋 <@${userId}> has left **${course} ${schedule}**.`);
        }
      }

    } catch (error) {
      console.error('Channel error:', error.message);
    }
  }
};