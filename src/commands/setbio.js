const { SlashCommandBuilder } = require('discord.js');
const { saveUser, updateUser, getUser } = require('../utils/database');

const MAX_BIO = 150;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbio')
    .setDescription('Set your profile bio (max 150 characters)')
    .addStringOption(o =>
      o.setName('bio')
        .setDescription('Your bio text')
        .setRequired(true)
        .setMaxLength(MAX_BIO)),

  async execute(interaction) {
    const raw = interaction.options.getString('bio') ?? '';
    const bio = raw.trim();

    if (bio.length > MAX_BIO) {
      return interaction.reply({
        content: `⚠️ Bio must be at most ${MAX_BIO} characters.`,
        ephemeral: true,
      });
    }

    saveUser(interaction.user.id, interaction.user.username);
    const user = getUser(interaction.user.id);
    user.bio = bio;
    updateUser(interaction.user.id, user);

    return interaction.reply({
      content: '✅ Your bio has been updated.',
      ephemeral: true,
    });
  },
};
