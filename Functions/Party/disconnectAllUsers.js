const { EmbedBuilder, Colors } = require("discord.js");
const { createEmbed } = require("../all/Embeds");
const emojis = require("../../utils/emojis.json");
const IDS = require("../../utils/ids.json");
const { Webhook } = require("../all/WebHooks");

async function disconnectAllUsers(client, interaction, CHANNELS, validUserIds) {
  try {
    const guild = client.guilds.cache.get(IDS.OTHER_IDS.GUILD);
    const array = [];

    for (const userId of validUserIds) {
      const member = await guild.members.fetch(`${userId}`);

      if (
        member.voice.channel !== null &&
        (member.voice.channelId === CHANNELS.END ||
          member.voice.channelId === CHANNELS.TEAM1 ||
          member.voice.channelId === CHANNELS.TEAM2)
      ) {
        await member.voice.disconnect("The party is ended and deleted !");
        array.push(
          `${emojis.disconnection} - User disconnected ${emojis.arrow} ${member}`
        );
      } else {s
        array.push(
          `${emojis.error} - User was already disconnected ${emojis.arrow} ${member}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500)).catch((O_o) => {
        console.log(O_o);
      });
    }

    await Webhook.send(
      guild.channels.cache.get(IDS.CHANNELS.LOG),
      "Party",
      client.user.displayAvatarURL(),
      null,
      [
        await createEmbed.log(
          interaction.member,
          `### ${emojis.info} | LOGS - Users disconneted\n> ${array.join(
            "\n> "
          )}`
        ),
      ]
    );
  } catch (error) {
    console.error("Error moving users to voice channel:", error);
  }
}

module.exports = { disconnectAllUsers };
