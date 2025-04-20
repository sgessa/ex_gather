import ChatMsgPacket from "../packets/chat_msg_packet";
import { CHAT_TYPE, PUBLIC_DEST } from "../const/chat_const";
import ChatMessageController from "../controllers/chat/chat_message_controller.js";
import ChatBubbleController from "../controllers/chat/chat_bubble_controller.js";
export default class ChatManager {
  constructor(scene) {
    this.scene = scene;
    this.actorsManager = scene.actorsManager;
    this.socketManager = scene.socketManager;

    this.currentDest = PUBLIC_DEST;

    this.bubbles = new Map();
    this.messages = new Map();
    this.messages.set(this.currentDest, []);

    this.hook();
  }

  hook() {
    document.querySelector("#chat-send-btn").addEventListener('click', (event) => {
      event.preventDefault();
      this.sendMessage();
    });

    document.querySelector("#chat-input").addEventListener('keyup', (event) => {
      if (event.key !== "Enter") return;

      event.preventDefault();
      this.sendMessage();
    });

    document.querySelector("#chat-toggle-btn").addEventListener('click', (event) => {
      event.preventDefault();
      this.toggle();
    });

    document.querySelector("#chat-close-btn").addEventListener('click', (event) => {
      event.preventDefault();
      this.toggle();
    });

    document.querySelector(".chat-dm").addEventListener('click', (event) => {
      const dest = event.currentTarget.dataset.dest;
      this.toggleDest(dest);
    });

    document.querySelector("#chat-toggle-btn").classList.remove('hidden');
  }

  toggle() {
    document.querySelector('#chat-sidebar').classList.toggle('translate-x-full');
  }

  toggleDest(dest) {
    for (let message of this.messages.get(this.currentDest)) {
      message.hide();
    }

    this.currentDest = parseInt(dest);

    for (let message of this.messages.get(this.currentDest)) {
      message.show();
    }

    this.scrollDown();
  }

  scrollDown() {
    const chatContainer = document.querySelector("#chat-container")

    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  }

  handleMessage(actorId, chatType, chatMessage) {
    const sender = this.actorsManager.getActor(actorId);
    if (!sender) return;

    switch (chatType) {
      case CHAT_TYPE.SAY:
        if (sender?.proximityController?.inProximity) {
          this.createMessage(sender, PUBLIC_DEST, chatMessage);
          this.createBubble(sender, chatMessage);
        }
        break;
      case CHAT_TYPE.MEGAPHONE:
        this.createMessage(sender, PUBLIC_DEST, chatMessage);
        this.createBubble(sender, chatMessage);
        break;
      case CHAT_TYPE.WHISPER:
        this.createMessage(sender, sender, chatType, chatMessage);
        break;
    }
  }

  createMessage(sender, chatDest, chatMessage) {
    const message = new ChatMessageController(sender, chatMessage);

    if (!this.messages.has(chatDest)) {
      this.messages.set(chatDest, []);
    }

    this.messages.get(chatDest).push(message);

    if (this.currentDest == chatDest) {
      message.show();
      this.scrollDown();
    }
  }

  createBubble(sender, message) {
    const bubble = new ChatBubbleController(this, sender, message);

    if (!this.bubbles.has(sender.id)) {
      this.bubbles.set(sender.id, []);
    }

    this.bubbles.get(sender.id).push(bubble);
  }

  sendMessage() {
    const input = document.querySelector("#chat-input");
    const chatType = this.getChatType();
    const message = input.value;

    const packet = new ChatMsgPacket();
    this.socketManager.push("player_chat", packet.build(
      parseInt(chatType),
      this.currentDest,
      message
    ));

    this.createMessage(this.scene.player, this.currentDest, message);
    this.createBubble(this.scene.player, message);

    input.value = "";
  }

  getChatType() {
    if (this.currentDest) {
      return CHAT_TYPE.WHISPER;
    } else {
      return document.querySelector("#chat-type").value;
    }
  }
}
