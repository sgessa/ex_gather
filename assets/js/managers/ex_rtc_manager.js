export default class ExRTCManager {
  constructor(scene) {
    this.config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    this.scene = scene;
    this.peer = null;
    this.stream = null;

    this.tracks = {};

    this.init();
  }

  async init() {
    console.log(this.scene.actorsManager.actors);
    for (let actor of Object.values(this.scene.actorsManager.actors)) {
      this.scene.videoPlayersManager.create(actor);
      console.log('Creating manager for', actor);

      this.tracks[actor.rtcTracks.audio_id] = actor;
      this.tracks[actor.rtcTracks.video_id] = actor;
    }

    this.peer = new RTCPeerConnection(this.config);
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } }, audio: true });

    this.peer.addTransceiver(this.stream.getVideoTracks()[0], {
      direction: "sendrecv",
      streams: [this.stream],
      sendEncodings: [
        { rid: "h", maxBitrate: 1200 * 1024 },
        { rid: "m", scaleResolutionDownBy: 2, maxBitrate: 600 * 1024 },
        { rid: "l", scaleResolutionDownBy: 4, maxBitrate: 300 * 1024 },
      ],
    });
    // replace the call above with this to disable simulcast
    // pc.addTrack(localStream.getVideoTracks()[0]);
    this.peer.addTrack(this.stream.getAudioTracks()[0]);

    this.peer.ontrack = (event) => {
      const track = event.track;

      console.log(event);
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

    this.peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
      .then(offer => this.peer.setLocalDescription(offer))
      .then(() => {
        console.log("SENT OFFER");
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
}