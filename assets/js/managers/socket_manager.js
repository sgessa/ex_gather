import { Socket } from "phoenix"

export default class SocketManager {
  constructor() {
    this.socket = null;
    this.channel = null;
  }

  init(onJoin) {
    this.socket = new Socket("/socket", { params: { token: this.getToken() } });
    this.socket.connect();

    this.channel = this.socket.channel("room:lobby", {});

    this.channel.join().
      receive("ok", data => {
        onJoin(data);
      });

    window.addEventListener("beforeunload", () => {
      this.channel.leave();
      this.socket.disconnect();
    });
  }

  push(event, data) {
    return this.channel.push(event, data);
  }

  getToken() {
    return document.querySelector("meta[name='auth-token']").getAttribute("content");
  }
}