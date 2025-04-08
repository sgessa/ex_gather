import "phoenix_html"
import Phaser from "phaser";
import GameScene from "./game_scene.js"

const config = {
  parent: 'game-container',
  type: Phaser.AUTO,
  width: "100%",
  height: "100%",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
  scene: GameScene,
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("game-container")) {
    new Phaser.Game(config);
  }
});
