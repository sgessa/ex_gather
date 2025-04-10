export default class ChatManager {
  constructor(scene) {
    this.scene = scene;
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

  appendMessage(actorId, chatMessage) {
    const actor = this.getActor(actorId);

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

      author.innerText = author.username;
      content.appendChild(author);
    } else {
      // Message is from current player
      avatar.classList = "w-8 h-8 rounded-full bg-blue-500 flex-shrink-0";
      message.classList = 'flex items-start space-x-2 justify-end';
      textContainer.classList = "bg-blue-600 text-white p-3 rounded-lg shadow-sm max-w-xs";
      text.classList = "text-gray-200";
      time.classList = "text-xs text-gray-500 mt-1 text-right";
    }

    message.innerText = chatMessage;
    time.innerText = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    textContainer.append(text);
    content.appendChild(textContainer);
    message.appendChild(time);

    if (!actor) {
      message.appendChild(avatar);
    }

    document.querySelector("#chat-container").appendChild(message);
  }

  sendMessage() {
    let message = document.querySelector("#chat-input").value;
    document.querySelector("#chat-input").value = "";

    // TODO:
    // Send packet
  }

  getActor(actorId) {
    return this.scene.actorsManager.actors[actorId];
  }
}