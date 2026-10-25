const express = require( 'express' );
const app = express();
app.get( '/' , (req,res)=> {
  res.sendFile(__dirname +  '/sila.html' );
});
app.listen(process.env.PORT || 3000, ()=> console.log( Website running ));

require( './settings' )
const fs = require( 'fs' )
const chalk = require( 'chalk' )
const path = require( 'path' )
const axios = require( 'axios' )
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require( './main' );
const PhoneNumber = require( awesome-phonenumber )
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require( './lib/exif' )
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require( './lib/myfunc' )
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const { rmSync } = require( 'fs' )
const store = require( './lib/lightweight_store' )
store.readFromFile()
const settings = require( './settings' )
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

let phoneNumber = "967739020737"
let owner = JSON.parse(fs.readFileSync( ./data/owner.json ))
global.botname = "SILA MD"
global.themeemoji = "•"

async function startXeonBotInc() {
    let { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState( ./session )
    const msgRetryCounterCache = new NodeCache()
    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level:  silent  }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
    })
    store.bind(XeonBotInc.ev)

    XeonBotInc.ev.on( messages.upsert , async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] ===  ephemeralMessage ) ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid ===  status@broadcast ) return
            if (mek.key.id.startsWith( BAE5 ) && mek.key.id.length === 16) return
            await handleMessages(XeonBotInc, chatUpdate, true)
        } catch (err) {
            console.error("Error:", err)
        }
    })

    if (!XeonBotInc.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`Your Pairing Code : ${code}`)
            } catch (error) {
                console.error( Error requesting pairing code: , error)
            }
        }, 3000)
    }

    XeonBotInc.ev.on( connection.update , async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(`Bot Connected Successfully!`)
        }
        if (connection ===  close ) {
            startXeonBotInc()
        }
    })
    XeonBotInc.ev.on( creds.update , saveCreds)
    return XeonBotInc
}
startXeonBotInc()
