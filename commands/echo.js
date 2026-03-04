module.exports = {
    name: 'echo',
    description: 'Replies with the same message',
    execute: async (bot, message) => {
        const text = message.text || '';
        const echoText = text.replace('!echo ', '');
        await bot.sendMessage(message.from, { text: echoText || 'Nothing to echo!' });
    }
};