const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUsersByCourse } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('findcourse')
    .setDescription('Find all students taking a course regardless of schedule')
    .addStringOption(option =>
      option.setName('course')
        .setDescription('Course name e.g. Math 21')
        .setRequired(true)),

  async execute(interaction) {
    const course = interaction.options.getString('course').trim();
    const users = getUsersByCourse(course);
    const others = users.filter(u => u.userId !== interaction.user.id);

    if (others.length === 0) {
      return interaction.reply({
        content: `😔 No students found taking **${course}** yet.`,
        ephemeral: true
      });
    }

    // Group by schedule
    const grouped = {};
    for (const user of others) {
      for (const c of user.classes) {
        if (c.course.toLowerCase() === course.toLowerCase()) {
          if (!grouped[c.schedule]) grouped[c.schedule] = [];
          grouped[c.schedule].push(user);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Students taking ${course}`)
      .setColor(0x5865F2);

    for (const [schedule, students] of Object.entries(grouped)) {
      const list = students.map(s => `• <@${s.userId}> (${s.username})`).join('\n');
      embed.addFields({ name: `📅 ${schedule}`, value: list });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};