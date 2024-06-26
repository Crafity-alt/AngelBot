const { ApplicationCommandType } = require('discord.js');
const { promisify } = require('util');
const { glob } = require('glob');
const pGlob = promisify(glob);
const Logger = require('../Logger');

module.exports = async client => [
  (await pGlob(`${process.cwd()}/commands/*/*.js`)).map(async commandFile => {
    const command = require(commandFile);

    if (!command.name) return Logger.warn(`Commande non-chargé: pas de nom ↓\nFichier -> ${commandFile}`);
    if (!command.description && command.type != ApplicationCommandType.User && command.type != ApplicationCommandType.Message) return Logger.warn(`Commande non-chargé: pas de description ↓\nFichier -> ${commandFile}`);

    if (!command.permissions) return Logger.warn(`Commande non-chargé: pas de permission ↓\nFichier -> ${commandFile}`);

    // command.permissions.forEach(permission => {
    //   if (!permissionList.includes(permission)) {
    //     return Logger.typo(`Commande non-chargé: erreur de typo sur la permission de la command ↓\nFichier -> ${commandFile}`);
    //   }
    // });
    let commandClient;

    try {
      
      commandClient = client.commands.set(command.name, command);
    
    } catch (error) {
      Logger.warn(`Error -> ${error.message}`);
    }


    
    Logger.command(`Load -> ${command.name}`);
  })
]

const permissionList = ['CREATE_INSTANT_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'ADD_REACTIONS', 'VIEW_AUDIT_LOG', 'PRIORITY_SPEAKER', 'STREAM', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_emojis', 'VIEW_GUILD_INSIGHTS', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'USE_VAD', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'MANAGE_emojis_AND_STICKERS', 'USE_APPLICATION_COMMANDS', 'REQUEST_TO_SPEAK', 'MANAGE_EVENTS', 'MANAGE_THREADS', 'USE_PUBLIC_THREADS', 'CREATE_PUBLIC_THREADS', 'USE_PRIVATE_THREADS', 'CREATE_PRIVATE_THREADS', 'USE_EXTERNAL_STICKERS', 'SEND_MESSAGES_IN_THREADS', 'START_EMBEDDED_ACTIVITIES', 'MODERATE_MEMBERS'];