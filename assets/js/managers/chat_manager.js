import ChatMsgPacket from "../packets/chat_msg_packet";
import { CHAT_TYPE, CHAT_STATE } from "../const/chat_const";
import ChatMessageController from "../controllers/chat/chat_message_controller.js";
import ChatBubbleController from "../controllers/chat/chat_bubble_controller.js";
export default class ChatManager {
  constructor(scene) {
    this.scene = scene;
    this.actorsManager = scene.actorsManager;
    this.socketManager = scene.socketManager;

    this.bubbles = new Map();

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

    document.querySelector("#chat-toggle-btn").classList.remove('hidden');
  }

  toggle() {
    document.querySelector('#chat-sidebar').classList.toggle('translate-x-full');
  }

  handleMessage(actorId, chatType, chatMessage) {
    const sender = this.actorsManager.getActor(actorId);
    if (!sender) return;

    switch (chatType) {
      case CHAT_TYPE.SAY:
        if (sender?.proximityController?.inProximity) {
          this.createMessage(sender, chatType, chatMessage);
          this.bubbleManager.showBubble(sender, chatMessage);
        }
        break;
      case CHAT_TYPE.MEGAPHONE:
        this.createMessage(sender, chatType, chatMessage);
        this.createBubble(sender, chatMessage);
        break;
      case CHAT_TYPE.WHISPER:
        // TODO
        break;
    }
  }

  createMessage(sender, type, message) {
    new ChatMessageController(sender, type, message);
  }

  createBubble(sender, message) {
    const bubble = new ChatBubbleController(this, sender, message);

    if (!this.bubbles.has(sender.id)) {
      this.bubbles.set(sender.id, []);
    }

    this.bubbles.get(sender.id).push(bubble);
  }

  sendMessage() {
    let input = document.querySelector("#chat-input");
    const message = input.value;
    input.value = "";

    let chatType = document.querySelector("#chat-type").value;

    this.createMessage(this.scene.player, CHAT_TYPE.SAY, message);
    this.createBubble(this.scene.player, message);

    const packet = new ChatMsgPacket();

    this.socketManager.push("player_chat", packet.build(
      parseInt(chatType),
      message
    ));
  }
}
