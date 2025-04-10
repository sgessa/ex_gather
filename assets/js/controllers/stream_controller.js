export default class StreamController {
  constructor(scene) {
    this.scene = scene;
    this.stream = null;
    this.initialized = false;

    this.cameraEnabled = false;
    this.screenEnabled = false;
    this.audioEnabled = false;

    this.emptyStream = this.createEmptyStream();

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
      if (this.screenEnabled) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: this.audioEnabled });
      } else if (this.cameraEnabled || this.audioEnabled) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: this.cameraEnabled, audio: this.audioEnabled });
      } else {
        this.stream = this.emptyStream;
      }

      if (!this.initialized) {
        this.scene.videoPlayersManager.create(this.scene.player);
        this.initialized = true;
        this.updateSelf();
        this.updateButtons();
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

    this.audioEnabled = toggled;
  }

  async toggleScreenshare(toggled = true) {
    if (!this.stream) await this.getStream();
    if (this.screenEnabled == toggled) return;

    if (toggled) {
      let cameraTrack;
      if (this.cameraEnabled) cameraTrack = this.stream.getVideoTracks()[0];

      this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: this.audioEnabled });
      if (cameraTrack) cameraTrack.stop()
      this.screenEnabled = true;

      // Detect browser sharing stop
      this.stream.getVideoTracks()[0].onended = () => {
        this.toggleScreenshare(false);
      };
    } else {
      this.screenEnabled = false;
      this.stream.getVideoTracks()[0].stop();

      this.stream = null;
      this.stream = await this.getStream();
    }

    // Replace the existing video track in the peer connection
    this.replaceStreamTrack();
    this.updateButtons();
  }

  async toggleCamera(toggled = true) {
    if (!this.stream) await this.getStream();
    if (this.cameraEnabled == toggled) return;

    if (toggled) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: this.audioEnabled });
      this.cameraEnabled = toggled;

      // Detect camera stop
      this.stream.getVideoTracks()[0].onended = () => {
        this.toggleCamera(false);
      };

      this.replaceStreamTrack();
    } else {
      this.cameraEnabled = false;

      let videoTrack = this.stream.getVideoTracks()[0];
      videoTrack.dispatchEvent(new Event("ended"));
      videoTrack.enabled = false;
      videoTrack.stop();

      this.stream = null;
      this.stream = await this.getStream();
    }

    this.updateButtons();
    this.updateSelf();
  }

  updateSelf() {
    const selfVideo = this.scene.videoPlayersManager.videoPlayers[this.scene.player.id];
    if (this.screenEnabled || this.cameraEnabled) {
      selfVideo.querySelector(".video-player").srcObject = this.stream;
    } else {
      selfVideo.querySelector(".video-player").srcObject = null;
    }
  }

  updateButtons() {
    if (this.screenEnabled) {
      // Toggle screen sharing state
      document.querySelector("#screenshare-btn").classList.add("hidden");
      document.querySelector("#screenshare-stop-btn").classList.remove("hidden");
      document.querySelector("#camera-btn").classList.add("hidden");
      document.querySelector("#camera-stop-btn").classList.add("hidden");
    } else {
      document.querySelector("#screenshare-btn").classList.remove("hidden");
      document.querySelector("#screenshare-stop-btn").classList.add("hidden");

      if (this.cameraEnabled) {
        document.querySelector("#camera-btn").classList.add("hidden");
        document.querySelector("#camera-stop-btn").classList.remove("hidden");
      } else {
        document.querySelector("#camera-btn").classList.remove("hidden");
        document.querySelector("#camera-stop-btn").classList.add("hidden");
      }
    }
  }

  replaceStreamTrack() {
    const videoTrack = this.stream.getVideoTracks()[0];

    for (let peer of Object.values(this.scene.rtcManager.peers)) {
      const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');

      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    }

    this.updateSelf();
  }

  createEmptyStream() {
    // Silent audio track
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 0; // Silent
    const destination = audioContext.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();
    const silentAudioTrack = destination.stream.getAudioTracks()[0];

    // Black video track (using canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 640; // Minimum resolution
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blackVideoTrack = canvas.captureStream(25).getVideoTracks()[0]; // 25 FPS

    // Create a MediaStream with both tracks
    const placeholderStream = new MediaStream([silentAudioTrack, blackVideoTrack]);
    return placeholderStream;
  }
}