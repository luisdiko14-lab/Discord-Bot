require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const commandsList = require('./commands');

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID || null;
if (!TOKEN) {
  console.error('DISCORD_TOKEN is required in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();
for (const cmd of commandsList) client.commands.set(cmd.data.name, cmd);

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // register commands: quickly register to guild if GUILD_ID provided, otherwise global
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const deployData = commandsList.map(c => {
    const entry = { name: c.data.name, description: c.data.description, options: c.data.options || [] };
    if (c.data.defaultPermission !== undefined) entry.defaultPermission = c.data.defaultPermission;
    return entry;
  });

  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: deployData });
      console.log('Registered commands to guild', GUILD_ID);
    } else {
      await rest.put(Routes.applicationCommands(client.user.id), { body: deployData });
      console.log('Registered global commands (can take up to 1 hour to appear)');
    }
  } catch (err) {
    console.error('Failed to register commands', err);
  }

  client.user.setActivity({ name: 'with friends', type: 0 });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return interaction.reply({ content: 'Command not found.', ephemeral: true });
  try {
    await cmd.execute(interaction, client);
  } catch (err) {
    console.error('Command error', err);
    if (!interaction.replied) await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

client.login(TOKEN);