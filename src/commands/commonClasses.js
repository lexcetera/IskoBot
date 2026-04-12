const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commonclasses')
    .setDescription('Find common classes between you and another user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to compare classes with')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === userId) {
      return interaction.editReply({
        content: `⚠️ You can't compare classes with yourself!`,
      });
    }

    const user = getUser(userId);
    const target = getUser(targetUser.id);

    if (!user || user.classes.length === 0) {
      return interaction.editReply({
        content: `⚠️ You don't have any classes registered yet! Use **/addclass** first.`,
      });
    }

    if (!target || target.classes.length === 0) {
      return interaction.editReply({
        content: `⚠️ **${targetUser.username}** doesn't have any classes registered yet.`,
      });
    }

    // Find common classes
    const common = user.classes.filter(uc =>
      target.classes.some(tc => tc.course === uc.course && tc.schedule === uc.schedule)
    );

    if (common.length === 0) {
      return interaction.editReply({
        content: `😔 You and **${targetUser.username}** have no classes in common.`,
      });
    }

    const list = common.map(c => `• **${c.course}** — ${c.schedule}`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`📚 Common Classes with ${targetUser.username}`)
      .setDescription(list)
      .setColor(0x5865F2)
      .setFooter({ text: `${common.length} class(es) in common` });

    await interaction.editReply({ embeds: [embed] });
  }
};