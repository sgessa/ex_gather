export default class VideoPlayersManager {
  constructor(scene) {
    this.scene = scene;
    this.videoPlayers = {};
  }

  attach(actor, stream, kind) {
    if (!this.videoPlayers[actor.id]) {
      this.create(actor);
    }

    if (kind == "audio") {
      this.videoPlayers[actor.id].querySelector(".audio-player").srcObject = stream;
      this.videoPlayers[actor.id].querySelector('.audio-player').play()
      this.videoPlayers[actor.id].querySelector('.audio-player').addEventListener("playing", (event) => {
        console.log('Audio playing', event);
      });
    } else if (kind == "video") {
      this.videoPlayers[actor.id].querySelector(".video-player").srcObject = stream;
      this.videoPlayers[actor.id].querySelector('.video-player').play()
      this.videoPlayers[actor.id].querySelector('.video-player').addEventListener("playing", (event) => {
        console.log('Video playing', event);
      });
    }
  }

  // Instantiates the video player
  create(actor) {
    if (this.videoPlayers[actor.id]) return;

    const videoContainer = document.createElement('div');
    videoContainer.classList = "video-container hidden"
    videoContainer.dataset.id = `${actor.id}`;

    const videoElement = document.createElement('video');
    videoElement.classList = "video-player"
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoContainer.appendChild(videoElement);

    const audioElement = document.createElement('audio');
    audioElement.classList = "audio-player"
    audioElement.autoplay = true;
    audioElement.muted = false;
    videoContainer.appendChild(audioElement);

    const micContainer = document.createElement('div');
    micContainer.classList = "mic-icon disabled";

    const micImage = document.createElement('img');
    micImage.src = "/images/icons/microphone.svg";

    micContainer.appendChild(micImage);
    videoContainer.appendChild(micContainer);

    const videoLabel = document.createElement('div');
    videoLabel.classList = "video-label";
    videoLabel.textContent = actor.username;
    videoContainer.appendChild(videoLabel);

    document.querySelector("#video-group").appendChild(videoContainer);

    this.videoPlayers[actor.id] = videoContainer;
    this.toggle(actor);
    this.toggleSource(actor.id, actor.audioEnabled, "audio");
  }

  // Disable actor stream if isn't in proximity of player
  toggle(actor) {
    if (actor.id == this.scene.player.id) return this.toggleSelf();

    const videoContainer = this.videoPlayers[actor.id];
    const toggled = actor.proximityController.inProximity;

    if (!videoContainer) return;

    videoContainer.querySelector('.audio-player').muted = !toggled;

    if (toggled) {
      videoContainer.classList.remove('hidden');
    } else {
      videoContainer.classList.add('hidden');
    }

    this.toggleSelf();
  }

  // Disable player stream if no other streams nearby
  toggleSelf() {
    const selfVideo = this.videoPlayers[this.scene.player.id];
    const remoteVideos = Object.values(this.videoPlayers)
      .filter((p) => p != selfVideo)
      .map((p) => p.querySelector('.audio-player'));

    if (remoteVideos.some((v) => !v.muted)) {
      selfVideo.classList.remove('hidden');
    } else {
      selfVideo.classList.add('hidden');
    }
  }

  toggleSource(actorId, toggled, kind) {
    if (!this.videoPlayers[actorId]) return;

    if (kind == "video") {
      if (toggled) {
        this.videoPlayers[actorId].querySelector(".video-player").classList.remove("hidden");
      } else {
        this.videoPlayers[actorId].querySelector(".video-player").classList.add("hidden");
      }
    } else if (kind == "audio") {
      if (toggled) {
        this.videoPlayers[actorId].querySelector(".mic-icon").classList.remove("disabled");
      } else {
        this.videoPlayers[actorId].querySelector(".mic-icon").classList.add("disabled");
      }
    }
  }

  // Removes a player
  delete(actorId) {
    if (!this.videoPlayers[actorId]) return;

    this.videoPlayers[actorId].remove();
    delete this.videoPlayers[actorId];
  }

  deleteAll() {
    for (let playerId in this.videoPlayers) {
      if (playerId != this.scene.player.id) {
        this.delete(playerId);
      }
    }
  }
}
