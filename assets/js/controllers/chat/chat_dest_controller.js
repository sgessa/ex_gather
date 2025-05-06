export default class ChatDestController {
  constructor(chatManager, dest) {
    this.chatManager = chatManager;
    this.dest = dest;
    this.element = this.create();
  }

  create() {
    const dest = document.createElement("a");
    const avatar = document.createElement("div");

    dest.classList = "relative chat-dm";
    dest.dataset.dest = this.dest.id;

    avatar.classList = "w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"
    avatar.innerText = this.dest.username[0].toUpperCase();
    dest.appendChild(avatar);

    document.querySelector("#chat-dest-container").appendChild(dest);

    document.querySelector(`.chat-dm[data-dest='${this.dest.id}']`).addEventListener('click', (event) => {
      this.chatManager.toggleDest(event.currentTarget.dataset.dest);
    });

    return dest;
  }

  remove() {
    this.element.remove();
  }
}