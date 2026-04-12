const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStreak, getAllStreaks } = require('../utils/streakManager');
const { classToChannelName } = require('../utils/channelManager');
const { getClassmatesByClass } = require('../utils/database');

function normalizeCourse(course) {
  return course
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('streak')
    .setDescription('Check class channel streaks')
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Check the streak of a specific class')
        .addStringOption(option =>
          option.setName('course')
            .setDescription('Course name e.g. Math 21')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('schedule')
            .setDescription('Schedule code e.g. TWHFX-1')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('leaderboard')
        .setDescription('Show streak leaderboard for all class channels')),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'info') {
      const course = normalizeCourse(interaction.options.getString('course').trim());
      const schedule = interaction.options.getString('schedule').trim().toUpperCase();

      const students = getClassmatesByClass(course, schedule);
      if (students.length === 0) {
        return interaction.editReply({
          content: `⚠️ No students found in **${course} ${schedule}**. Make sure the class exists!`,
        });
      }

      const channelName = classToChannelName(course, schedule);
      const data = getStreak(channelName);

      const embed = new EmbedBuilder()
        .setTitle(`🔥 Streak Info — ${course} ${schedule}`)
        .addFields(
          { name: '🔥 Current Streak', value: `${data.streak} day(s)`, inline: true },
          { name: '👥 Messaged Today', value: `${data.todayUsers.length}/3 users`, inline: true },
        )
        .setColor(data.streak > 0 ? 0xFF6B35 : 0x5865F2)
        .setFooter({ text: 'At least 3 different users must message daily to maintain the streak!' });

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'leaderboard') {
      const allStreaks = getAllStreaks();
      const entries = Object.entries(allStreaks)
        .sort((a, b) => b[1].streak - a[1].streak)
        .slice(0, 10);

      if (entries.length === 0) {
        return interaction.editReply({
          content: `😔 No streaks yet! Start messaging in your class channels.`,
        });
      }

      const medals = ['🥇', '🥈', '🥉'];

      const list = entries.map(([channelName, data], i) => {
        const medal = medals[i] || `${i + 1}.`;
        return `${medal} **#${channelName}** — 🔥 ${data.streak} day(s) | 👥 ${data.todayUsers.length}/3 today`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`🏆 Streak Leaderboard`)
        .setDescription(list)
        .setColor(0xFFD700)
        .setFooter({ text: 'Top 10 class channels by streak' });

      return interaction.editReply({ embeds: [embed] });
    }
  }
};