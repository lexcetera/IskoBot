const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

const targets = {
  users: {
    file: 'users.json',
    empty: '{}',
    label: 'Users'
  },
  streaks: {
    file: 'streaks.json',
    empty: '{}',
    label: 'Streaks'
  },
  resources: {
    file: 'resources.json',
    empty: '{}',
    label: 'Resources'
  },
  faqs: {
    file: 'faqs.json',
    empty: '[]',
    label: 'FAQs'
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipedata')
    .setDescription('Admin only — Wipe bot data')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('target')
        .setDescription('Which data to wipe')
        .setRequired(true)
        .addChoices(
          { name: '⚠️ All Data', value: 'all' },
          { name: 'Users', value: 'users' },
          { name: 'Streaks', value: 'streaks' },
          { name: 'Resources', value: 'resources' },
          { name: 'FAQs', value: 'faqs' }
        )),

  async execute(interaction) {
    const target = interaction.options.getString('target');

    const targetLabel = target === 'all'
      ? '⚠️ ALL DATA'
      : targets[target].label;

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Data Wipe')
      .setDescription(`You are about to wipe **${targetLabel}**. This action is **irreversible**.\n\nAre you sure?`)
      .setColor(0xFF0000);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wipe_confirm')
        .setLabel('Yes, wipe it')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('wipe_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    const reply = await interaction.reply({
      embeds: [embed],
      components: [buttons],
      ephemeral: false,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      time: 30 * 1000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: '⚠️ This is not your confirmation!', ephemeral: false });
      }

      if (btn.customId === 'wipe_cancel') {
        return btn.update({
          content: '✅ Cancelled. No data was wiped.',
          embeds: [],
          components: []
        });
      }

      if (btn.customId === 'wipe_confirm') {
        try {
          if (target === 'all') {
            for (const [, info] of Object.entries(targets)) {
              fs.writeFileSync(path.join(dataDir, info.file), info.empty);
            }
          } else {
            const info = targets[target];
            fs.writeFileSync(path.join(dataDir, info.file), info.empty);
          }

          const successEmbed = new EmbedBuilder()
            .setTitle('🗑️ Data Wiped')
            .setDescription(`**${targetLabel}** has been successfully wiped.`)
            .setColor(0x57F287)
            .setFooter({ text: `Wiped by ${interaction.user.username}` });

          await btn.update({
            embeds: [successEmbed],
            components: []
          });

        } catch (error) {
          console.error('Wipe error:', error.message);
          await btn.update({
            content: `❌ Something went wrong: ${error.message}`,
            embeds: [],
            components: []
          });
        }
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: '⏰ Confirmation timed out. No data was wiped.',
          embeds: [],
          components: []
        });
      }
    });
  }
};