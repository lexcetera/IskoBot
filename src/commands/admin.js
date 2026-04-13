const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getUser, updateUser, readDB, writeDB, getClassmatesByClass } = require('../utils/database');
const { getResources, writeResources } = require('../utils/resourceManager');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

function normalizeCourse(course) {
  return course
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function confirmAction(interaction, description, onConfirm) {
  const embed = new EmbedBuilder()
    .setTitle('⚠️ Confirm Action')
    .setDescription(description)
    .setColor(0xFF0000);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_confirm')
      .setLabel('Yes, confirm')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('admin_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });

  const collector = reply.createMessageComponentCollector({ time: 30 * 1000 });

  collector.on('collect', async (btn) => {
    if (btn.user.id !== interaction.user.id) {
      return btn.reply({ content: '⚠️ This is not your confirmation!', ephemeral: true });
    }

    if (btn.customId === 'admin_cancel') {
      return btn.update({ content: '✅ Cancelled. No changes were made.', embeds: [], components: [] });
    }

    if (btn.customId === 'admin_confirm') {
      await btn.update({ content: '⏳ Processing...', embeds: [], components: [] });
      await onConfirm();
    }
  });

  collector.on('end', (collected) => {
    if (collected.size === 0) {
      interaction.editReply({ content: '⏰ Confirmation timed out. No changes were made.', embeds: [], components: [] });
    }
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin only commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    // addclass
    .addSubcommand(sub =>
      sub.setName('addclass')
        .setDescription('Add a class to a user')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(o => o.setName('course').setDescription('Course name e.g. Math 21').setRequired(true))
        .addStringOption(o => o.setName('schedule').setDescription('Schedule e.g. TWHFX-1').setRequired(true)))

    // removeclass
    .addSubcommand(sub =>
      sub.setName('removeclass')
        .setDescription('Remove a class from a user')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(o => o.setName('course').setDescription('Course name e.g. Math 21').setRequired(true))
        .addStringOption(o => o.setName('schedule').setDescription('Schedule e.g. TWHFX-1').setRequired(true)))

    // clearclasses
    .addSubcommand(sub =>
      sub.setName('clearclasses')
        .setDescription('Clear all classes from a user')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)))

    // removeuser
    .addSubcommand(sub =>
      sub.setName('removeuser')
        .setDescription('Completely erase a user from the system')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)))

    // removeresource
    .addSubcommand(sub =>
      sub.setName('removeresource')
        .setDescription('Remove a specific resource from a course')
        .addStringOption(o => o.setName('course').setDescription('Course name e.g. Math 21').setRequired(true))
        .addIntegerOption(o => o.setName('number').setDescription('Resource number from /resources list').setRequired(true)))

    // clearresources
    .addSubcommand(sub =>
      sub.setName('clearresources')
        .setDescription('Wipe all resources for a course')
        .addStringOption(o => o.setName('course').setDescription('Course name e.g. Math 21').setRequired(true)))

    // wipedata
    .addSubcommand(sub =>
      sub.setName('wipedata')
        .setDescription('Wipe bot data')
        .addStringOption(o =>
          o.setName('target')
            .setDescription('What to wipe')
            .setRequired(true)
            .addChoices(
              { name: '⚠️ All Data', value: 'all' },
              { name: 'Users', value: 'users' },
              { name: 'Streaks', value: 'streaks' },
              { name: 'Resources', value: 'resources' },
              { name: 'FAQs', value: 'faqs' }
            ))),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);

    // ========================
    // /admin addclass
    // ========================
    if (sub === 'addclass') {
      const target = interaction.options.getUser('user');
      const course = normalizeCourse(interaction.options.getString('course').trim());
      const schedule = interaction.options.getString('schedule').trim().toUpperCase();

      const { saveUser } = require('../utils/database');
      saveUser(target.id, target.username);
      const user = getUser(target.id);

      const alreadyAdded = user.classes.some(
        c => c.course === course && c.schedule === schedule
      );

      if (alreadyAdded) {
        return interaction.editReply({
          content: `⚠️ **${target.username}** is already in **${course} ${schedule}**!`,
        });
      }

      const existingClassmates = getClassmatesByClass(course, schedule);
      user.classes.push({ course, schedule });
      updateUser(target.id, user);

      await interaction.editReply({
        content: `✅ Added **${course} ${schedule}** to **${target.username}**'s classes!`,
      });

      try {
        const channelName = `${course}-${schedule}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        await guild.channels.fetch();
        let category = guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase() === 'class channels');
        if (!category) {
          category = await guild.channels.create({ name: 'Class Channels', type: 4 });
        }

        let channel = guild.channels.cache.find(c => c.type === 0 && c.name === channelName);
        if (!channel) {
          channel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: category.id,
            topic: `Class channel for ${course} ${schedule}`,
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (existingClassmates.length > 0) {
          await channel.send(`@here 👋 Welcome <@${target.id}> to **${course} ${schedule}**! Say hi to your new classmate!`);
        } else {
          await channel.send(`🎉 <@${target.id}> is the first to register **${course} ${schedule}**! More classmates will show up soon.`);
        }
      } catch (err) {
        console.error('Channel error:', err.message);
      }
    }

    // ========================
    // /admin removeclass
    // ========================
    if (sub === 'removeclass') {
      const target = interaction.options.getUser('user');
      const course = normalizeCourse(interaction.options.getString('course').trim());
      const schedule = interaction.options.getString('schedule').trim().toUpperCase();

      const user = getUser(target.id);

      if (!user) {
        return interaction.editReply({ content: `⚠️ **${target.username}** is not registered in the system!` });
      }

      const index = user.classes.findIndex(c => c.course === course && c.schedule === schedule);
      if (index === -1) {
        return interaction.editReply({ content: `⚠️ **${target.username}** is not in **${course} ${schedule}**!` });
      }

      user.classes.splice(index, 1);
      updateUser(target.id, user);

      await interaction.editReply({ content: `✅ Removed **${course} ${schedule}** from **${target.username}**'s classes!` });

      try {
        const channelName = `${course}-${schedule}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const channel = guild.channels.cache.find(c => c.type === 0 && c.name === channelName);

        if (channel) {
          const remaining = getClassmatesByClass(course, schedule);
          if (remaining.length === 0) {
            await channel.send(`👋 <@${target.id}> was removed. No more students in **${course} ${schedule}**. Deleting channel...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            await channel.delete();
          } else {
            await channel.send(`👋 <@${target.id}> was removed from **${course} ${schedule}** by an admin.`);
          }
        }
      } catch (err) {
        console.error('Channel error:', err.message);
      }
    }

    // ========================
    // /admin clearclasses
    // ========================
    if (sub === 'clearclasses') {
      const target = interaction.options.getUser('user');
      const user = getUser(target.id);

      if (!user || user.classes.length === 0) {
        return interaction.editReply({ content: `⚠️ **${target.username}** has no classes registered!` });
      }

      await confirmAction(
        interaction,
        `You are about to clear all **${user.classes.length} class(es)** from **${target.username}**. This cannot be undone.`,
        async () => {
          const classesToRemove = [...user.classes];
          user.classes = [];
          updateUser(target.id, user);

          for (const userClass of classesToRemove) {
            try {
              const channelName = `${userClass.course}-${userClass.schedule}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              const channel = guild.channels.cache.find(c => c.type === 0 && c.name === channelName);
              if (channel) {
                const remaining = getClassmatesByClass(userClass.course, userClass.schedule);
                if (remaining.length === 0) {
                  await channel.send(`👋 <@${target.id}> was removed. No more students in **${userClass.course} ${userClass.schedule}**. Deleting channel...`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  await channel.delete();
                } else {
                  await channel.send(`👋 <@${target.id}> was removed from **${userClass.course} ${userClass.schedule}** by an admin.`);
                }
              }
            } catch (err) {
              console.error('Channel error:', err.message);
            }
          }

          await interaction.editReply({
            content: `✅ Cleared all classes from **${target.username}**!`,
            embeds: [],
            components: []
          });
        }
      );
    }

    // ========================
    // /admin removeuser
    // ========================
    if (sub === 'removeuser') {
      const target = interaction.options.getUser('user');
      const user = getUser(target.id);

      if (!user) {
        return interaction.editReply({ content: `⚠️ **${target.username}** is not registered in the system!` });
      }

      await confirmAction(
        interaction,
        `You are about to completely erase **${target.username}** from the system including all their classes. This cannot be undone.`,
        async () => {
          const classesToRemove = [...user.classes];

          for (const userClass of classesToRemove) {
            try {
              const channelName = `${userClass.course}-${userClass.schedule}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              const channel = guild.channels.cache.find(c => c.type === 0 && c.name === channelName);
              if (channel) {
                const remaining = getClassmatesByClass(userClass.course, userClass.schedule).filter(u => u.userId !== target.id);
                if (remaining.length === 0) {
                  await channel.send(`👋 <@${target.id}> was removed. No more students in **${userClass.course} ${userClass.schedule}**. Deleting channel...`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  await channel.delete();
                } else {
                  await channel.send(`👋 <@${target.id}> was removed from **${userClass.course} ${userClass.schedule}** by an admin.`);
                }
              }
            } catch (err) {
              console.error('Channel error:', err.message);
            }
          }

          // Delete user from database
          const db = readDB();
          delete db[target.id];
          writeDB(db);

          await interaction.editReply({
            content: `✅ **${target.username}** has been completely removed from the system!`,
            embeds: [],
            components: []
          });
        }
      );
    }

    // ========================
    // /admin removeresource
    // ========================
    if (sub === 'removeresource') {
      const course = normalizeCourse(interaction.options.getString('course').trim());
      const number = interaction.options.getInteger('number');
      const resources = getResources(course);

      if (resources.length === 0) {
        return interaction.editReply({ content: `⚠️ No resources found for **${course}**!` });
      }

      if (number < 1 || number > resources.length) {
        return interaction.editReply({ content: `⚠️ Invalid number. **${course}** has ${resources.length} resource(s). Pick a number between 1 and ${resources.length}.` });
      }

      const removed = resources[number - 1];
      resources.splice(number - 1, 1);

      const all = require('../utils/resourceManager').readResources();
      all[course] = resources;
      require('../utils/resourceManager').writeResources(all);

      return interaction.editReply({
        content: `✅ Removed resource **"${removed.title}"** from **${course}**!`,
      });
    }

    // ========================
    // /admin clearresources
    // ========================
    if (sub === 'clearresources') {
      const course = normalizeCourse(interaction.options.getString('course').trim());
      const resources = getResources(course);

      if (resources.length === 0) {
        return interaction.editReply({ content: `⚠️ No resources found for **${course}**!` });
      }

      await confirmAction(
        interaction,
        `You are about to wipe all **${resources.length} resource(s)** for **${course}**. This cannot be undone.`,
        async () => {
          const all = require('../utils/resourceManager').readResources();
          delete all[course];
          require('../utils/resourceManager').writeResources(all);

          await interaction.editReply({
            content: `✅ Cleared all resources for **${course}**!`,
            embeds: [],
            components: []
          });
        }
      );
    }

    // ========================
    // /admin wipedata
    // ========================
    if (sub === 'wipedata') {
      const target = interaction.options.getString('target');

      const dataTargets = {
        users: { file: 'users.json', empty: '{}', label: 'Users' },
        streaks: { file: 'streaks.json', empty: '{}', label: 'Streaks' },
        resources: { file: 'resources.json', empty: '{}', label: 'Resources' },
        faqs: { file: 'faqs.json', empty: '[]', label: 'FAQs' }
      };

      const targetLabel = target === 'all' ? '⚠️ ALL DATA' : dataTargets[target].label;

      await confirmAction(
        interaction,
        `You are about to wipe **${targetLabel}**. This is **irreversible**.`,
        async () => {
          if (target === 'all') {
            for (const [, info] of Object.entries(dataTargets)) {
              fs.writeFileSync(path.join(dataDir, info.file), info.empty);
            }
          } else {
            const info = dataTargets[target];
            fs.writeFileSync(path.join(dataDir, info.file), info.empty);
          }

          await interaction.editReply({
            content: `✅ **${targetLabel}** has been wiped successfully!`,
            embeds: [],
            components: []
          });
        }
      );
    }
  }
};