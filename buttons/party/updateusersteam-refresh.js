const { ActionRowBuilder, CommandInteraction, StringSelectMenuBuilder, UserSelectMenuBuilder, InteractionCollector, StringSelectMenuOptionBuilder, PermissionFlagsBits, Colors } = require('discord.js');
const { updateUsersTeam } = require('../../functions/Party/updateUsersTeam.js');
const { getAllTheTeam } = require('../../functions/Party/getAllTheTeam');
const { teamManager } = require('../../functions/Fs/TeamManager.js');
const { createEmbed } = require('../../functions/All/Embeds');

const emojis = require('../../utils/emojis.json');

module.exports = {
  name: 'updateusersteam-refresh',
  permissions: [PermissionFlagsBits.Administrator],
  async run(client, interaction) {
    try {

      await interaction.deferUpdate();

      const Embed = await interaction.message.embeds[0]
      const EmbedDescription = await Embed.description;

      let team = EmbedDescription.includes("Team 1") ? "1" : "2";

      await updateUsersTeam(client, interaction, team, true);

    } catch (error) {
      // Handle error
    }
  }
};
