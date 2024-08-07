const {
  EmbedBuilder,
  Colors,
  AttachmentBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const path = require("path");

const ValorantAPIClient = require("../api/valorant-api");
const valorantAPI = new ValorantAPIClient(process.env.HENRIK_API_KEY);

const PartyEmojiManager = require("./PartyEmojiManager");

const { createEmbed } = require("../all/Embeds");
const assets = require("../../utils/valorant/assets.json");
const emojis = require("../../utils/emojis.json");

const commandId = `</valorant view-match:${process.env.VALORANT_COMMAND_ID}>`;

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return "Invalid time";

  const units = [
    [60 * 60, "hour"],
    [60, "minute"],
    [1, "second"],
  ];

  return units
    .reduce((acc, [unitSeconds, unitName]) => {
      const quantity = Math.floor(seconds / unitSeconds);
      seconds %= unitSeconds;
      return quantity
        ? `${acc}${quantity} ${unitName}${quantity > 1 ? "s" : ""} `
        : acc;
    }, "")
    .trim();
}

function formatStatLine(color, label, stat) {
  let formattedString = `${color}${label}`;
  const padding = stat.toString().length - label.length;

  for (let i = 0; i < padding; i++) {
    formattedString += " ";
  }

  return formattedString;
}

function calculateKDA(kills, deaths, assists) {
  let effectiveDeaths = deaths === 0 ? 1 : deaths;
  let kda = (kills + assists) / effectiveDeaths;
  return kda.toFixed(1);
}

let highestScore = 0;
let bestPlayerName = "";

let selectMenuOptions = [];
let i = 0;

function addToSelectMenu(i, emoji, label, value) {
  if (i > 25 || i < 0) return;
  else {
    selectMenuOptions.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setEmoji(emoji)
        .setValue(`${i}-${value}`)
    );
  }
}

function generatePlayerFields(player, emojiManager) {
  const { name, tag, team, party_id, character, stats, currenttier_patched } =
    player;
  const { kills, deaths, assists, headshots, score } = stats;

  i++;

  const agentEmoji =
    assets.agentEmojis[character]?.emoji || ":white_small_square:";
  const partyEmoji = emojiManager.getEmojiForPartyId(player.party_id);

  const isBestPlayer = player.name === bestPlayerName;
  const bestPlayerEmoji = isBestPlayer ? assets.ranks.Mvp.emoji : ""; // Utilisez l'emoji de votre choix

  const colorLetter = team === "Red" ? "\u001b[31m" : "\u001b[34m"; // ANSI colors for red and blue
  const colorStats = "\u001b[33m"; // ANSI color for stats
  const separator = `\u001b[36m|`;

  const [rank, level] =
    currenttier_patched
      .match(/^(\D+)(\d+)$/)
      ?.slice(1)

      .map((s, i) => (i === 1 ? parseInt(s) : s)) || [];

  const rankKey = rank ? rank.replaceAll(" ", "") : "";
  let rankEmoji =
    rankKey && assets.ranks[rankKey]
      ? assets.ranks[rankKey][rankKey != "Radiant" ? String(level) : 1]?.emoji
      : assets.ranks.Unrated[1].emoji;
  rankEmoji =
    currenttier_patched === "Radiant"
      ? assets.ranks.Radiant[1].emoji
      : rankEmoji;

  addToSelectMenu(
    i,
    agentEmoji,
    `${
      team === "Red" ? assets.teams.red.emoji : assets.teams.blue.emoji
    } Infos about ${emojis.arrow} ${name}#${tag}`,
    `${name}#${tag}`
  );

  return {
    name: `${partyEmoji}${bestPlayerEmoji}${agentEmoji}${rankEmoji}\n${name}\n#*${tag}*`,
    value:
      "```ansi\n" +
      `${formatStatLine(colorLetter, "K", kills)}${separator}${formatStatLine(
        colorLetter,
        "D",
        deaths
      )}${separator}${formatStatLine(
        colorLetter,
        "A",
        assists
      )}${separator}${formatStatLine(colorLetter, "CS", score)}\n` +
      `${colorStats}${kills}${separator}${colorStats}${deaths}${separator}${colorStats}${assists}${separator}${colorStats}${score}` +
      "```" +
      "```ansi\n" +
      `${formatStatLine(
        colorLetter,
        "K/D",
        calculateKDA(kills, deaths, assists)
      )}${separator}${formatStatLine(colorLetter, "HS", headshots)}\n` +
      `${colorStats}${calculateKDA(
        kills,
        deaths,
        assists
      )}${separator}${colorStats}${headshots}%` +
      "```",
    inline: true,
  };
}

