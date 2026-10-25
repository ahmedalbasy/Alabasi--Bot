const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        // Step 1: Send reaction first
        await sock.sendMessage(chatId, {
            react: {
                text: '😎', // Emoji ya kucheka
                key: message.key
            }
        });

        const aliveMessage = `
*╭━━━〔 🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 🐢 〕━━━┈⊷*
*┃🐢╭──────────────────*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙾𝙽𝙻𝙸𝙽𝙴*
*┃🐢│ 𝙼𝙾𝙳𝙴 :❯ 𝙿𝚄𝙱𝙻𝙸𝙲*
*┃🐢│ 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 :❯ ${settings.version || '1.𝟶.𝟶'}*
*┃🐢╰──────────────────*
*╰━━━━━━━━━━━━━━━┈⊷*

*𝙱𝙾𝚃 𝙸𝚂 𝙰𝙲𝚃𝙸𝚅𝙴 𝙰𝙽𝙳 𝚁𝚄𝙽𝙽𝙸𝙽𝙶! 🐢*

*╭━━〔 🐢 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂 🐢 〕━━┈⊷*
*┃🐢│ • 𝙶𝚁𝙾𝚄𝙿 𝙼𝙰𝙽𝙰𝙶𝙴𝙼𝙴𝙽𝚃*
*┃🐢│ • 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 𝙿𝚁𝙾𝚃𝙴𝙲𝚃𝙸𝙾𝙽*
*┃🐢│ • 𝙵𝚄𝙽 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂*
*┃🐢│ • 𝙰𝙸 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂*
*┃🐢│ • 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*
*┃🐢│ • 𝙼𝙾𝚁𝙴 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂*
*╰━━━━━━━━━━━━━━━┈⊷*

*𝚃𝚈𝙿𝙴 .𝙼𝙴𝙽𝚄 𝙵𝙾𝚁 𝙵𝚄𝙻𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙻𝙸𝚂𝚃*`;

        await sock.sendMessage(chatId, {
            text: aliveMessage}, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { 
            text: '*𝙱𝙾𝚃 𝙸𝚂 𝙰𝙻𝙸𝚅𝙴 𝙰𝙽𝙳 𝚁𝚄𝙽𝙽𝙸𝙽𝙶! 🐢*' 
        }, { quoted: message });
    }
}

module.exports = aliveCommand;