const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getClassmatesByClass } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('findstudybuddy')
    .setDescription('Randomly find a study buddy from your classes')
    .addStringOption(option =>
      option.setName('class')
        .setDescription('Specific class e.g. Math 21 TWHFX-1 (optional)')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const classInput = interaction.options.getString('class');
    const user = getUser(userId);

    if (!user || user.classes.length === 0) {
      return interaction.reply({
        content: `⚠️ You have no classes registered yet! Use **/addclass** first.`,
        ephemeral: true
      });
    }

    // /findstudybuddy <class>
    if (classInput) {
      const parts = classInput.trim().split(' ');
      const schedule = parts[parts.length - 1].toUpperCase();
      const course = parts.slice(0, parts.length - 1).join(' ');

      if (!course || !schedule) {
        return interaction.reply({
          content: `⚠️ Please provide both course and schedule. e.g. \`/findstudybuddy Math 21 TWHFX-1\``,
          ephemeral: true
        });
      }

      // Check if user is actually in this class
      const inClass = user.classes.some(
        c => c.course.toLowerCase() === course.toLowerCase() && c.schedule === schedule
      );

      if (!inClass) {
        return interaction.reply({
          content: `⚠️ You are not registered in **${course} ${schedule}**!`,
          ephemeral: true
        });
      }

      const classmates = getClassmatesByClass(course, schedule).filter(
        c => c.userId !== userId
      );

      if (classmates.length === 0) {
        return interaction.reply({
          content: `😔 No classmates found in **${course} ${schedule}** yet.`,
          ephemeral: true
        });
      }

      const buddy = classmates[Math.floor(Math.random() * classmates.length)];

      const embed = new EmbedBuilder()
        .setTitle(`🎲 Study Buddy Found!`)
        .setDescription(`Your study buddy for **${course} ${schedule}** is <@${buddy.userId}>!`)
        .setColor(0x57F287)
        .setFooter({ text: 'Good luck studying together! 📚' });

      return interaction.reply({ embeds: [embed] });
    }

    // /findstudybuddy (no argument — pick from any of your classes)
    // Gather all classmates across all classes
    const pool = [];

    for (const userClass of user.classes) {
      const classmates = getClassmatesByClass(userClass.course, userClass.schedule).filter(
        c => c.userId !== userId
      );

      for (const classmate of classmates) {
        // Avoid duplicates in pool
        const alreadyInPool = pool.some(p => p.userId === classmate.userId);
        if (!alreadyInPool) {
          pool.push({
            ...classmate,
            matchedClass: `${userClass.course} ${userClass.schedule}`
          });
        }
      }
    }

    if (pool.length === 0) {
      return interaction.reply({
        content: `😔 No classmates found across any of your classes yet.`,
        ephemeral: true
      });
    }

    const buddy = pool[Math.floor(Math.random() * pool.length)];

    const embed = new EmbedBuilder()
      .setTitle(`🎲 Study Buddy Found!`)
      .setDescription(
        `Your study buddy is <@${buddy.userId}>!\n\n` +
        `📖 Matched from: **${buddy.matchedClass}**`
      )
      .setColor(0x57F287)
      .setFooter({ text: 'Good luck studying together! 📚' });

    await interaction.reply({ embeds: [embed] });
  }
};