const { SESSION_ID } = require('./config');
const { startBot } = require('gifted-baileys'); // main WhatsApp connection
const fs = require('fs');
const path = require('path');

// Load commands
const commands = {};
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands[command.name] = command;
}

(async () => {
    const bot = await startBot({ session: SESSION_ID });
    console.log('Bot is connected and running...');

    bot.on('message', async (message) => {
        const text = message.text || '';
        if (!text.startsWith('!')) return; // commands start with !

        const cmdName = text.split(' ')[0].slice(1); // remove !
        if (commands[cmdName]) {
            try {
                await commands[cmdName].execute(bot, message);
            } catch (err) {
                console.error('Command error:', err);
            }
        } else {
            await bot.sendMessage(message.from, { text: `Unknown command: ${cmdName}` });
        }
    });
})();