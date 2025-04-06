import "phoenix_html"
import Phaser from "phaser";
import GameScene from "./game_scene.js"

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.FIT,
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