function generatePlayerDeathMatchFields(player) {
  const { name, tag, team, party_id, character, stats, currenttier_patched } =
    player;
  const { kills, deaths, assists, headshots, score } = stats;

  i++;

  const agentEmoji =
    assets.agentEmojis[character]?.emoji || ":white_small_square:";

  const colorLetter = "\u001b[34m"; // ANSI colors for red and blue
  const colorStats = "\u001b[33m"; // ANSI color for stats
  const separator = `\u001b[36m|`;

  addToSelectMenu(
    i,
    agentEmoji,
    `#${i} Infos about ${emojis.arrow} ${name}#${tag}`,
    `${name}#${tag}`
  );

  return {
    name: `\`#${i}\`${agentEmoji}\n${name}\n#*${tag}*`,
    value:
      "```ansi\n" +
      `${formatStatLine(colorLetter, "K", kills)}${separator}${formatStatLine(
        colorLetter,
        "D",
        deaths
      )}${separator}${formatStatLine(colorLetter, "A", assists)}\n` +
      `${colorStats}${kills}${separator}${colorStats}${deaths}${separator}${colorStats}${assists}` +
      "```",
    inline: true,
  };
}

function addInlineFields(fields) {
  // Cette fonction ajoute des champs vides pour faire en sorte que le nombre total de champs soit un multiple de trois.
  while (fields.length % 3 !== 0) {
    fields.push({ name: "\u200B", value: "\u200B", inline: true });
  }
  return fields;
}

function createRoundStrings(rounds, assets, gamemode) {
  let normalRoundsStr = "";
  let overTimeStr = "";
  let overtimeEmojiCount = 0;
  let roundsSkipped = 0; // Pour compter les rounds d'overtime non inclus

  rounds.forEach((round, index) => {
    let team = round.winning_team === "Red" ? "red" : "blue";

    const winCondition =
      round.end_type === "Eliminated"
        ? "eliminated"
        : round.end_type === "Bomb defused"
        ? "defused"
        : round.end_type === "Bomb detonated"
        ? "detonated"
        : round.end_type === "Surrendered"
        ? "surrendered"
        : "time";

    const roundSymbol = assets.rounds[team][winCondition];

    switch (gamemode) {
      case "Swiftplay":
        if (index === 5) normalRoundsStr += " / ";
        break;
      case "Spike Rush":
        if (index === 4) normalRoundsStr += " / ";
        break;
      default:
        if (index === 12) normalRoundsStr += " / ";
        break;
    }

    if (index < 24) {
      normalRoundsStr += roundSymbol; // Ajoute simplement les symboles sans séparateur
    } else {
      // Détermine le séparateur basé sur le nombre d'émojis ajoutés jusqu'à présent
      let separator =
        overtimeEmojiCount % 2 === 0 && overtimeEmojiCount > 0
          ? " - "
          : overtimeEmojiCount > 0
          ? "/"
          : "";
      let potentialStr = overTimeStr + separator + roundSymbol;
      let moreRoundsText = ` ${rounds.length - index} more rounds...`;

      // Vérifie si l'ajout de l'emoji actuel + le texte de rounds restants dépasse la limite
      if ((potentialStr + moreRoundsText).length > 1024) {
        // Trouve combien d'emojis doivent être supprimés pour faire de la place
        while (
          (potentialStr + moreRoundsText).length > 1024 &&
          overtimeEmojiCount > 0
        ) {
          let lastSeparatorIndex =
            potentialStr.lastIndexOf(" - ") !== -1
              ? potentialStr.lastIndexOf(" - ")
              : potentialStr.lastIndexOf("/");
          potentialStr = potentialStr.substring(
            0,
            lastSeparatorIndex !== -1 ? lastSeparatorIndex : 0
          );
          overtimeEmojiCount--; // Réduit le compteur d'émojis car on en a supprimé
          if (overtimeEmojiCount % 2 === 0) {
            // Ajuste pour le pattern de séparation
            moreRoundsText = ` ${rounds.length - index + 1} more rounds...`; // Ajuste le nombre de rounds restants
          }
        }
        overTimeStr = potentialStr; // Met à jour la chaîne avec les suppressions
        return; // Sort de la boucle; le reste des rounds sera ignoré
      }

      // Ajoute le nouveau symbole et met à jour le compteur si la limite n'est pas atteinte
      overTimeStr += separator + roundSymbol;
      overtimeEmojiCount++;
    }
  });

  // Ajoute le texte des rounds restants s'il y a eu des suppressions
  if (overtimeEmojiCount < rounds.length - 24) {
    overTimeStr += ` ${rounds.length - 24 - overtimeEmojiCount} more rounds...`;
  }

  return { normalRoundsStr, overTimeStr };
}

