const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('myclasses')
    .setDescription('Show your registered classes'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const user = getUser(userId);

    if (!user || user.classes.length === 0) {
      return interaction.reply({
        content: `📭 You have no classes yet! Use **/addclass** to add one.`,
        ephemeral: false
      });
    }

    const classList = user.classes
      .map((c, i) => `${i + 1}. **${c.course}** — ${c.schedule}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`📚 ${interaction.user.username}'s Classes`)
      .setDescription(classList)
      .setColor(0x5865F2)
      .setFooter({ text: `${user.classes.length} class(es) registered` });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};