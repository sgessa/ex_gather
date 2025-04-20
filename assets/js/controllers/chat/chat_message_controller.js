import ActorController from "../actor_controller.js";

export default class ChatMessageController {
  constructor(sender, type, message) {
    this.sender = sender;
    this.chatType = type;
    this.chatMessage = message;

    this.append();
  }

  append() {
    const message = document.createElement("div");
    const avatar = document.createElement("div");
    const content = document.createElement("div");
    const author = document.createElement("p");
    const textContainer = document.createElement("div");
    const text = document.createElement("p");
    const time = document.createElement("p");

    if (typeof this.sender == ActorController) {
      // Message is from actor
      message.classList = "flex items-start space-x-2";
      avatar.classList = "w-8 h-8 rounded-full bg-gray-700 flex-shrink-0";
      author.classList = "text-sm text-gray-400";
      textContainer.classList = "bg-gray-800 p-3 rounded-lg shadow-sm max-w-xs";
      text.classList = "text-gray-200 chat-text-container";
      time.classList = "text-xs text-gray-500 mt-1";

      message.appendChild(avatar);

      author.innerText = this.sender.username;
      content.appendChild(author);
    } else {
      // Message is from current player
      avatar.classList = "w-8 h-8 rounded-full bg-blue-500 flex-shrink-0";
      message.classList = 'flex items-start space-x-2 justify-end';
      textContainer.classList = "bg-blue-600 text-white p-3 rounded-lg shadow-sm max-w-xs";
      text.classList = "text-gray-200 chat-text-container";
      time.classList = "text-xs text-gray-500 mt-1 text-right";
    }

    text.innerText = this.chatMessage;
    time.innerText = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    textContainer.appendChild(text);
    content.appendChild(textContainer);
    content.appendChild(time);
    message.appendChild(content);

    if (typeof this.sender == ActorController) {
      message.appendChild(avatar);
    }

    const chatContainer = document.querySelector("#chat-container")
    chatContainer.appendChild(message);

    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  }
}