import WebrtcOfferPacket from "../packets/webrtc/webrtc_offer_packet"
import WebrtcIceCandidatePacket from "../packets/webrtc/webrtc_ice_candidate_packet";

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

    await this.streamController.getVideoStream();
    await this.streamController.getAudioStream();

    this.peer.addTrack(this.streamController.emptyStream.getAudioTracks()[0]);
    this.peer.addTrack(this.streamController.emptyStream.getVideoTracks()[0]);

    for (let actor of Object.values(this.scene.actorsManager.actors)) {
      this.scene.videoPlayersManager.create(actor);

      this.tracks[actor.rtcTracks.audioId] = actor;
      this.tracks[actor.rtcTracks.videoId] = actor;

      this.peer.addTransceiver('audio', { direction: 'sendrecv' });
      this.peer.addTransceiver('video', { direction: 'sendrecv' });
    }

    this.peer.ontrack = (event) => {
      const track = event.track;

      const sender = this.tracks[event.streams[0].id];
      let enabled;

      if (sender) {
        enabled = track.kind == 'video' ? sender.cameraEnabled : sender.audioEnabled;
        this.scene.videoPlayersManager.attach(sender, event.streams[0], track.kind);
        this.scene.videoPlayersManager.toggle(sender);
        this.scene.videoPlayersManager.toggleSource(sender.id, enabled, track.kind);
      }
    }

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        const packet = new WebrtcIceCandidatePacket();
        this.scene.socketManager.push("exrtc_ice", packet.build(event.candidate));
      }
    };

    this.createOffer();
  }

  async createOffer() {
    this.peer.createOffer()
      .then(offer => this.peer.setLocalDescription(offer))
      .then(() => {
        const packet = new WebrtcOfferPacket();
        this.scene.socketManager.push("exrtc_offer", packet.build(this.peer.localDescription));
      })
      .catch(error => console.error('Error creating offer:', error));
  }

  async handleAnswer(answer) {
    this.peer
      .setRemoteDescription(new RTCSessionDescription(answer))
      .then(() => {
        this.scene.socketManager.push("exrtc_ready", {});
      })
      .catch(error => console.error('Error setting remote description:', error));
  }

  async handleIce(candidate) {
    this.peer
      .addIceCandidate(new RTCIceCandidate(candidate))
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

  async handleReady(actorId) {
    await this.scene.streamController.getVideoStream();
    await this.scene.streamController.getAudioStream();

    setTimeout(() => {
      this.replaceAudioTrack(this.getAudioTrack());
      this.replaceVideoTrack(this.getVideoTrack());
    }, 300);
  }

  getVideoTrack() {
    if (this.streamController.cameraEnabled) {
      return this.streamController.videoStream.getVideoTracks()[0];
    } else {
      return this.streamController.emptyStream.getVideoTracks()[0];
    }
  }

  getAudioTrack() {
    if (this.streamController.audioEnabled) {
      return this.streamController.audioStream.getAudioTracks()[0];
    } else {
      return this.streamController.emptyStream.getAudioTracks()[0];
    }
  }
}
