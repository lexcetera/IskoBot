const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getClassmatesByClass } = require('../utils/database');
const { getStreak } = require('../utils/streakManager');
const { getResources } = require('../utils/resourceManager');
const { classToChannelName } = require('../utils/channelManager');

function normalizeCourse(course) {
  return course
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classinfo')
    .setDescription('Show info about a specific class')
    .addStringOption(o =>
      o.setName('course')
        .setDescription('Course name e.g. Math 21')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('schedule')
        .setDescription('Schedule e.g. TWHFX-1')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const course = normalizeCourse(interaction.options.getString('course').trim());
    const schedule = interaction.options.getString('schedule').trim().toUpperCase();

    const students = getClassmatesByClass(course, schedule);

    if (students.length === 0) {
      return interaction.editReply({
        content: `⚠️ No students found in **${course} ${schedule}**!`,
      });
    }

    const channelName = classToChannelName(course, schedule);
    const streak = getStreak(channelName);
    const resources = getResources(course);

    const embed = new EmbedBuilder()
      .setTitle(`📖 Class Info — ${course} ${schedule}`)
      .addFields(
        { name: '👥 Students Registered', value: `${students.length}`, inline: true },
        { name: '🔥 Current Streak', value: `${streak.streak} day(s)`, inline: true },
        { name: '📎 Resources Available', value: `${resources.length}`, inline: true },
        { name: '👥 Student List', value: students.map(s => `• <@${s.userId}> (${s.username})`).join('\n') }
      )
      .setColor(0x5865F2)
      .setFooter({ text: `Use /resources list ${course} to browse resources` });

    await interaction.editReply({ embeds: [embed] });
  }
};