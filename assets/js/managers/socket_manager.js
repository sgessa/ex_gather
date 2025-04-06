import { Socket } from "phoenix"

export default class SocketManager {
  constructor() {
    this.socket = null;
    this.channel = null;
  }

  init(onJoin) {
    this.socket = new Socket("/socket", { params: { token: this.getToken() } });
    this.socket.connect();

    // x: 100, y: 100, dir: "down", state: "idle" 
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

  getToken() {
    return document.querySelector("meta[name='auth-token']").getAttribute("content");
  }
}