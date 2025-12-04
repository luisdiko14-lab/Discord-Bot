```markdown
# Super Discord Bot (example)

This repository contains an example Discord bot built with Node.js and discord.js v14.

Features:
- 20 general slash commands for @everyone (ping, help, avatar, poll, roll, coin, choose, etc.)
- 25 moderation slash commands (createRole, purge, ban, tempban, mute, warn, warnings, lock, slowmode, nick, etc.)
- Simple file-based storage (src/storage.json) for warnings and a couple server settings (mod role, modlog).
- Commands are registered when the bot starts.

Important notes:
- This is a basic example. Temporary actions (tempban, tempmute) are implemented using setTimeout and are NOT persistent across restarts. Use a database or persistent job scheduler for production.
- For meme/joke commands you should integrate with a real API (Reddit, JokeAPI, etc.) if you want fresh content.
- Be careful with permission checks for commands that modify roles, channels, or members.

Setup:
1. Copy the files into a new folder.
2. Create a bot application on the Discord Developer Portal and copy the bot token.
3. Invite the bot to your guild with the needed scopes (applications.commands, bot) and permissions (Manage Roles, Ban Members, Moderate Members, Manage Channels, etc.)
4. Create a `.env` file from `.env.example` and fill in values.
5. Run:
   npm install
   npm start

.env.example:
DISCORD_TOKEN=your-bot-token
GUILD_ID=optional-dev-guild-id (recommended for rapid command registration while developing)
DEFAULT_PREFIX=!

If GUILD_ID is provided, commands will be registered to that guild for immediate availability. Otherwise commands will be registered globally (can take up to 1 hour).

Files:
- src/index.js: main startup + command registration
- src/commands.js: command definitions and handlers (all 45 commands)
- src/utils.js: helper functions and storage helper
- src/storage.json: persisted warnings and settings (created automatically)

If you want me to:
- convert this to Python (discord.py),
- split commands into separate files per command,
- add persistent scheduling for temps,
- or add more advanced features (DB, logs, audit),
tell me which and I’ll update the code.
```