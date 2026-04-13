require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkAndResetStreaks } = require('./utils/streakManager');
const { COLLEGE_ROLES } = require('./constants/colleges');
const { readDB } = require('./utils/database');
const { applyClassChannelPermissions, classToChannelName } = require('./utils/channelManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  }
}

// Events
client.once('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📦 Commands loaded: ${client.commands.size}`);

  // Auto-create college roles
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (guild) {
    console.log('🎓 Checking college roles...');
    for (const roleName of COLLEGE_ROLES) {
      const exists = guild.roles.cache.find(r => r.name === roleName);
      if (!exists) {
        await guild.roles.create({
          name: roleName,
          hoist: true,
          mentionable: false,
          permissions: [],
        });
        console.log(`✅ Created role: ${roleName}`);
      }
    }
    console.log('✅ College roles check complete!');

    console.log('🔒 Syncing class channel permissions...');
    await guild.channels.fetch().catch(() => {});
    const db = readDB();
    const seen = new Set();
    for (const user of Object.values(db)) {
      for (const c of user.classes) {
        const key = `${c.course}|||${c.schedule}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const channelName = classToChannelName(c.course, c.schedule);
        const ch = guild.channels.cache.find(x => x.type === 0 && x.name === channelName);
        if (ch) {
          try {
            await applyClassChannelPermissions(guild, ch, c.course, c.schedule);
          } catch (e) {
            console.error(`Permission sync ${channelName}:`, e.message);
          }
        }
      }
    }
    console.log('✅ Class channel permission sync complete!');
  }

  // Check and reset streaks every hour
  setInterval(() => {
    checkAndResetStreaks();
    console.log('✅ Streak check ran');
  }, 1000 * 60 * 60);
});

client.on('messageCreate', require('./events/messageCreate'));
client.on('guildMemberAdd', require('./events/guildMemberAdd'));
client.on('guildMemberRemove', require('./events/guildMemberRemove'));

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    if (interaction.deferred) {
      await interaction.editReply({
        content: 'Something went wrong while executing that command!',
      });
    } else {
      await interaction.reply({
        content: 'Something went wrong while executing that command!',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);