export default class VideoPlayersManager {
  constructor(scene) {
    this.scene = scene;
    this.videoPlayers = {};
  }

  // Instantiates the video player
  create(actor, stream) {
    const videoContainer = document.createElement('div');
    videoContainer.classList = "video-container hidden"
    videoContainer.dataset.id = `${actor.id}`;

    const videoElement = document.createElement('video');
    videoElement.classList = "video-player"
    videoElement.autoplay = true;
    videoElement.srcObject = stream;
    videoContainer.appendChild(videoElement);

    const videoLabel = document.createElement('div');
    videoLabel.classList = "video-label";
    videoLabel.textContent = actor.username;
    videoContainer.appendChild(videoLabel);

    document.querySelector("#video-group").appendChild(videoContainer);
    this.videoPlayers[actor.id] = videoContainer;
    this.toggle(actor);
  }

  // Disable actor stream if isn't in proximity of player
  toggle(actor) {
    if (actor.id == this.scene.player.id) return this.toggleSelf();

    const videoContainer = this.videoPlayers[actor.id];
    const toggled = actor.inProximity;

    if (!videoContainer) return;

    videoContainer.querySelector('.video-player').muted = !toggled;

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
    selfVideo.querySelector('.video-player').muted = true;

    const remoteVideos = Object.values(this.videoPlayers)
      .filter((p) => p != selfVideo)
      .map((p) => p.querySelector('.video-player'));

    if (remoteVideos.some((v) => !v.muted)) {
      selfVideo.classList.remove('hidden');
    } else {
      selfVideo.classList.add('hidden');
    }
  }

  // Removes a player
  delete(actorId) {
    if (!this.videoPlayers[actorId]) return;

    this.videoPlayers[actorId].remove();
    delete this.videoPlayers[actorId];
  }
}