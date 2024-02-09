const MESSAGE_HEIGHT = 120; // 1.25in * 96px

var chatroom_height = (window.innerHeight / 10) * 9;
var message_id = 0;
var message_max = (chatroom_height - (chatroom_height % 96)) / 96;
console.log(`message_max = ${message_max}`);

window.addEventListener("resize", () => {
    chatroom_height = (window.innerHeight / 10) * 9;
    message_max = (chatroom_height - (chatroom_height % MESSAGE_HEIGHT)) / MESSAGE_HEIGHT;
    console.log(`message_max = ${message_max}`);
});

document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const room = document.getElementById("chatroom");
    const send = document.getElementById("send");
    const sock = new WebSocket("ws://" + location.hostname + ":3000/");
    const template = document.getElementById("template");
    const toggle = document.getElementById("toggle");

    function sendMessage() {
        let payload = JSON.stringify({content: template.value.replace("&content;", content.value)});
        if(payload.length <= 4052) {
            if(sock.readyState === WebSocket.OPEN) {
                sock.send(payload);
                content.value = "";
            }
        }
    }

    content.addEventListener("keydown", event => {
        if(event.code === "Enter") {
            sendMessage();
        }
    });

    send.addEventListener("click", () => {
        sendMessage();
    });

    sock.addEventListener("close", () => {
        content.setAttribute("disabled", "");
    });

    sock.addEventListener("message", event => {
        let msg = JSON.parse(event.data);
        if(typeof msg.content === "string") {
            if(msg.content.trim() !== "") {
                console.log(`${message_id} ${msg.id}`);
                let frame = document.createElement("iframe");
                frame.setAttribute("id", `msg_${message_id}`);
                frame.classList.add("message");
                frame.setAttribute("sandbox", "allow-same-origin");
                frame.addEventListener("load", () => {
                    frame.contentDocument.write(msg.content);
                });
                while(room.childElementCount >= message_max) {
                    room.removeChild(room.children[0]);
                }
                room.appendChild(frame);
                message_id++;
            }
        }
    });

    toggle.addEventListener("click", () => {
        if(template.style.display === "none") {
            toggle.innerText = "Hide Template";
            template.style.display = "";
        } else {
            toggle.innerText = "Show Template";
            template.style.display = "none";
        }
    });
});