const express = require("express");
const uuid = require("uuid");
const ws = require("ws");

const app = express();

app.get("/", (_, res) => {
    res.sendFile(__dirname + "/public/index.htm");
});

app.use(express.static("public"));

const wss = new ws.Server({server: app.listen(3000)});

function parseMessage(data) {
    try {
        let victim = JSON.parse(data);
        if(victim && typeof victim === "object") {
            return victim;
        }
    } catch(e) {}
    return null;
}

wss.on("connection", sock => {
    sock.id = uuid.v4();
    sock.last = Date.now();

    sock.on("close", (code, reason) => {
        // ...
    });

    sock.on("message", data => {
        // 4 KiB limit - 44 bytes for UUID in JSON format = 4052 bytes ~ahill
        if(data.length <= 4052) {
            let msg = parseMessage(data);
            if(msg) {
                // Mark all messages from the client so we have *some* idea of who is who! ~ahill
                msg.id = sock.id;
                if(Date.now() - sock.last >= 1000) {
                    sock.last = Date.now();
                    // Once we've passed all of our tests, it's time to broadcast the message. ~ahill
                    let payload = JSON.stringify(msg);
                    wss.clients.forEach(client => {
                        if(client.readyState === ws.WebSocket.OPEN) {
                            client.send(payload);
                        }
                    });
                }
            }
        }
    });
});