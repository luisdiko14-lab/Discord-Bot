// commands.js exports an array of command objects:
// { data: { name, description, options: [...] }, execute: async (interaction, client) => {} }
//
// All commands are implemented as slash commands for simplicity.

const { PermissionFlagsBits } = require('discord.js');
const prettyMs = require('pretty-ms');
const utils = require('./utils');

function requirePerm(member, perm) {
  return member.permissions.has(perm);
}

function parseTimeMinutes(value) {
  // simple parser: number of minutes
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return null;
  return n * 60 * 1000; // ms
}

const commands = [
  // -------------- General commands (20) --------------
  {
    data: {
      name: 'ping',
      description: 'Check bot latency'
    },
    async execute(interaction) {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(`Pong! API: ${interaction.client.ws.ping}ms | Roundtrip: ${latency}ms`);
    }
  },
  {
    data: { name: 'help', description: 'List available commands' },
    async execute(interaction) {
      const names = interaction.client.commands.map(c => `/${c.data.name}`).join(', ');
      await interaction.reply({ content: `Commands: ${names}`, ephemeral: true });
    }
  },
  {
    data: { name: 'info', description: 'Bot info' },
    async execute(interaction) {
      const uptime = prettyMs(Date.now() - interaction.client.uptime, { compact: true });
      await interaction.reply({ content: `I'm a demo bot. Uptime: ${uptime}` });
    }
  },
  {
    data: {
      name: 'avatar',
      description: 'Show a user avatar',
      options: [{ name: 'user', description: 'target', type: 6, required: false }]
    },
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      await interaction.reply({ content: user.displayAvatarURL({ dynamic: true, size: 1024 }) });
    }
  },
  {
    data: { name: 'server', description: 'Show server info' },
    async execute(interaction) {
      const g = interaction.guild;
      await interaction.reply({ content: `Server: ${g.name}\nMembers: ${g.memberCount}\nID: ${g.id}` });
    }
  },
  {
    data: {
      name: 'user',
      description: "Show a member's info",
      options: [{ name: 'user', description: 'member', type: 6, required: false }]
    },
    async execute(interaction) {
      const member = interaction.options.getMember('user') || interaction.member;
      await interaction.reply({ content: `${member.user.tag}\nJoined: ${member.joinedAt}\nID: ${member.id}` });
    }
  },
  {
    data: {
      name: 'poll',
      description: 'Create a quick poll (up to 5 options)',
      options: [
        { name: 'question', description: 'poll question', type: 3, required: true },
        { name: 'option1', description: 'option 1', type: 3, required: true },
        { name: 'option2', description: 'option 2', type: 3, required: true },
        { name: 'option3', description: 'option 3', type: 3, required: false },
        { name: 'option4', description: 'option 4', type: 3, required: false },
        { name: 'option5', description: 'option 5', type: 3, required: false }
      ]
    },
    async execute(interaction) {
      const q = interaction.options.getString('question');
      const opts = [];
      for (let i = 1; i <= 5; i++) {
        const o = interaction.options.getString(`option${i}`);
        if (o) opts.push(o);
      }
      const reply = await interaction.reply({ content: `**${q}**\n\n${opts.map((o,i)=>`${i+1}. ${o}`).join('\n')}`, fetchReply: true });
      const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
      for (let i = 0; i < opts.length; i++) await reply.react(emojis[i]);
    }
  },
  {
    data: {
      name: 'suggest',
      description: 'Create a suggestion',
      options: [{ name: 'text', description: 'your suggestion', type: 3, required: true }]
    },
    async execute(interaction) {
      const text = interaction.options.getString('text');
      await interaction.reply({ content: `Suggestion received: "${text}"`, ephemeral: true });
      const modlog = utils.getSetting(interaction.guild.id, 'modlogChannel');
      if (modlog) {
        const ch = await interaction.guild.channels.fetch(modlog).catch(()=>null);
        if (ch) ch.send({ content: `Suggestion from ${interaction.user.tag}: ${text}` });
      }
    }
  },
  {
    data: { name: 'uptime', description: 'Show bot uptime' },
    async execute(interaction) {
      const ms = Date.now() - interaction.client.uptime;
      await interaction.reply({ content: `Uptime: ${prettyMs(ms)}` });
    }
  },
  {
    data: { name: 'meme', description: 'Return a random meme (placeholder)' },
    async execute(interaction) {
      // placeholder static memes; integrate an API in production
      const memes = [
        'https://i.imgur.com/AfFp7pu.png',
        'https://i.imgur.com/5M0Y5pF.jpg',
        'https://i.imgur.com/3GvwNBf.png'
      ];
      const url = memes[Math.floor(Math.random()*memes.length)];
      await interaction.reply({ content: url });
    }
  },
  {
    data: {
      name: 'roll',
      description: 'Roll a dice. Usage: /roll sides:6',
      options: [{ name: 'sides', description: 'number of sides', type: 4, required: false }]
    },
    async execute(interaction) {
      const s = interaction.options.getInteger('sides') || 6;
      const r = Math.floor(Math.random()*s) + 1;
      await interaction.reply({ content: `🎲 You rolled ${r} (1-${s})` });
    }
  },
  {
    data: { name: 'coin', description: 'Flip a coin' },
    async execute(interaction) {
      await interaction.reply({ content: Math.random() < 0.5 ? 'Heads' : 'Tails' });
    }
  },
  {
    data: {
      name: 'choose',
      description: 'Choose between comma-separated options',
      options: [{ name: 'options', description: 'comma separated list', type: 3, required: true }]
    },
    async execute(interaction) {
      const opts = interaction.options.getString('options').split(',').map(s=>s.trim()).filter(Boolean);
      if (!opts.length) return interaction.reply({ content: 'No options provided.' });
      const pick = opts[Math.floor(Math.random()*opts.length)];
      await interaction.reply({ content: `I choose: ${pick}` });
    }
  },
  {
    data: {
      name: 'say',
      description: 'Make the bot say something (everyone can use)',
      options: [{ name: 'text', description: 'text to say', type: 3, required: true }]
    },
    async execute(interaction) {
      const text = interaction.options.getString('text');
      await interaction.reply({ content: text });
    }
  },
  {
    data: {
      name: 'shout',
      description: 'Shout (uppercase) a message',
      options: [{ name: 'text', description: 'text to shout', type: 3, required: true }]
    },
    async execute(interaction) {
      const t = interaction.options.getString('text');
      await interaction.reply({ content: t.toUpperCase() });
    }
  },
  {
    data: {
      name: 'quote',
      description: 'Return a random quote'
    },
    async execute(interaction) {
      const quotes = [
        "Be yourself; everyone else is already taken. — Oscar Wilde",
        "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
        "The only limit to our realization of tomorrow is our doubts of today. — F. D. Roosevelt"
      ];
      await interaction.reply({ content: quotes[Math.floor(Math.random()*quotes.length)] });
    }
  },
  {
    data: {
      name: 'remind',
      description: 'Set a quick reminder in minutes',
      options: [
        { name: 'minutes', description: 'minutes until reminder', type: 4, required: true },
        { name: 'message', description: 'reminder message', type: 3, required: true }
      ]
    },
    async execute(interaction) {
      const minutes = interaction.options.getInteger('minutes');
      const msg = interaction.options.getString('message');
      await interaction.reply({ content: `I will remind you in ${minutes} minute(s).`, ephemeral: true });
      setTimeout(()=> {
        interaction.user.send({ content: `Reminder: ${msg}` }).catch(()=>{});
      }, minutes * 60 * 1000);
    }
  },
  {
    data: {
      name: 'hug',
      description: 'Send a hug',
      options: [{ name: 'user', description: 'who to hug', type: 6, required: false }]
    },
    async execute(interaction) {
      const u = interaction.options.getUser('user') || interaction.user;
      await interaction.reply({ content: `${interaction.user.username} gives ${u.username} a hug 🤗` });
    }
  },
  {
    data: { name: 'joke', description: 'Tell a joke' },
    async execute(interaction) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything.",
        "I told my computer I needed a break, and it said: No problem — I'll go to sleep."
      ];
      await interaction.reply({ content: jokes[Math.floor(Math.random()*jokes.length)] });
    }
  },
  {
    data: { name: 'stats', description: 'Show bot stats' },
    async execute(interaction) {
      const guilds = interaction.client.guilds.cache.size;
      const users = interaction.client.users.cache.size;
      await interaction.reply({ content: `Guilds: ${guilds}\nCached users: ${users}` });
    }
  },

  // -------------- Moderation commands (25) --------------
  // 1 createRole
  {
    data: {
      name: 'createrole',
      description: 'Create a role (staff only)',
      options: [{ name: 'name', description: 'role name', type: 3, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: 'Missing Manage Roles permission.', ephemeral: true });
      const name = interaction.options.getString('name');
      const role = await interaction.guild.roles.create({ name, reason: `Created by ${interaction.user.tag}` });
      await interaction.reply({ content: `Role created: ${role.name}` });
    }
  },
  // 2 deleteRole
  {
    data: {
      name: 'deleterole',
      description: 'Delete a role (staff only)',
      options: [{ name: 'role', description: 'role', type: 8, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: 'Missing Manage Roles permission.', ephemeral: true });
      const role = interaction.options.getRole('role');
      await role.delete(`Deleted by ${interaction.user.tag}`);
      await interaction.reply({ content: `Deleted role ${role.name}` });
    }
  },
  // 3 addRole
  {
    data: {
      name: 'addrole',
      description: 'Add a role to a user',
      options: [
        { name: 'user', description: 'member', type: 6, required: true },
        { name: 'role', description: 'role', type: 8, required: true }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: 'Missing Manage Roles permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');
      await member.roles.add(role);
      await interaction.reply({ content: `Added ${role.name} to ${member.user.tag}` });
    }
  },
  // 4 removeRole
  {
    data: {
      name: 'removerole',
      description: 'Remove a role from a user',
      options: [
        { name: 'user', description: 'member', type: 6, required: true },
        { name: 'role', description: 'role', type: 8, required: true }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: 'Missing Manage Roles permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');
      await member.roles.remove(role);
      await interaction.reply({ content: `Removed ${role.name} from ${member.user.tag}` });
    }
  },
  // 5 purge
  {
    data: {
      name: 'purge',
      description: 'Bulk delete messages (max 100)',
      options: [{ name: 'amount', description: 'how many', type: 4, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: 'Missing Manage Messages permission.', ephemeral: true });
      const amt = interaction.options.getInteger('amount');
      const channel = interaction.channel;
      const messages = await channel.bulkDelete(Math.min(amt, 100), true).catch(()=>null);
      await interaction.reply({ content: `Deleted ${messages ? messages.size : 0} messages.`, ephemeral: true });
    }
  },
  // 6 kick
  {
    data: {
      name: 'kick',
      description: 'Kick a member',
      options: [
        { name: 'user', description: 'member', type: 6, required: true },
        { name: 'reason', description: 'reason', type: 3, required: false }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.KickMembers)) return interaction.reply({ content: 'Missing Kick Members permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || `By ${interaction.user.tag}`;
      await member.kick(reason);
      await interaction.reply({ content: `Kicked ${member.user.tag} — ${reason}` });
    }
  },
  // 7 ban
  {
    data: {
      name: 'ban',
      description: 'Ban a member',
      options: [
        { name: 'user', description: 'member', type: 6, required: true },
        { name: 'reason', description: 'reason', type: 3, required: false }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.BanMembers)) return interaction.reply({ content: 'Missing Ban Members permission.', ephemeral: true });
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || `By ${interaction.user.tag}`;
      await interaction.guild.bans.create(user.id, { reason });
      await interaction.reply({ content: `Banned ${user.tag} — ${reason}` });
    }
  },
  // 8 tempban
  {
    data: {
      name: 'tempban',
      description: 'Temporarily ban a user (minutes)',
      options: [
        { name: 'user', type: 6, required: true, description: 'member' },
        { name: 'minutes', type: 4, required: true, description: 'duration in minutes' },
        { name: 'reason', type: 3, required: false, description: 'reason' }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.BanMembers)) return interaction.reply({ content: 'Missing Ban Members permission.', ephemeral: true });
      const user = interaction.options.getUser('user');
      const minutes = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('reason') || `By ${interaction.user.tag}`;
      await interaction.guild.bans.create(user.id, { reason });
      await interaction.reply({ content: `Temporarily banned ${user.tag} for ${minutes} minute(s).` });
      setTimeout(async () => {
        await interaction.guild.bans.remove(user.id).catch(()=>{});
      }, minutes * 60 * 1000);
    }
  },
  // 9 unban
  {
    data: {
      name: 'unban',
      description: 'Unban a user by id',
      options: [{ name: 'userid', description: 'user id', type: 3, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.BanMembers)) return interaction.reply({ content: 'Missing Ban Members permission.', ephemeral: true });
      const id = interaction.options.getString('userid');
      await interaction.guild.bans.remove(id).catch(()=>null);
      await interaction.reply({ content: `Unbanned ${id}` });
    }
  },
  // 10 softban
  {
    data: {
      name: 'softban',
      description: 'Softban (ban & unban -> deletes messages)',
      options: [{ name: 'user', description: 'member', type: 6, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.BanMembers)) return interaction.reply({ content: 'Missing Ban Members permission.', ephemeral: true });
      const user = interaction.options.getUser('user');
      await interaction.guild.bans.create(user.id, { deleteMessageSeconds: 24*60*60 });
      await interaction.guild.bans.remove(user.id).catch(()=>null);
      await interaction.reply({ content: `Softbanned ${user.tag}` });
    }
  },
  // 11 mute
  {
    data: {
      name: 'mute',
      description: 'Mute a member (timeout in minutes)',
      options: [
        { name: 'user', type: 6, required: true, description: 'member' },
        { name: 'minutes', type: 4, required: false, description: 'minutes to mute' }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: 'Missing Moderate Members permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      const minutes = interaction.options.getInteger('minutes') || 10;
      await member.timeout(minutes * 60 * 1000, `Muted by ${interaction.user.tag}`).catch(()=>null);
      await interaction.reply({ content: `Timed out ${member.user.tag} for ${minutes} minute(s).` });
    }
  },
  // 12 unmute
  {
    data: {
      name: 'unmute',
      description: 'Remove timeout from member',
      options: [{ name: 'user', description: 'member', type: 6, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: 'Missing Moderate Members permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      await member.timeout(null, `Unmuted by ${interaction.user.tag}`).catch(()=>null);
      await interaction.reply({ content: `Removed timeout for ${member.user.tag}` });
    }
  },
  // 13 timeout (alias of mute)
  {
    data: {
      name: 'timeout',
      description: 'Timeout a member (minutes)',
      options: [
        { name: 'user', type: 6, required: true, description: 'member' },
        { name: 'minutes', type: 4, required: true, description: 'minutes' }
      ]
    },
    async execute(interaction) {
      // reuse mute logic
      if (!requirePerm(interaction.member, PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: 'Missing Moderate Members permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      const minutes = interaction.options.getInteger('minutes');
      await member.timeout(minutes * 60 * 1000, `Timeout by ${interaction.user.tag}`).catch(()=>null);
      await interaction.reply({ content: `Timed out ${member.user.tag} for ${minutes} minute(s)` });
    }
  },
  // 14 lock
  {
    data: {
      name: 'lock',
      description: 'Lock current channel (deny SendMessages for @everyone)'
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'Missing Manage Channels permission.', ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: 'Channel locked.' });
    }
  },
  // 15 unlock
  {
    data: {
      name: 'unlock',
      description: 'Unlock current channel'
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'Missing Manage Channels permission.', ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.reply({ content: 'Channel unlocked.' });
    }
  },
  // 16 slowmode
  {
    data: {
      name: 'slowmode',
      description: 'Set channel slowmode in seconds (0 to disable)',
      options: [{ name: 'seconds', description: 'seconds', type: 4, required: true }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'Missing Manage Channels permission.', ephemeral: true });
      const seconds = interaction.options.getInteger('seconds');
      await interaction.channel.setRateLimitPerUser(Math.max(0, Math.min(seconds, 21600)));
      await interaction.reply({ content: `Set slowmode to ${seconds}s` });
    }
  },
  // 17 nick
  {
    data: {
      name: 'nick',
      description: 'Change your nickname (or another member if permitted)',
      options: [
        { name: 'user', type: 6, required: false, description: 'member' },
        { name: 'nick', type: 3, required: true, description: 'new nickname' }
      ]
    },
    async execute(interaction) {
      const target = interaction.options.getMember('user') || interaction.member;
      if (target.id !== interaction.member.id && !requirePerm(interaction.member, PermissionFlagsBits.ManageNicknames)) return interaction.reply({ content: 'You cannot change others nicknames.', ephemeral: true });
      const nick = interaction.options.getString('nick');
      await target.setNickname(nick).catch(()=>null);
      await interaction.reply({ content: `Set nickname for ${target.user.tag} -> ${nick}` });
    }
  },
  // 18 forcenick (force change another's nick)
  {
    data: {
      name: 'forcenick',
      description: 'Force change a member nickname (Manage Nicknames required)',
      options: [
        { name: 'user', type: 6, required: true, description: 'member' },
        { name: 'nick', type: 3, required: true, description: 'new nickname' }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageNicknames)) return interaction.reply({ content: 'Missing Manage Nicknames permission.', ephemeral: true });
      const target = interaction.options.getMember('user');
      const nick = interaction.options.getString('nick');
      await target.setNickname(nick).catch(()=>null);
      await interaction.reply({ content: `Forced nickname for ${target.user.tag} -> ${nick}` });
    }
  },
  // 19 warn
  {
    data: {
      name: 'warn',
      description: 'Warn a member (stores a warning)',
      options: [
        { name: 'user', type: 6, required: true, description: 'member' },
        { name: 'reason', type: 3, required: false, description: 'reason' }
      ]
    },
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: 'Missing Kick Members permission to warn.', ephemeral: true });
      const member = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      utils.addWarning(interaction.guild.id, member.id, { moderator: interaction.user.tag, reason, timestamp: Date.now() });
      await interaction.reply({ content: `Warned ${member.user.tag} — ${reason}` });
    }
  },
  // 20 unwarn
  {
    data: {
      name: 'unwarn',
      description: 'Remove all warnings for a member',
      options: [{ name: 'user', type: 6, required: true, description: 'member' }]
    },
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: 'Missing permission.', ephemeral: true });
      const member = interaction.options.getMember('user');
      utils.removeWarnings(interaction.guild.id, member.id);
      await interaction.reply({ content: `Removed warnings for ${member.user.tag}` });
    }
  },
  // 21 warnings
  {
    data: {
      name: 'warnings',
      description: 'List warnings for a member',
      options: [{ name: 'user', type: 6, required: true, description: 'member' }]
    },
    async execute(interaction) {
      const member = interaction.options.getMember('user');
      const ws = utils.getWarnings(interaction.guild.id, member.id);
      if (!ws.length) return interaction.reply({ content: `${member.user.tag} has no warnings.` });
      await interaction.reply({ content: `Warnings for ${member.user.tag}:\n${ws.map((w,i)=>`${i+1}. ${w.reason} — by ${w.moderator}`).join('\n')}` });
    }
  },
  // 22 setmodrole
  {
    data: {
      name: 'setmodrole',
      description: 'Set a server mod role (for convenience)',
      options: [{ name: 'role', type: 8, required: true, description: 'role' }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'Missing Manage Guild permission.', ephemeral: true });
      const role = interaction.options.getRole('role');
      utils.setSetting(interaction.guild.id, 'modRole', role.id);
      await interaction.reply({ content: `Mod role set to ${role.name}` });
    }
  },
  // 23 modlog
  {
    data: {
      name: 'setmodlog',
      description: 'Set moderation log channel',
      options: [{ name: 'channel', type: 7, required: true, description: 'channel' }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'Missing Manage Guild permission.', ephemeral: true });
      const ch = interaction.options.getChannel('channel');
      utils.setSetting(interaction.guild.id, 'modlogChannel', ch.id);
      await interaction.reply({ content: `Modlog set to ${ch.name || ch.id}` });
    }
  },
  // 24 massassignrole
  {
    data: {
      name: 'massassign',
      description: 'Assign a role to many members with a role filter (experimental)',
      options: [
        { name: 'role', type: 8, required: true, description: 'role to add' },
        { name: 'filter_role', type: 8, required: false, description: 'only members with this role will be assigned' }
      ]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: 'Missing Manage Roles permission.', ephemeral: true });
      const role = interaction.options.getRole('role');
      const filter = interaction.options.getRole('filter_role');
      await interaction.reply({ content: 'Starting mass assign... (this may take a while)', ephemeral: true });
      const members = (await interaction.guild.members.fetch()).filter(m => !m.user.bot && (!filter || m.roles.cache.has(filter.id)));
      let successes = 0;
      for (const member of members.values()) {
        try {
          await member.roles.add(role);
          successes++;
        } catch (e) {}
      }
      await interaction.followUp({ content: `Assigned role to ${successes}/${members.size} members.`, ephemeral: true });
    }
  },
  // 25 pruneinactive
  {
    data: {
      name: 'pruneinactive',
      description: 'Prune (kick) members inactive for X days (requires Kick Members)',
      options: [{ name: 'days', type: 4, required: true, description: 'days of inactivity' }]
    },
    async execute(interaction) {
      if (!requirePerm(interaction.member, PermissionFlagsBits.KickMembers)) return interaction.reply({ content: 'Missing Kick Members permission.', ephemeral: true });
      const days = interaction.options.getInteger('days');
      const count = await interaction.guild.members.prune({ days, computePrunedCount: true }).catch(()=>null);
      await interaction.reply({ content: `Pruned: ${count || 0}` });
    }
  }
];

module.exports = commands;