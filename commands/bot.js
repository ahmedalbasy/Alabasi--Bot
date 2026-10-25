const { default: makeWASocket, useMultiFileAuthState, Browsers, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');

async function botCommand(sock, chatId, message) {
    const replyTo = message.key.remoteJid || chatId;
    const senderNumber = (message.key.participant || message.key.remoteJid || '').split('@')[0].split(':')[0];
    let pairingSocket;
    let connected = false;
    let failureSent = false;

    try {
        const userNumber = String(senderNumber).replace(/[^0-9]/g, '');
        if (userNumber.length < 8 || userNumber.length > 15) {
            await sock.sendMessage(chatId, { text: '❌ تعذّر تحديد رقم الهاتف. استخدم الأمر في محادثة خاصة مع البوت، ثم حاول مرة أخرى.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(replyTo, { react: { text: '🐢', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, {
            text: '*╭━━━〔 🐢 SILA MD 🐢 〕━━━┈⊷*\n*┃🐢│ جارٍ بدء عملية الربط...*\n*╰━━━━━━━━━━━━━━━┈⊷*'
        }, { quoted: message });

        // Keep each requested number's credentials separate from the main bot session.
        const sessionPath = path.join(process.cwd(), 'session', `session_${userNumber}`);
        await fs.ensureDir(sessionPath);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        pairingSocket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
            markOnlineOnConnect: true,
            connectTimeoutMs: 60_000,
            defaultQueryTimeoutMs: 60_000
        });

        pairingSocket.ev.on('creds.update', async () => {
            try { await saveCreds(); } catch (e) { console.error('تعذّر حفظ بيانات الجلسة:', e.message); }
        });

        // Register connection handling BEFORE requesting the code to avoid missing early events.
        pairingSocket.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                connected = true;
                await sock.sendMessage(chatId, {
                    text: `*╭━━━〔 🐢 SILA MD 🐢 〕━━━┈⊷*\n*┃✅│ تم ربط واتساب بنجاح!*\n*┃📱│ الرقم: ${userNumber}*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\nتم حفظ بيانات الجلسة. إذا لم يبدأ البوت على هذا الرقم تلقائيًا، فذلك لأن تشغيل حساب إضافي يحتاج إلى تهيئته كاتصال مستقل في الاستضافة.`
                }, { quoted: message }).catch(() => {});
                // Let the credential update finish before releasing this pairing connection.
                setTimeout(() => pairingSocket?.end(undefined), 5000);
            }
            if (connection === 'close' && !connected && !failureSent) {
                failureSent = true;
                const status = lastDisconnect?.error?.output?.statusCode;
                const detail = status ? `\nرمز الخطأ: ${status}` : '';
                await sock.sendMessage(chatId, {
                    text: `❌ انقطع اتصال الربط قبل اكتماله.${detail}\nتأكد من اتصال الإنترنت وحدّث المكتبة إذا استمرت المشكلة، ثم أعد المحاولة بالأمر .bot.`
                }, { quoted: message }).catch(() => {});
            }
        });

        await delay(1500);
        if (state.creds.registered) {
            await sock.sendMessage(chatId, {
                text: 'ℹ️ توجد جلسة محفوظة لهذا الرقم بالفعل. لا تحذف ملفات الجلسة قبل أخذ نسخة احتياطية.'
            }, { quoted: message });
            return;
        }

        let pairingCode;
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                pairingCode = await pairingSocket.requestPairingCode(userNumber);
                if (pairingCode) break;
                throw new Error('لم تُرجع خدمة واتساب رمزًا');
            } catch (error) {
                lastError = error;
                console.warn(`محاولة طلب رمز الربط ${attempt} فشلت:`, error.message);
                if (attempt < 3) await delay(2500);
            }
        }
        if (!pairingCode) throw lastError || new Error('تعذّر إنشاء رمز الربط');

        await sock.sendMessage(chatId, {
            text: `*╭━━━〔 🐢 SILA MD 🐢 〕━━━┈⊷*\n*┃🔐│ تم إنشاء رمز الربط*\n*┃📱│ الرقم: ${userNumber}*\n*┃🔑│ الرمز: ${pairingCode}*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\n*طريقة الربط:*\n١. افتح واتساب على الهاتف المطلوب.\n٢. افتح الإعدادات ثم الأجهزة المرتبطة.\n٣. اختر ربط جهاز ثم الربط باستخدام رقم الهاتف.\n٤. أدخل الرمز أعلاه.\n\n⚠️ لا تشارك رمز الربط مع أي شخص.`
        }, { quoted: message });
    } catch (error) {
        console.error('خطأ في أمر الربط .bot:', error);
        await sock.sendMessage(chatId, {
            text: `❌ تعذّر إنشاء رمز الربط.\nالسبب: ${error?.message || 'خطأ غير معروف'}\n\nتحقق من اتصال الاستضافة وتوافق مكتبة Baileys، ثم حاول مجددًا.`
        }, { quoted: message }).catch(() => {});
        if (pairingSocket && !connected) pairingSocket.end(undefined);
    }
}

module.exports = botCommand;
