const { SlashCommandBuilder } = require('discord.js');
const { getUser, saveUser, updateUser, getClassmatesByClass } = require('../utils/database');
const { getOrCreateClassChannel } = require('../utils/channelManager');

function normalizeCourse(course) {
  return course
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addclass')
    .setDescription('Add a class to your list')
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
    const username = interaction.user.username;
    const course = normalizeCourse(interaction.options.getString('course').trim());
    const schedule = interaction.options.getString('schedule').trim().toUpperCase();
    const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);

    saveUser(userId, username);
    const user = getUser(userId);

    const alreadyAdded = user.classes.some(
      c => c.course === course && c.schedule === schedule
    );

    if (alreadyAdded) {
      return interaction.editReply({
        content: `⚠️ You already have **${course} ${schedule}** in your list!`,
      });
    }

    const existingClassmates = getClassmatesByClass(course, schedule);

    user.classes.push({ course, schedule });
    updateUser(userId, user);

    await interaction.editReply({
      content: `✅ Added **${course} ${schedule}** to your classes!`,
    });

    try {
      await guild.channels.fetch().catch(() => {});
      const channel = await getOrCreateClassChannel(guild, course, schedule);

      if (existingClassmates.length > 0) {
        await channel.send(
          `👋 Welcome <@${userId}> to **${course} ${schedule}**! Say hi to your new classmate!`
        );
      } else {
        await channel.send(
          `🎉 <@${userId}> is the first to register **${course} ${schedule}**! More classmates will show up soon.`
        );
      }
    } catch (error) {
      console.error('Channel error:', error.message);
    }
  },
};
