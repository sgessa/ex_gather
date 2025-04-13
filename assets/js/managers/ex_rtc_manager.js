export default class ExRTCManager {
  constructor(scene) {
    this.config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    this.scene = scene;
    this.streamController = this.scene.streamController;

    this.peer = null;
    this.stream = null;
    this.tracks = {};

    console.warn('Server side WebRTC proxy enabled');
    this.init();
  }

  async init() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }

    this.peer = new RTCPeerConnection(this.config);
    this.stream = await this.scene.streamController.getStream();

    // Ensure a track is always sent (will be replaced when stream is enabled)
    if (this.streamController.cameraEnabled) {
      this.peer.addTrack(this.stream.getVideoTracks()[0]);
    } else {
      this.peer.addTrack(this.streamController.emptyStream.getVideoTracks()[0]);
    }

    if (this.streamController.audioEnabled) {
      this.peer.addTrack(this.stream.getAudioTracks()[0]);
    } else {
      this.peer.addTrack(this.streamController.emptyStream.getAudioTracks()[0]);
    }

    for (let actor of Object.values(this.scene.actorsManager.actors)) {
      this.scene.videoPlayersManager.create(actor);

      this.tracks[actor.rtcTracks.audio_id] = actor;
      this.tracks[actor.rtcTracks.video_id] = actor;

      this.peer.addTransceiver('audio', { direction: 'sendrecv' });
      this.peer.addTransceiver('video', { direction: 'sendrecv' });
    }

    this.peer.ontrack = (event) => {
      const track = event.track;

      console.log('OnTrack', event.track.kind, event);

      const sender = this.tracks[event.streams[0].id];
      this.scene.videoPlayersManager.attach(sender, event.streams[0], track.kind);
      this.scene.videoPlayersManager.toggle(sender);
      this.scene.videoPlayersManager.toggleSource(sender.id, true, track.kind);
    }

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.scene.socketManager.push("exrtc_ice", { ice: event.candidate });
      }
    };

    this.createOffer();
  }

  async createOffer() {
    this.peer.createOffer()
      .then(offer => this.peer.setLocalDescription(offer))
      .then(() => {
        this.scene.socketManager.push("exrtc_offer", { offer: this.peer.localDescription });
      })
      .catch(error => console.error('Error creating offer:', error));
  }

  async handleAnswer(answer) {
    this.peer
      .setRemoteDescription(new RTCSessionDescription(answer))
      .catch(error => console.error('Error setting remote description:', error));
  }

  async handleIce(candidate) {
    this.peer
      .addIceCandidate(new RTCIceCandidate(candidate))
  }

  async handleDisconnect(actorId) {
    this.scene.videoPlayersManager.delete(actorId);
  }

  replaceVideoTrack(videoTrack) {
    const sender = this.peer.getSenders().find(s => s.track && s.track.kind === 'video');

    if (sender) {
      sender.replaceTrack(videoTrack);
    }
  }

  replaceAudioTrack(audioTrack) {
    const sender = this.peer.getSenders().find(s => s.track && s.track.kind === 'audio');

    if (sender) {
      sender.replaceTrack(audioTrack);
    }
  }
}