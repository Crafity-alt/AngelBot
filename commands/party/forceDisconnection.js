const { ApplicationCommandOptionType, Colors, PermissionFlagsBits } = require('discord.js');
const { disconnectAllUsers } = require('../../functions/party/disconnectAllUsers');
const { getAllTheTeam } = require('../../functions/party/getAllTheTeam');
const { createEmbed } = require('../../functions/all/Embeds.js');
const { liveManager } = require('../../functions/fs/LiveManager.js');
const { partyManager } = require('../../functions/fs/PartyManager.js');

const emojis = require('../../utils/emojis.json');
const IDS = require('../../utils/ids.json');

module.exports = {
  name: 'force_disconnection',
  description: 'Force disconnect all memebrs of the party voice channel',
  permissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: 'by_pass_verifications',
      description: 'Bypass',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'yes', value: 'yes' },
        { name: 'no', value: 'no' }
      ]
    },
  ],
  async run(client, interaction) {

    const byPass = interaction.options.getString('by_pass_verifications') || "no";
    const allTeam = await getAllTheTeam("all");
    const isOnLive = await liveManager.getStatus();
    const party = await partyManager.getStatus();

    await interaction.deferReply();

    if (byPass === "no") {
      if (!isOnLive && party || !isOnLive && !party) {

        disconnectAllUsers(client, interaction, IDS.CHANNELS, allTeam);

        await interaction.editReply({ embeds: [await createEmbed.embed(`${emojis.success} Force disconnect - Successfully updated !\n> ByPass verifications > ${byPass === "no" ? "False" : "True"}`)] });

      } else {
        await interaction.editReply({ embeds: [await createEmbed.embed(`${emojis.error} The party is on live !`, Colors.Red)] });
      }
    } else {

      disconnectAllUsers(client, interaction, IDS.CHANNELS, allTeam);

      await interaction.editReply({ embeds: [await createEmbed.embed(`${emojis.success} Force disconnect - Successfully updated !\n> ByPass verifications > ${byPass === "no" ? "False" : "True"}`)] });
    }


  }
};
