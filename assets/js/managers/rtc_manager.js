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

    pc.onicecandidate = event => {
      if (event.candidate === null) return;

      console.log("Sent ICE candidate:", event.candidate);
      this.scene.socketManager.channel.push("ice", event.candidate);
    };

    this.pc.addTrack(stream.getAudioTracks()[0]);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    console.log("Sent SDP offer:", offer)
    this.scene.socketManager.channel.push("offer", offer);
  }
}