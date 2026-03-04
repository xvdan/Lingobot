const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("gifted-baileys");
const { Boom } = require("@hapi/boom");
require("dotenv").config();

const SESSION_ID = process.env.SESSION_ID;

async function loadSession() {
    if (!SESSION_ID) {
        console.log("❌ No SESSION_ID provided");
        process.exit(1);
    }

    if (!SESSION_ID.startsWith("LINGO~")) {
        console.log("❌ Invalid session format");
        process.exit(1);
    }

    const encoded = SESSION_ID.replace("LINGO~", "");

    const buffer = Buffer.from(encoded, "base64");
    const decompressed = zlib.gunzipSync(buffer);
    const sessionData = JSON.parse(decompressed.toString());

    const sessionPath = "./session";

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath);
    }

    fs.writeFileSync(
        path.join(sessionPath, "creds.json"),
        JSON.stringify(sessionData, null, 2)
    );
}

async function startBot() {

    await loadSession();

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("Connection closed. Reconnecting:", shouldReconnect);

            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("✅ BOT CONNECTED SUCCESSFULLY");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        const from = msg.key.remoteJid;

        if (text === "!ping") {
            await sock.sendMessage(from, { text: "Pong 🏓" });
        }
    });
}

startBot();