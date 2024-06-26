const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let count = {};
let timeout = 1000 * 20;

const getRow = (id, pages, embeds, randomID) => {
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setLabel('<')
      .setStyle(ButtonStyle.Success)
      .setCustomId('previous' + randomID)
      .setDisabled(pages[id] === 0)
  );
  row.addComponents(
    new ButtonBuilder()
      .setLabel('>')
      .setStyle(ButtonStyle.Success)
      .setCustomId('next' + randomID)
      .setDisabled(pages[id] === embeds.length - 1)
  );

  if (count[id]) {
    let timeLeft = Math.round(timeout / 1000 - (new Date().getTime() - count[id]) / 1000);
    return timeLeft;
  }

  count[id] = new Date().getTime();

  setTimeout(() => (count[id] = null), timeout);

  return row;
};

const editGetRow = (id, pages, embeds, randomID, timedOut = false) => {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setLabel('<')
      .setStyle(ButtonStyle.Success)
      .setCustomId('previous' + randomID)
      .setDisabled(pages[id] === 0 || timedOut === true)
  );
  row.addComponents(
    new ButtonBuilder()
      .setLabel('>')
      .setStyle(ButtonStyle.Success)
      .setCustomId('next' + randomID)
      .setDisabled(pages[id] === embeds.length - 1 || timedOut === true)
  );

  return row;
};

module.exports = { getRow, editGetRow, timeout };
