const fs = require('fs');
const path = require('path');

const channelInfo = {
    };

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false,
        emoji: '💚' 
    }));
}

function readConfig() {
    try {
        return { enabled: false, reactOn: false, emoji: '💚', ...(JSON.parse(fs.readFileSync(configPath, 'utf8'))) };
    } catch (_) {
        return { enabled: false, reactOn: false, emoji: '💚' };
    }
}
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        if (!msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر متاح لمالك البوت فقط.', ...channelInfo });
            return;
        }
        const config = readConfig();
        const action = (args?.[0] || 'help').toLowerCase();
        const option = (args?.[1] || '').toLowerCase();
        const on = ['on', 'enable', 'تشغيل', 'نعم'].includes(option);
        const off = ['off', 'disable', 'إيقاف', 'لا'].includes(option);

        if (action === 'on' || action === 'view' || action === 'watch' || action === 'شاهد') {
            config.enabled = action === 'on' ? true : (option ? on : true);
        } else if (action === 'off' || action === 'unwatch' || action === 'لايشاهد') {
            config.enabled = false;
        } else if (action === 'react' || action === 'reaction' || action === 'تفاعل') {
            if (on || ['on','enable'].includes(action)) config.reactOn = true;
            else if (off || ['off','disable'].includes(action)) config.reactOn = false;
            else if (action === 'react' && ['on','enable'].includes(option)) config.reactOn = true;
            else if (action === 'react' && ['off','disable'].includes(option)) config.reactOn = false;
            else {
                await sock.sendMessage(chatId, { text: 'استخدم: .autostatus react on أو .autostatus react off أو .autostatus emoji ❤️', ...channelInfo });
                return;
            }
        } else if (action === 'both' || action === 'كلاهما') {
            config.enabled = on;
            config.reactOn = on;
        } else if (action === 'viewonly' || action === 'مشاهدةفقط') {
            config.enabled = true; config.reactOn = false;
        } else if (action === 'none' || action === 'إيقافالكل') {
            config.enabled = false; config.reactOn = false;
        } else if (action === 'emoji' || action === 'emoj' || action === 'ايموجي' || action === 'إيموجي') {
            const requestedEmoji = args?.slice(1).join(' ').trim();
            if (!requestedEmoji) {
                await sock.sendMessage(chatId, { text: `الإيموجي الحالي للتفاعل: ${config.emoji || '💚'}\nاستخدم: .autostatus emoji ❤️\nأمثلة: 💚 ❤️ 💚 🔥 💜 😂 😍`, ...channelInfo });
                return;
            }
            // Accept a single emoji (including multi-codepoint emoji such as ❤️ or 🥰).
            const emojiMatches = requestedEmoji.match(/\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*/gu);
            if (!emojiMatches || emojiMatches.length !== 1 || requestedEmoji.replace(emojiMatches[0], '').trim() !== '') {
                await sock.sendMessage(chatId, { text: '❌ أرسل إيموجي واحد فقط. مثال: .autostatus emoji ❤️', ...channelInfo });
                return;
            }
            config.emoji = emojiMatches[0];
        } else if (action === 'help') {
            await sock.sendMessage(chatId, { text:
`⚙️ إعدادات مشاهدة الحالات والتفاعل

الحالة الحالية:
👁️ المشاهدة التلقائية: ${config.enabled ? 'مفعّلة' : 'متوقفة'}
${config.emoji || '💚'} إيموجي التفاعل: ${config.emoji || '💚'}\n💚 التفاعل التلقائي: ${config.reactOn ? 'مفعّل' : 'متوقف'}

الأوامر:
.autostatus on       تفعيل المشاهدة
.autostatus off      إيقاف المشاهدة
.autostatus react on تفعيل التفاعل
.autostatus react off إيقاف التفاعل
.autostatus emoji ❤️ تغيير إيموجي التفاعل
.autostatus viewonly مشاهدة بدون تفاعل
.autostatus both on  مشاهدة وتفاعل
.autostatus none     لا مشاهدة ولا تفاعل

وضع البوت العام/الخاص:
.mode Public
.mode Private`, ...channelInfo });
            return;
        } else {
            await sock.sendMessage(chatId, { text: 'أمر غير معروف. أرسل .autostatus لعرض الأوامر.', ...channelInfo });
            return;
        }
        saveConfig(config);
        await sock.sendMessage(chatId, { text:
`✅ تم تحديث الإعدادات
👁️ مشاهدة الحالات: ${config.enabled ? 'مفعّلة' : 'متوقفة'}
${config.emoji || '💚'} إيموجي التفاعل: ${config.emoji || '💚'}
التفاعل مع الحالات: ${config.reactOn ? 'مفعّل' : 'متوقف'}`, ...channelInfo });
    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { text: '❌ تعذر تحديث إعدادات الحالات.', ...channelInfo });
    }
}

// Status viewing and reactions are independent settings.
function isAutoStatusEnabled() {
    return readConfig().enabled === true;
}
function isStatusReactionEnabled() {
    return readConfig().reactOn === true;
}

async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled() || !statusKey?.id) return;
        const participant = statusKey.participant || statusKey.remoteJid;
        await sock.relayMessage('status@broadcast', {
            reactionMessage: {
                key: { remoteJid: 'status@broadcast', id: statusKey.id, participant, fromMe: false },
                text: readConfig().emoji || '💚'
            }
        }, { messageId: statusKey.id, statusJidList: [participant] });
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

async function handleStatusUpdate(sock, status) {
    try {
        const msg = status?.messages?.find(m => m?.key?.remoteJid === 'status@broadcast');
        const key = msg?.key || (status?.key?.remoteJid === 'status@broadcast' ? status.key : null)
            || (status?.reaction?.key?.remoteJid === 'status@broadcast' ? status.reaction.key : null);
        if (!key) return;

        // Mark status as viewed only when viewing is enabled.
        if (isAutoStatusEnabled()) {
            try {
                await sock.readMessages([key]);
            } catch (err) {
                console.error('❌ Error viewing status:', err.message);
            }
        }
        // Reaction setting works independently from the view setting.
        if (isStatusReactionEnabled()) {
            await new Promise(resolve => setTimeout(resolve, 800));
            await reactToStatus(sock, key);
        }
    } catch (error) {
        console.error('❌ Error in status handler:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
}; 