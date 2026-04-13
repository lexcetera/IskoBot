const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const colleges = [
  'College of Architecture',
  'College of Arts and Letters',
  'College of Education',
  'College of Engineering',
  'College of Fine Arts',
  'College of Home Economics',
  'College of Human Kinetics',
  'College of Law',
  'College of Media and Communication',
  'College of Music',
  'College of Science',
  'College of Social Sciences and Philosophy',
  'National College of Public Administration and Governance',
  'School of Economics',
  'School of Library and Information Studies',
  'School of Statistics',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collegeinfo')
    .setDescription('Show how many students are registered per college')
    .addStringOption(o =>
      o.setName('college')
        .setDescription('Specific college to look up (optional)')
        .setRequired(false)
        .addChoices(
          { name: 'College of Architecture', value: 'College of Architecture' },
          { name: 'College of Arts and Letters', value: 'College of Arts and Letters' },
          { name: 'College of Education', value: 'College of Education' },
          { name: 'College of Engineering', value: 'College of Engineering' },
          { name: 'College of Fine Arts', value: 'College of Fine Arts' },
          { name: 'College of Home Economics', value: 'College of Home Economics' },
          { name: 'College of Human Kinetics', value: 'College of Human Kinetics' },
          { name: 'College of Law', value: 'College of Law' },
          { name: 'College of Media and Communication', value: 'College of Media and Communication' },
          { name: 'College of Music', value: 'College of Music' },
          { name: 'College of Science', value: 'College of Science' },
          { name: 'College of Social Sciences and Philosophy', value: 'College of Social Sciences and Philosophy' },
          { name: 'National College of Public Administration and Governance', value: 'National College of Public Administration and Governance' },
          { name: 'School of Economics', value: 'School of Economics' },
          { name: 'School of Library and Information Studies', value: 'School of Library and Information Studies' },
          { name: 'School of Statistics', value: 'School of Statistics' }
        )),

  async execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);
    const selectedCollege = interaction.options.getString('college');

    if (selectedCollege) {
      const role = guild.roles.cache.find(r => r.name === selectedCollege);

      if (!role) {
        return interaction.editReply({
          content: `⚠️ No role found for **${selectedCollege}**. Make sure the role exists in the server!`,
        });
      }

      const members = role.members;
      const memberList = members.size > 0
        ? members.map(m => `• <@${m.id}> (${m.user.username})`).join('\n')
        : 'No students registered yet';

      const embed = new EmbedBuilder()
        .setTitle(`🎓 ${selectedCollege}`)
        .addFields(
          { name: '👥 Total Students', value: `${members.size}`, inline: true },
          { name: '📋 Student List', value: memberList }
        )
        .setColor(0x5865F2)
        .setFooter({ text: 'Iskord Community Server' });

      return interaction.editReply({ embeds: [embed] });
    }

    const counts = [];

    for (const collegeName of colleges) {
      const role = guild.roles.cache.find(r => r.name === collegeName);
      counts.push({ name: collegeName, count: role ? role.members.size : 0 });
    }

    counts.sort((a, b) => b.count - a.count);

    const list = counts
      .map(c => `• **${c.name}** — ${c.count} student(s)`)
      .join('\n');

    const total = counts.reduce((acc, c) => acc + c.count, 0);

    const embed = new EmbedBuilder()
      .setTitle('🎓 College Breakdown')
      .setDescription(list)
      .addFields({ name: '👥 Total Students with College Roles', value: `${total}` })
      .setColor(0x5865F2)
      .setFooter({ text: 'Iskord Community Server' });

    await interaction.editReply({ embeds: [embed] });
  }
};