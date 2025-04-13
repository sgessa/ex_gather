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
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }

    this.peer = new RTCPeerConnection(this.config);
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    console.log(this.scene.actorsManager.actors);
    for (let actor of Object.values(this.scene.actorsManager.actors)) {
      this.scene.videoPlayersManager.create(actor);
      console.log('Creating manager for', actor);

      this.tracks[actor.rtcTracks.audio_id] = actor;
      this.tracks[actor.rtcTracks.video_id] = actor;

      this.peer.addTransceiver('audio', { direction: 'sendrecv' }); // For client B
      this.peer.addTransceiver('video', { direction: 'sendrecv' }); // For client C
    }

    // this.peer.addTransceiver(this.stream.getVideoTracks()[0], {
    //   direction: "sendrecv",
    //   streams: [this.stream],
    //   sendEncodings: [
    //     { rid: "h", maxBitrate: 1200 * 1024 },
    //     { rid: "m", scaleResolutionDownBy: 2, maxBitrate: 600 * 1024 },
    //     { rid: "l", scaleResolutionDownBy: 4, maxBitrate: 300 * 1024 },
    //   ],
    // });
    // replace the call above with this to disable simulcast
    // pc.addTrack(localStream.getVideoTracks()[0]);
    this.peer.addTrack(this.stream.getVideoTracks()[0]);
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

    this.createOffer();
  }

  async createOffer() {
    this.peer.createOffer()
      .then(offer => {
        return offer
      })
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
      .then(() => {
        const receiver = this.peer.getReceivers().find(r => r.track.kind === 'video');
        if (receiver) {
          receiver.getStats().then(report => {
            console.log('Stats fetched, PLI likely requested internally');
            // Modern WebRTC stacks send PLI on packet loss or initial frame delay
          });
        }
      })
      .catch(error => console.error('Error setting remote description:', error));
  }

  async handleIce(candidate) {
    this.peer
      .addIceCandidate(new RTCIceCandidate(candidate))
  }
}