export default class StreamController {
  constructor(scene) {
    this.scene = scene;
    this.stream = null;
    this.initialized = false;
    this.cameraEnabled = false;
    this.getStream();
    this.hook();
  }

  hook() {
    document.querySelector('#mute-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleAudio(false);
    });

    document.querySelector('#unmute-btn').addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleAudio(true);
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
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (!this.initialized) {
        this.scene.videoPlayersManager.create(this.scene.player);
        this.initialized = true;
        this.updateSelf();

        if (this.stream.getVideoTracks().length) {
          this.cameraEnabled = true;
        }
      }
    }

    return this.stream;
  }

  async toggleAudio(toggled = true) {
    if (!this.stream) await this.getStream();

    let audioTrack = this.stream.getAudioTracks()[0];

    if (toggled) {
      audioTrack.enabled = true;

      document.querySelector("#mute-btn").classList.remove("hidden");
      document.querySelector("#unmute-btn").classList.add("hidden");
    } else {
      audioTrack.enabled = false;

      document.querySelector("#mute-btn").classList.add("hidden");
      document.querySelector("#unmute-btn").classList.remove("hidden");
    }
  }

  async toggleScreenshare(toggled = true) {
    if (!this.stream) await this.getStream();

    if (toggled) {
      this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      this.stream.getVideoTracks()[0].onended = () => {
        this.toggleScreenshare(false);
      };

      // Toggle screen sharing state
      document.querySelector("#screenshare-btn").classList.add("hidden");
      document.querySelector("#screenshare-stop-btn").classList.remove("hidden");
      document.querySelector("#camera-btn").classList.add("hidden");
      document.querySelector("#camera-stop-btn").classList.add("hidden");
    } else {
      this.stream.getVideoTracks()[0].stop();

      document.querySelector("#screenshare-btn").classList.remove("hidden");
      document.querySelector("#screenshare-stop-btn").classList.add("hidden");

      // Show camera if wasn't disabled by user
      if (this.cameraEnabled) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.querySelector("#camera-btn").classList.add("hidden");
        document.querySelector("#camera-stop-btn").classList.remove("hidden");
      } else {
        this.stream = null;
        document.querySelector("#camera-btn").classList.remove("hidden");
        document.querySelector("#camera-stop-btn").classList.add("hidden");
        this.updateSelf();
        return;
      }
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

    this.updateSelf();
  }

  async toggleCamera(toggled = true) {
    if (!this.stream) await this.getStream();

    if (toggled) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      let videoTrack = this.stream.getVideoTracks()[0];

      // Replace the existing video track in the peer connection
      for (let peer of Object.values(this.scene.rtcManager.peers)) {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');

        if (sender) {
          sender.replaceTrack(videoTrack);
        } else {
          peer.addTrack(videoTrack, this.stream);
        }
      }
      this.updateSelf();
    } else {
      let videoTrack = this.stream.getVideoTracks()[0];
      videoTrack.dispatchEvent(new Event("ended"));
      videoTrack.stop();

      this.stream = null;
      this.updateSelf();
    }

    if (toggled) {
      document.querySelector("#camera-btn").classList.add("hidden");
      document.querySelector("#camera-stop-btn").classList.remove("hidden");
    } else {
      document.querySelector("#camera-btn").classList.remove("hidden");
      document.querySelector("#camera-stop-btn").classList.add("hidden");
    }

    this.cameraEnabled = toggled;
  }

  updateSelf() {
    const selfVideo = this.scene.rtcManager.videoPlayersManager.videoPlayers[this.scene.player.id];
    selfVideo.querySelector(".video-player").srcObject = this.stream;
  }
}