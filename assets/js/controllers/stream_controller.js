export default class StreamController {
  constructor(scene) {
    this.scene = scene;
    this.stream = null;
    this.initialized = false;

    this.screenEnabled = false;
    this.cameraEnabled = this.scene.game.streamControls.videoEnabled;
    this.audioEnabled = this.scene.game.streamControls.audioEnabled;

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
        this.updateStreamPlayer();
        this.updateInterface();
      }
    }

    return this.stream;
  }

  async toggleAudio(toggled = true) {
    if (this.audioEnabled == toggled) return;

    if (toggled) {
      let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioEnabled = true;
      this.replaceAudioTrack(audioStream.getAudioTracks()[0]);
    } else {
      this.audioEnabled = false;
      this.replaceAudioTrack(this.emptyStream.getAudioTracks()[0]);
    }

    this.scene.socketManager.push("webrtc_audio", { audio_enabled: this.audioEnabled });
    this.scene.videoPlayersManager.toggleSource(this.scene.player.id, this.audioEnabled, "audio");
    this.updateInterface();
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
    this.replaceVideoTrack();
    this.updateInterface();
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

      this.replaceVideoTrack();
    } else {
      this.cameraEnabled = false;

      let videoTrack = this.stream.getVideoTracks()[0];
      videoTrack.dispatchEvent(new Event("ended"));
      videoTrack.enabled = false;
      videoTrack.stop();

      this.stream = null;
      this.stream = await this.getStream();
    }

    this.updateInterface();
    this.updateStreamPlayer();
  }

  updateStreamPlayer() {
    const selfVideo = this.scene.videoPlayersManager.videoPlayers[this.scene.player.id];
    let stream = this.screenEnabled || this.cameraEnabled ? this.stream : null;
    selfVideo.querySelector(".video-player").srcObject = stream;
  }

  updateInterface() {
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

    if (this.audioEnabled) {
      document.querySelector("#mute-btn").classList.remove("hidden");
      document.querySelector("#unmute-btn").classList.add("hidden");
    } else {
      document.querySelector("#mute-btn").classList.add("hidden");
      document.querySelector("#unmute-btn").classList.remove("hidden");
    }
  }

  replaceVideoTrack() {
    const videoTrack = this.stream.getVideoTracks()[0];
    this.scene.rtcManager.replaceVideoTrack(videoTrack);
    this.updateStreamPlayer();
  }

  replaceAudioTrack(audioTrack) {
    this.scene.rtcManager.replaceAudioTrack(audioTrack);
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
