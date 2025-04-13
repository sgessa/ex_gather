export default class ChatManager {
  constructor(scene) {
    this.scene = scene;

    this.chatType = {
      SAY: 0,
      MEGAPHONE: 1,
      WHISPER: 2
    };

    this.player = scene.player;
    this.actorsManager = scene.actorsManager;
    this.socketManager = scene.socketManager;
    this.hook();

    this.bubbleVerticalOffset = 40; // pixels above name tag
    this.bubbleSpacing = 10; // space between stacked bubbles
    this.activeChatBubbles = new Map();
  }

  showChatBubble(actorId, message) {
    const actor = actorId === 0 ? this.player : this.actorsManager.getActor(actorId);
    if (!actor || !message) return;

    // Create container
    const bubble = this.scene.add.container(0, 0);
    bubble.setDepth(9999);

    // Create text first to measure it
    const text = this.scene.add.text(0, 0, message, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#000000',
      wordWrap: { width: 200 },
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 1);

    // Calculate bubble dimensions
    const padding = 8;
    const bubbleWidth = Math.max(text.width, 60) + padding * 2;
    const bubbleHeight = text.height + padding * 2;

    // Create bubble background
    const bg = this.scene.add.graphics()
      .fillStyle(0xFFFFFF, 0.9)
      .fillRoundedRect(
        -bubbleWidth/2,
        -bubbleHeight,
        bubbleWidth,
        bubbleHeight,
        12
      )
      .lineStyle(1, 0xCCCCCC)
      .strokeRoundedRect(
        -bubbleWidth/2,
        -bubbleHeight,
        bubbleWidth,
        bubbleHeight,
        12
      );

    text.setPosition(0, -padding);

    bubble.add([bg, text]);

    const existingBubbles = this.getBubbles(actorId);
    const yOffset = existingBubbles.length * (bubbleHeight + 5);

    const xPos = actor.sprite.x;
    const yPos = actor.sprite.y - actor.sprite.displayHeight - 50;
    bubble.setPosition(xPos + 30, yPos - yOffset);

    this.addBubble(actorId, bubble);

    this.scene.time.delayedCall(3000, () => {
      this.removeBubble(actorId, bubble);
    });
  }

  addBubble(actorId, bubble) {
    if (!this.activeChatBubbles.has(actorId)) {
      this.activeChatBubbles.set(actorId, []);
    }
    this.activeChatBubbles.get(actorId).push(bubble);
  }

  getBubbles(actorId) {
    return this.activeChatBubbles.get(actorId) || [];
  }

  removeBubble(actorId, bubble) {
    const bubbles = this.getBubbles(actorId);
    const index = bubbles.indexOf(bubble);
    if (index > -1) {
      bubble.destroy();
      bubbles.splice(index, 1);
    }

    if (bubbles.length === 0) {
      this.activeChatBubbles.delete(actorId);
    } else {
      this.recalculateBubblePositions(bubbles);
    }
  }

  recalculateBubblePositions(bubbles) {
    for (const bubble of bubbles) {
      bubble.setPosition(bubble.x, bubble.y + 50);
    }
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

  receiveMessage(actorId, chatType, chatMessage) {
    const sender = this.actorsManager.getActor(actorId);
    if (!sender) return;

    switch (chatType) {
      case this.chatType.SAY:
        if (sender?.proximityController?.inProximity) {
          this.appendMessage(actorId, chatMessage);
          this.showChatBubble(actorId, chatMessage);
        }
        break;
      case this.chatType.MEGAPHONE:
        this.appendMessage(actorId, chatMessage);
        this.showChatBubble(actorId, chatMessage);
        break;
      case this.chatType.WHISPER:
        // TODO
        break;
    }
  }

  appendMessage(actorId, chatMessage) {
    const actor = this.actorsManager.getActor(actorId);

    const message = document.createElement("div");
    const avatar = document.createElement("div");
    const content = document.createElement("div");
    const author = document.createElement("p");
    const textContainer = document.createElement("div");
    const text = document.createElement("p");
    const time = document.createElement("p");

    if (actor) {
      // Message is from actor
      message.classList = "flex items-start space-x-2";
      avatar.classList = "w-8 h-8 rounded-full bg-gray-700 flex-shrink-0";
      author.classList = "text-sm text-gray-400";
      textContainer.classList = "bg-gray-800 p-3 rounded-lg shadow-sm max-w-xs";
      text.classList = "text-gray-200";
      time.classList = "text-xs text-gray-500 mt-1";

      message.appendChild(avatar);

      author.innerText = actor.username;
      content.appendChild(author);
    } else {
      // Message is from current player
      avatar.classList = "w-8 h-8 rounded-full bg-blue-500 flex-shrink-0";
      message.classList = 'flex items-start space-x-2 justify-end';
      textContainer.classList = "bg-blue-600 text-white p-3 rounded-lg shadow-sm max-w-xs";
      text.classList = "text-gray-200";
      time.classList = "text-xs text-gray-500 mt-1 text-right";
    }

    text.innerText = chatMessage;
    time.innerText = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    textContainer.appendChild(text);
    content.appendChild(textContainer);
    content.appendChild(time);
    message.appendChild(content);

    if (!actor) {
      message.appendChild(avatar);
    }

    document.querySelector("#chat-container").appendChild(message);
  }

  sendMessage() {
    let input = document.querySelector("#chat-input");
    const message = input.value;
    input.value = "";

    let chatType = document.querySelector("#chat-type").value;

    this.appendMessage(0, message);
    this.showChatBubble(0, message);

    this.socketManager.push("player_chat", {
      type: parseInt(chatType),
      message: message
    });
  }
}
