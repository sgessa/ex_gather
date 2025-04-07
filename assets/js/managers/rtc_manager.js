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
  }

  async createPeerConnection(actorId) {
    if (this.peers[actorId]) return this.peers[actorId];

    const pc = new RTCPeerConnection(this.config);
    this.peers[actorId] = pc;
    this.candidateQueue[actorId] = [];

    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.addPlayerStream();

    this.stream.getTracks((track) => pc.addTrack(track, this.stream));
    pc.addStream(this.stream);

    pc.ontrack = (event) => {
      if (event.track.kind != "video") return;
      this.addRemoteStream(actorId, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketManager.push("webrtc_candidate", { player_id: actorId, candidate: event.candidate });
      }
    };

    return pc;
  }

  addPlayerStream() {
    const videoElement = document.createElement('video');
    videoElement.id = `video-self`;
    videoElement.classList = "video-element"
    videoElement.autoplay = true;
    videoElement.srcObject = this.stream;
    videoElement.muted = true;

    document.querySelector("#video-container").appendChild(videoElement);
  }

  addRemoteStream(actorId, stream) {
    const videoElement = document.createElement('video');
    videoElement.id = `video-${actorId}`;
    videoElement.classList = "video-element"
    videoElement.autoplay = true;
    videoElement.srcObject = stream;

    document.querySelector("#video-container").appendChild(videoElement);
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

    let video = document.querySelector(`#video-${actorId}`)

    if (video) video.remove();
    this.peers[actorId].close();
    delete this.peers[actorId];
  }

  toggleStream(actorId, toggled) {
    const video = document.querySelector(`#video-${actorId}`);
    if (!video) return;

    video.muted = !toggled;

    if (toggled) {
      video.classList.remove('hidden');
    } else {
      video.classList.add('hidden');
    }

    // Disable player stream if no other streams nearby
    let remoteVideos = Array.from(document.querySelectorAll('.video-element:not(#video-self)'));
    if (remoteVideos.some((v) => !v.muted)) {
      document.querySelector('#video-self').classList.remove('hidden');
    } else {
      document.querySelector('#video-self').classList.add('hidden');
    }
  }
}
