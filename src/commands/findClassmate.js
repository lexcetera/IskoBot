const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getClassmates, getClassmatesByClass } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('findclassmate')
    .setDescription('Find your classmates')
    .addStringOption(option =>
      option.setName('class')
        .setDescription('Specific class e.g. Math 21 TWHFX-1 (optional)')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const classInput = interaction.options.getString('class');

    // /findclassmate <class>
    if (classInput) {
      const parts = classInput.trim().split(' ');

      // Last part is schedule, everything before is course
      const schedule = parts[parts.length - 1].toUpperCase();
      const course = parts.slice(0, parts.length - 1).join(' ');

      if (!course || !schedule) {
        return interaction.reply({
          content: '⚠️ Please provide both course and schedule. e.g. `/findclassmate Math 21 TWHFX-1`',
          ephemeral: true
        });
      }

      const classmates = getClassmatesByClass(course, schedule);
      const others = classmates.filter(c => c.userId !== userId);

      if (others.length === 0) {
        return interaction.reply({
          content: `😔 No other students found in **${course} ${schedule}** yet.`,
          ephemeral: true
        });
      }

      const list = others.map(c => `• <@${c.userId}> (${c.username})`).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`👥 Classmates in ${course} ${schedule}`)
        .setDescription(list)
        .setColor(0x5865F2)
        .setFooter({ text: `${others.length} classmate(s) found` });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // /findclassmate (no argument — show all classes)
    const results = getClassmates(userId);

    if (results.length === 0) {
      return interaction.reply({
        content: `😔 No classmates found yet. Make sure you've added your classes with **/addclass**!`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`👥 Your Classmates`)
      .setColor(0x5865F2);

    for (const result of results) {
      const list = result.classmates
        .map(c => `• <@${c.userId}> (${c.username})`)
        .join('\n');

      embed.addFields({
        name: `📖 ${result.course} ${result.schedule}`,
        value: list
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};