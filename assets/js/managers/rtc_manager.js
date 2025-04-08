import "webrtc-adapter"
import VideoPlayersManager from "./video_players_manager";

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
    this.videoPlayersManager = new VideoPlayersManager(this.scene);
  }

  async createPeerConnection(actorId) {
    if (this.peers[actorId]) return this.peers[actorId];

    const pc = new RTCPeerConnection(this.config);
    this.peers[actorId] = pc;
    this.candidateQueue[actorId] = [];

    if (!this.stream) {
      this.stream = await this.scene.streamController.getStream();
      this.videoPlayersManager.create(this.scene.player, this.stream);
    }

    this.stream.getTracks((track) => pc.addTrack(track, this.stream));
    pc.addStream(this.stream);

    pc.ontrack = (event) => {
      console.log(event.track.kind, 'recv track');
      if (event.track.kind != "video") return;
      this.videoPlayersManager.create(this.scene.actorsManager.actors[actorId], event.streams[0]);
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

    pc.createOffer()
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
