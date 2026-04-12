require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkAndResetStreaks } = require('./utils/streakManager');

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
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📦 Commands loaded: ${client.commands.size}`);
  client.user.setPresence({
    activities: [
      {
        name: 'stuDYING 📚',
        type: 0 // PLAYING
      }
    ],
    status: 'online'
  });
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