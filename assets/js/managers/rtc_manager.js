import "webrtc-adapter"

export default class RTCManager {
  constructor(scene) {
    this.config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    this.scene = scene;
    this.stream = null;
    this.peers = {};
    this.candidateQueue = {};
    this.socketManager = this.scene.socketManager;
    this.videoPlayersManager = this.scene.videoPlayersManager;
  }

  async createPeerConnection(actorId) {
    let pc = this.peers[actorId];

    if (!pc) {
      pc = new RTCPeerConnection(this.config);
      this.peers[actorId] = pc;
      this.candidateQueue[actorId] = [];
    }

    this.stream = await this.scene.streamController.getStream();

    console.log("Sending to peer ", this.stream.getTracks());

    this.stream.getTracks((track) => pc.addTrack(track, this.stream));
    pc.addStream(this.stream);

    pc.ontrack = (event) => {
      const track = event.track;

      console.log("Attaching track", event.track.kind, " for ", actorId);
      this.videoPlayersManager.attach(this.scene.actorsManager.getActor(actorId), event.streams[0], track.kind);

      event.track.onmute = () => {
        if (track.kind != "video") return;
        this.videoPlayersManager.toggleSource(actorId, false, track.kind);
      };

      event.track.onunmute = () => {
        if (track.kind != "video") return;
        this.videoPlayersManager.toggleSource(actorId, true, track.kind);
      };
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketManager.push("webrtc_candidate", { player_id: actorId, candidate: event.candidate });
      }
    };

    return pc;
  }

  async handleNewPeer(actorId) {
    const pc = await this.createPeerConnection(actorId);

    pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        this.socketManager.push("webrtc_offer", { offer: pc.localDescription, player_id: actorId });
      })
      .catch(error => console.error('Error creating offer:', error));
  }

  async handleOffer(actorId, offer) {
    const pc = await this.createPeerConnection(actorId);

    pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => pc.createAnswer())
      .then(answer => pc.setLocalDescription(answer))
      .then(() => {
        this.handleCandidateQueue(actorId)
        this.socketManager.push("webrtc_answer", { player_id: actorId, answer: pc.localDescription });
      })
      .catch(error => console.error('Error handling offer:', error));
  }

  handleAnswer(actorId, answer) {
    const pc = this.peers[actorId];

    if (pc) {
      pc.setRemoteDescription(new RTCSessionDescription(answer))
        .catch(error => console.error('Error setting remote description:', error));

      this.handleCandidateQueue(actorId)
    }
  }

  handleIceCandidate(actorId, candidate) {
    const pc = this.peers[actorId];

    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(error => {
          console.log(`Couldn't assign ICE Candidates for ${actorId}`, error);

          this.candidateQueue[actorId].push(candidate);
        });
    }
  }

  handleCandidateQueue(actorId) {
    if (!this.candidateQueue[actorId]) return;

    this.candidateQueue[actorId].forEach((candidate) => {
      this.handleIceCandidate(actorId, candidate);
    });

    this.candidateQueue[actorId] = [];
  }

  handleDisconnect(actorId) {
    if (!this.peers[actorId]) return;

    this.videoPlayersManager.delete(actorId);
    this.peers[actorId].close();
    delete this.peers[actorId];
  }
}