class MatchEmbed {
  constructor(interaction, puuid, region) {
    this.interaction = interaction;
    this.puuid = puuid;
    this.region = region;
    this.matchId;
  }

  async getLastMatch() {
    const matches = await valorantAPI.getMatchesByPUUID({
      region: this.region,
      puuid: this.puuid,
    });
    this.matchId = matches.data[0].metadata.matchid;
  }

  async setMatchId(matchId) {
    this.matchId = matchId;
  }

  async fetchMMRDetails() {
    const declaredPuuid = await this.puuid;
    const mmrResponse = await valorantAPI.getMMRByPUUID({
      version: "v1",
      region: this.region,
      puuid: declaredPuuid,
    });

    if (!mmrResponse || mmrResponse.status !== 200) {
      throw new Error(`Could not fetch MMR details`);
    }

    return mmrResponse.data;
  }

  async generate() {
    try {
      const matchDetails = await valorantAPI.getMatch(this.matchId);

      if (!matchDetails || matchDetails.status !== 200) {
        console.error("Error fetching match details:", matchDetails.error);
        await this.interaction.editReply({
          embeds: [
            await createEmbed.embed(
              `${emojis.error} Error occurred during match retrieval`,
              Colors.Red
            ),
          ],
        });
        return;
      }

      const matchData = matchDetails.data;
      const playersData = matchData.players;
      const { red, blue } = matchData.teams;

      function sortPlayersByScore(players) {
        return players.sort((a, b) => b.stats.kills - a.stats.kills);
      }

      const mode = matchData.metadata.mode;

      let player = null;

      if (this.puuid != null) {
        player = playersData.all_players.find((p) => p.puuid === this.puuid);
      }

      await playersData.all_players.forEach((player) => {
        const { name, stats } = player;
        const { score } = stats;

        if (score > highestScore) {
          highestScore = score;
          bestPlayerName = name;
        }
      });

      const matchEmbed = new EmbedBuilder()
        .setColor(Colors.Purple)
        // .setTitle(
        //   `${emojis.valorant} Match Details for ${matchData.metadata.map}`
        // )
        .setDescription(
          `## ${emojis.valorant}  ${
            this.puuid != null
              ? `Last match details of \`${player.name}#${player.tag}\``
              : `Match Details for \`${this.matchId}\``
          }\n` +
            `Gamemode: ${mode}\n` +
            `Map: ${matchData.metadata.map}\n` +
            `Game played on : <t:${matchData.metadata.game_start}:F> - <t:${matchData.metadata.game_start}:R>\n` +
            `Duration: **${formatDuration(
              matchData.metadata.game_length
            )}**\n\n` +
            `Save the match ID for future reference\n` +
            `For example:\n${commandId} \`match_id: ${this.matchId}\``
        )
        .setTimestamp();

      const draw =
        red.has_won === false && blue.has_won === false ? true : false;

      switch (mode) {
        case "Deathmatch":
          const players = sortPlayersByScore(playersData.all_players).map((p) =>
            generatePlayerDeathMatchFields(p)
          );
          const playersFields = addInlineFields(players);
          matchEmbed.addFields([
            {
              name: `Players list:`,
              value: "\u200B",
            },
          ]);
          matchEmbed.addFields(playersFields);
          break;

        default:
          const partys = playersData.all_players.reduce((acc, player) => {
            if (!acc[player.party_id]) {
              acc[player.party_id] = [];
            }
            acc[player.party_id].push(player.name);
            return acc;
          }, {});

          let emojiManager = new PartyEmojiManager();

          const partyList = Object.keys(partys)
            .map((partyId, index) => {
              const partyEmoji = emojiManager.getEmojiForPartyId(partyId);
              return `${partyEmoji} Party ${index + 1}`;
            })
            .reduce((acc, item, index) => {
              const groupIndex = Math.floor(index / 5);
              if (!acc[groupIndex]) acc[groupIndex] = [];
              acc[groupIndex].push(item);
              return acc;
            }, [])
            .map((group) => group.join(" | "))
            .join("\n");

          matchEmbed.addFields({
            name: `Current parties:`,
            value: partyList || "No partys found (error)",
            inline: false,
          });

          const redTeamPlayers = await sortPlayersByScore(playersData.red).map(
            (p) => generatePlayerFields(p, emojiManager)
          );
          const blueTeamPlayers = await sortPlayersByScore(
            playersData.blue
          ).map((p) => generatePlayerFields(p, emojiManager));

          const redTeamFields = addInlineFields(redTeamPlayers);
          const blueTeamFields = addInlineFields(blueTeamPlayers);

          matchEmbed.addFields([
            {
              name: `${assets.teams.red.emoji} | Red Team ${emojis.arrow} ${
                red.rounds_won
              } ${
                mode != "Team Deathmatch"
                  ? `Round${red.rounds_won > 1 ? "s" : ""} win`
                  : `Point${red.rounds_won > 1 ? "s" : ""}`
              } ${
                draw
                  ? emojis.leaderboard
                  : red.has_won
                  ? emojis.leaderboard
                  : ""
              }`,
              value: "\u200B",
            },
          ]);

          matchEmbed.addFields(redTeamFields);

          //{ name: "\u200B", value: "\u200B", inline: true }, // Spacer
          matchEmbed.addFields([
            {
              name: `${assets.teams.blue.emoji} | Blue Team ${emojis.arrow} ${
                blue.rounds_won
              } ${
                mode != "Team Deathmatch"
                  ? `Round${red.rounds_won > 1 ? "s" : ""} win`
                  : `Point${red.rounds_won > 1 ? "s" : ""}`
              } ${
                draw
                  ? emojis.leaderboard
                  : blue.has_won
                  ? emojis.leaderboard
                  : ""
              }`,
              value: "\u200B",
            },
          ]);

          matchEmbed.addFields(blueTeamFields);
          break;
      }

      switch (mode) {
        case "Deathmatch":
          break;
        case "Escalation":
          break;
        case "Team Deathmatch":
          break;
        default:
          const { normalRoundsStr, overTimeStr } = createRoundStrings(
            matchData.rounds,
            assets,
            mode
          );

          matchEmbed.addFields([
            {
              name: "Rounds list:",
              value: `\`/\` ${emojis.arrow} Switching site\n${normalRoundsStr}`,
              inline: false,
            },
          ]);
          overTimeStr
            ? matchEmbed.addFields([
                {
                  name: "OverTime:",
                  value: `${overTimeStr}`,
                  inline: false,
                },
              ])
            : "";
          break;
      }

      let status = null;

      if (player) {
        const playerTeam = player.team === "Blue" ? "blue" : "red";
        status = matchData.teams[playerTeam].has_won === true ? "win" : "lost";
      }

      switch (mode) {
        case "Deathmatch":
          matchEmbed.setThumbnail(
            "https://static.wikia.nocookie.net/valorant/images/3/3c/Deathmatch.png"
          );
          break;
        case "Swiftplay":
          matchEmbed.setThumbnail(
            "https://static.wikia.nocookie.net/valorant/images/9/98/Swiftplay.png/revision/latest/scale-to-width-down/85?cb=20221206165230"
          );
          break;
        case "Spike Rush":
          matchEmbed.setThumbnail(
            "https://static.wikia.nocookie.net/valorant/images/f/f1/Spike_Rush.png/revision/latest/scale-to-width-down/85?cb=20200607210504"
          );
          break;
        case "Escalation":
          matchEmbed.setThumbnail(
            "https://static.wikia.nocookie.net/valorant/images/6/6a/Escalation.png/revision/latest/scale-to-width-down/85?cb=20210611142525"
          );
          break;
        case "Team Deathmatch":
          matchEmbed.setThumbnail(
            "https://static.wikia.nocookie.net/valorant/images/9/9c/Team_Deathmatch.png/revision/latest/scale-to-width-down/85?cb=20230627133018"
          );
          break;

        case "Competitive":
          const mmrData = status != null ? await this.fetchMMRDetails() : null;
          const image =
            "https://static.wikia.nocookie.net/valorant/images/b/b2/TX_CompetitiveTier_Large_0.png/revision/latest?cb=20200623203757";
          const mmrImages = mmrData?.images;
          const embedThumbnail =
            status != null
              ? status === "win"
                ? mmrImages?.triangle_up
                : mmrImages?.triangle_down
              : image;
          matchEmbed.setThumbnail(
            embedThumbnail != null ? embedThumbnail : image
          );
          break;

        default:
          matchEmbed.setThumbnail(
            "https://static.wikia.nocookie.net/valorant/images/9/9b/Plant_Defuse_Mode.png"
          );
          break;
      }

      let imageName;

      switch (mode) {
        case "Deathmatch":
          imageName = "name";
          break;
        default:
          imageName =
            status != null
              ? draw
                ? "imgDraw"
                : status === "win"
                ? "imgWon"
                : "imgLost"
              : "name";
          break;
      }

      const imageNamePath = assets.maps[matchData.metadata.map]
        ? assets.maps[matchData.metadata.map][imageName]
        : false;
      let imagePath;

      if (imageNamePath) {
        imagePath = path.join(process.cwd(), imageNamePath);
      } else {
        imagePath = path.join(process.cwd(), assets.maps.Ascent.img);
      }

      const attachment = new AttachmentBuilder(imagePath, { name: "Map.png" });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("more-infos-match-embed")
        .setMinValues(1)
        .setMaxValues(1)
        .setPlaceholder("Select the player you want to get more infos");

      selectMenu.addOptions(selectMenuOptions);

      await this.interaction.editReply({
        embeds: [matchEmbed],
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        files: [attachment],
      });
    } catch (error) {
      console.error("Error fetching match details:", error);
      await this.interaction.editReply({
        embeds: [
          await createEmbed.embed(
            `${emojis.error} Error occurred during match retrieval`,
            Colors.Red
          ),
        ],
      });
    }
  }
}

module.exports = MatchEmbed;
