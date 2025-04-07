import "webrtc-adapter"

export default class RTCManager {
  constructor(scene) {
    this.scene = scene;
  }

  async init() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

    this.pc = new RTCPeerConnection({
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' }
      ]
    });

    this.pc.ontrack = event => {
      document.querySelector("#video-player").srcObject = event.streams[0];
    };

    this.pc.onicecandidate = event => {
      if (event.candidate === null) return;

      this.scene.socketManager.channel.push("webrtc_ice", event.candidate);
    };

    this.pc.addTrack(stream.getAudioTracks()[0]);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.scene.socketManager.channel.push("webrtc_offer", offer);
  }

  async handleAnswer(answer) {
    await this.pc.setRemoteDescription(answer);
  }

  async handleIceCandidate(ice) {
    await this.pc.addIceCandidate(ice);
  }
}
