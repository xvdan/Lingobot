module.exports = {
    name: 'ping',
    description: 'Replies with pong',
    execute: async (bot, message) => {
        await bot.sendMessage(message.from, { text: 'Pong!' });
    }
};