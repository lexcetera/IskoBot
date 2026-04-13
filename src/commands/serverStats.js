const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readDB } = require('../utils/database');
const { getAllStreaks } = require('../utils/streakManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Show server statistics'),

  async execute(interaction) {
    await interaction.deferReply();

    const db = readDB();
    const streaks = getAllStreaks();

    const uniqueClasses = new Set();
    for (const user of Object.values(db)) {
      for (const c of user.classes) {
        uniqueClasses.add(`${c.course} ${c.schedule}`);
      }
    }

    const courseCounts = {};
    for (const user of Object.values(db)) {
      for (const c of user.classes) {
        courseCounts[c.course] = (courseCounts[c.course] || 0) + 1;
      }
    }
    const topCourses = Object.entries(courseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([course, count], i) => `${i + 1}. **${course}** — ${count} student(s)`)
      .join('\n') || 'No courses yet';

    const activeStreaks = Object.values(streaks).filter(s => s.streak > 0).length;

    const embed = new EmbedBuilder()
      .setTitle('📊 Server Statistics')
      .addFields(
        { name: '📚 Unique classes', value: `${uniqueClasses.size}`, inline: true },
        { name: '🔥 Active streaks', value: `${activeStreaks}`, inline: true },
        { name: '🏆 Most popular courses', value: topCourses }
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'Iskord Community Server' });

    await interaction.editReply({ embeds: [embed] });
  },
};
