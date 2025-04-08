export default class StreamController {
  constructor(scene) {
    this.scene = scene;
    this.stream = null;
    this.getStream();
    this.hook();
  }

  hook() {
    document.querySelector('#mute-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.mute();
    });

    document.querySelector('#screenshare-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleScreenshare(true);
    });

    document.querySelector('#screenshare-stop-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleScreenshare(false);
    });

    document.querySelector('#camera-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleCamera(true);
    });

    document.querySelector('#camera-stop-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleCamera(false);
    });
  }

  async getStream() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return this.stream;
  }

  async mute() {
    if (!this.stream) await this.getStream();
    const audioTrack = this.stream.getAudioTracks()[0];

    if (audioTrack) {
      let isEnabled = audioTrack.enabled;
      audioTrack.enabled = !isEnabled;

      document.querySelector('#mute-btn').innerHTML = isEnabled ? 'Unmute' : 'Mute';
    }
  }

  async toggleScreenshare(toggled = true) {
    if (!this.stream) await this.getStream();

    if (toggled) {
      this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      // Toggle screen sharing state
      document.querySelector("#screenshare-btn").classList.add("hidden");
      document.querySelector("#screenshare-stop-btn").classList.remove("hidden");
      document.querySelector("#camera-btn").classList.add("hidden");
      document.querySelector("#camera-stop-btn").classList.add("hidden");
    } else {
      this.stream = await this.getStream();

      // Toggle camera state
      document.querySelector("#screenshare-btn").classList.remove("hidden");
      document.querySelector("#screenshare-stop-btn").classList.add("hidden");
      document.querySelector("#camera-btn").classList.add("hidden");
      document.querySelector("#camera-stop-btn").classList.remove("hidden");
    }

    const videoTrack = this.stream.getVideoTracks()[0];

    // Replace the existing video track in the peer connection
    for (let peer of Object.values(this.scene.rtcManager.peers)) {
      const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');

      if (sender) {
        sender.replaceTrack(videoTrack);
      } else {
        peer.addTrack(videoTrack, this.stream);
      }
    }

    // Update self player
    const selfVideo = this.scene.rtcManager.videoPlayersManager.videoPlayers[this.scene.player.id];
    selfVideo.querySelector(".video-player").srcObject = this.stream;
  }

  async toggleCamera(toggled = true) {
    if (!this.stream) await this.getStream();

    console.log("toggling");

    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = toggled;
    }

    if (toggled) {
      document.querySelector("#camera-btn").classList.add("hidden");
      document.querySelector("#camera-stop-btn").classList.remove("hidden");
    } else {
      document.querySelector("#camera-btn").classList.remove("hidden");
      document.querySelector("#camera-stop-btn").classList.add("hidden");
    }
  }
}