export default class SpritesManager {
  constructor(scene) {
    this.scene = scene;
  }

  preload() {
    this.scene.load.spritesheet("player_front", "/images/frog_front_spritesheet.png", {
      frameWidth: 350,  // Width of ONE frame in pixels
      frameHeight: 350, // Height of ONE frame in pixels
    });

    this.scene.load.spritesheet("player_back", "/images/frog_back_spritesheet.png", {
      frameWidth: 350,  // Width of ONE frame in pixels
      frameHeight: 350, // Height of ONE frame in pixels
    });
  }
}