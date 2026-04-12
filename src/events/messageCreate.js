const faqs = require('../data/faqs.json');
const { recordMessage } = require('../utils/streakManager');
const { classToChannelName } = require('../utils/channelManager');

module.exports = async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Check if message is in a class channel (inside Class Channels category)
  const category = message.channel.parent;
  if (category && category.name.toLowerCase() === 'class channels') {
    recordMessage(message.channel.name, message.author.id);
  }

  // FAQ keyword check
  const faqs2 = require('../data/faqs.json');
  for (const faq of faqs2) {
    if (faq.keywords.some(keyword => content.includes(keyword))) {
      await message.reply(faq.response);
      return;
    }
  }
};