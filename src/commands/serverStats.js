const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readDB } = require('../utils/database');
const { getAllStreaks } = require('../utils/streakManager');
const { readResources } = require('../utils/resourceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Show server statistics'),

  async execute(interaction) {
    await interaction.deferReply();

    const db = readDB();
    const streaks = getAllStreaks();
    const resources = readResources();

    const totalStudents = Object.keys(db).length;

    // Count total unique classes
    const uniqueClasses = new Set();
    for (const user of Object.values(db)) {
      for (const c of user.classes) {
        uniqueClasses.add(`${c.course} ${c.schedule}`);
      }
    }

    // Most popular courses
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

    // Active streaks
    const activeStreaks = Object.values(streaks).filter(s => s.streak > 0).length;

    // Total resources
    const totalResources = Object.values(resources).reduce((acc, arr) => acc + arr.length, 0);

    const embed = new EmbedBuilder()
      .setTitle('📊 Server Statistics')
      .addFields(
        { name: '👥 Registered Students', value: `${totalStudents}`, inline: true },
        { name: '📚 Unique Classes', value: `${uniqueClasses.size}`, inline: true },
        { name: '🔥 Active Streaks', value: `${activeStreaks}`, inline: true },
        { name: '📎 Total Resources Shared', value: `${totalResources}`, inline: true },
        { name: '🏆 Most Popular Courses', value: topCourses }
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'Iskord Community Server' });

    await interaction.editReply({ embeds: [embed] });
  }
};