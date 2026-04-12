module.exports = async (member) => {
  // Find the channel named "welcome" in your server
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === 'welcome'
  );

  if (!welcomeChannel) return;

  await welcomeChannel.send(
    `👋 Welcome to the server, ${member}! We're glad to have you here. Congratulations on passing the UPCAT! Welcome to UP. 🌻`
  );
};