const axios = require('axios');
const { sleep } = require('../lib/myfunc');

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q) {
            return await sock.sendMessage(chatId, { text: '📱 أرسل رقم واتساب مع مفتاح الدولة.\nمثال: .pair 9677XXXXXXXX' }, { quoted: message });
        }
        const numbers = q.split(',').map(v => v.replace(/[^0-9]/g, '')).filter(v => v.length >= 8 && v.length <= 15);
        if (!numbers.length) return await sock.sendMessage(chatId, { text: '❌ الرقم غير صحيح. أرسل الرقم الدولي بالأرقام فقط.' }, { quoted: message });

        for (const number of numbers) {
            const result = await sock.onWhatsApp(`${number}@s.whatsapp.net`);
            if (!result?.[0]?.exists) {
                await sock.sendMessage(chatId, { text: `❌ الرقم ${number} غير مسجل في واتساب.` }, { quoted: message });
                continue;
            }
            await sock.sendMessage(chatId, { text: `⏳ جارٍ طلب رمز الربط للرقم ${number}...` }, { quoted: message });
            try {
                const response = await axios.get('https://sila-md-paircode.onrender.com/code', { params: { number }, timeout: 25_000 });
                const code = response.data?.code;
                if (!code || code === 'Service Unavailable') throw new Error('خدمة رمز الربط غير متاحة حاليًا');
                await sleep(1000);
                await sock.sendMessage(chatId, { text: `🔐 رمز الربط للرقم ${number}: *${code}*\n\nافتح واتساب ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف، ثم أدخل الرمز.\n\n⚠️ لا تشارك الرمز مع أحد.` }, { quoted: message });
            } catch (error) {
                console.error('خطأ خدمة رمز الربط:', error.message);
                await sock.sendMessage(chatId, { text: `❌ تعذّر إنشاء رمز الربط للرقم ${number}.\n${error.message || 'حاول مرة أخرى لاحقًا.'}` }, { quoted: message });
            }
        }
    } catch (error) {
        console.error('خطأ في أمر pair:', error);
        await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء طلب رمز الربط. حاول مرة أخرى لاحقًا.' }, { quoted: message });
    }
}
module.exports = pairCommand;
