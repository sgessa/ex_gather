export default class StreamController {
  constructor(scene) {
    this.scene = scene;
    this.videoStream = null;
    this.audioStream = null;
    this.initialized = false;

    this.screenEnabled = false;
    this.cameraEnabled = this.scene.game.streamControls.videoEnabled;
    this.audioEnabled = this.scene.game.streamControls.audioEnabled;

    this.emptyStream = this.createEmptyStream();

    this.getVideoStream();
    this.getAudioStream();
    this.init();
    this.hook();
  }

  init() {
    if (this.initialized) return;
    this.scene.videoPlayersManager.create(this.scene.player);
    this.initialized = true;
    this.updateStreamPlayer();
    this.updateInterface();
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

  async getVideoStream() {
    if (!this.videoStream) {
      if (this.screenEnabled) {
        this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } else if (this.cameraEnabled) {
        this.videoStream = await navigator.mediaDevices.getUserMedia({ video: this.cameraEnabled, audio: false });
      } else {
        this.videoStream = this.emptyStream;
      }
    }

    return this.videoStream;
  }

  async getAudioStream() {
    if (!this.audioStream) {

      if (this.audioEnabled) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } else {
        this.audioStream = this.emptyStream;
      }
    }

    return this.audioStream;
  }

  async toggleAudio(toggled) {
    if (this.audioEnabled == toggled) return;

    if (toggled) {
      this.audioEnabled = true;
      this.audioStream = null;
      await this.getAudioStream();

      this.replaceAudioTrack(this.audioStream.getAudioTracks()[0]);
    } else {
      this.audioStream.getAudioTracks()[0].stop();

      this.audioEnabled = false;
      this.audioStream = null;
      await this.getAudioStream();

      this.replaceAudioTrack(this.emptyStream.getAudioTracks()[0]);
    }

    this.scene.socketManager.push("exrtc_toggle_stream", { rtc_audio_enabled: this.audioEnabled });
    this.scene.videoPlayersManager.toggleSource(this.scene.player.id, this.audioEnabled, "audio");
    this.updateInterface();
  }

  async toggleScreenshare(toggled) {
    if (!this.videoStream) await this.getVideoStream();
    if (this.screenEnabled == toggled) return;

    if (toggled) {
      let cameraTrack;
      if (this.cameraEnabled) cameraTrack = this.videoStream.getVideoTracks()[0];

      this.videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: this.audioEnabled });
      if (cameraTrack) cameraTrack.stop()
      this.screenEnabled = true;

      // Detect browser sharing stop
      this.videoStream.getVideoTracks()[0].onended = () => {
        this.toggleScreenshare(false);
      };
    } else {
      this.screenEnabled = false;
      this.videoStream.getVideoTracks()[0].stop();

      this.videoStream = null;
      this.videoStream = await this.getVideoStream();
    }

    // Replace the existing video track in the peer connection
    this.replaceVideoTrack();
    this.updateInterface();
  }

  async toggleCamera(toggled) {
    if (!this.videoStream) await this.getVideoStream();
    if (this.cameraEnabled == toggled) return;

    if (toggled) {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: this.audioEnabled });
      this.cameraEnabled = toggled;

      // Detect camera stop
      this.videoStream.getVideoTracks()[0].onended = () => {
        this.toggleCamera(false);
      };

      this.replaceVideoTrack();
    } else {
      this.cameraEnabled = false;

      let videoTrack = this.videoStream.getVideoTracks()[0];
      videoTrack.dispatchEvent(new Event("ended"));
      videoTrack.enabled = false;
      videoTrack.stop();

      this.videoStream = null;
      this.videoStream = await this.getVideoStream();
    }

    this.scene.socketManager.push("exrtc_toggle_stream", { rtc_camera_enabled: this.cameraEnabled });

    this.updateInterface();
    this.updateStreamPlayer();
  }

  updateStreamPlayer() {
    const selfVideo = this.scene.videoPlayersManager.videoPlayers[this.scene.player.id];
    let stream = this.screenEnabled || this.cameraEnabled ? this.videoStream : null;
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
    const videoTrack = this.videoStream.getVideoTracks()[0];
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
