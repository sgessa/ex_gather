import Phaser from "phaser";
import GameScene from "../game_scene.js"

export default class JoinController {
  constructor() {
    this.initialized = false;
    this.audioStream = null;
    this.videoStream = null;

    this.hooks();
  }

  hooks() {
    document.querySelector(".join-btn").addEventListener("click", (event) => {
      event.preventDefault();
      this.startScene();
    });

    document.querySelector("#audio-checkbox").addEventListener("change", (event) => {
      this.toggleAudio(event.currentTarget);
    });

    document.querySelector("#video-checkbox").addEventListener("change", (event) => {
      this.toggleVideo(event.currentTarget);
    });
  }

  async startScene() {

    if (this.initialized) return;
    this.initialized = true;

    if (this.audioStream) this.audioStream.getAudioTracks()[0].stop();
    if (this.videoStream) this.videoStream.getVideoTracks()[0].stop();

    document.querySelector('.join-container').classList = "hidden";
    const game = await new Phaser.Game({
      parent: 'game-container',
      type: Phaser.AUTO,
      width: "100%",
      height: "100%",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
      scene: GameScene,
    });

    game.streamControls = {
      audioEnabled: document.querySelector('#audio-checkbox').checked,
      videoEnabled: document.querySelector('#video-checkbox').checked,
    };
  }

  async toggleAudio(target) {
    if (target.checked) {
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        target.checked = false;
      }
    } else {
      if (this.audioStream) {
        this.audioStream.getAudioTracks()[0].stop();
      }
    }
  }

  async toggleVideo(target) {
    if (target.checked) {
      try {
        this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.querySelector("#video-preview").srcObject = this.videoStream;
        document.querySelector("#video-preview").classList.remove("hidden");
        document.querySelector("#video-placeholder").classList.add("hidden");
      } catch {
        target.checked = false;
      }
    } else {
      if (this.videoStream) {
        this.videoStream.getVideoTracks()[0].stop();
        document.querySelector("#video-preview").classList.add("hidden");
        document.querySelector("#video-placeholder").classList.remove("hidden");
      }
    }
  }
}