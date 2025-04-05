import {Socket, Presence} from "phoenix"
import Phaser from "phaser";
import CurrentPlayer from "./current_player";

class GameScene extends Phaser.Scene {
  preload() {
    this.load.spritesheet("player", "/images/player_spritesheet.png", {
      frameWidth: 32,  // Width of ONE frame in pixels
      frameHeight: 32, // Height of ONE frame in pixels
    });
  }

  create() {
    this.players = {};

    // Listen for presence events
    channel.on("presence_diff", diff => {
      console.log("Presence diff:", diff);
      this.handlePresenceDiff(diff);
    });

    channel.join().
      receive("ok", data => {
        this.currentPlayer = new CurrentPlayer(this, channel, data.player);

        console.log("Initial players:", data.presence_state);
        this.spawnPlayers(data.presence_state); // Render existing players
      });
  }

  update() {
    if (this.currentPlayer) {
      this.currentPlayer.handleUpdate();
    }
	}

  // Spawn all players (including the current user)
  spawnPlayers(players) {
    for (const [id, {metas: [player]}] of Object.entries(players)) {
      if (id != this.currentPlayer.userId) {  // Skip self
        this.addPlayer(player);
      }
    }
  }

  // Add/update a player's avatar and name label
  addPlayer(player) {
    console.log("Adding player", player);
    const { id, name, x, y } = player;

    // Create sprite (if not exists)
    if (!this.players[id]) {
      this.players[id] = this.add.sprite(x, y, "/images/player_spritesheet.png");

      this.players[id].name = this.add.text(x, y - 20, name, {
        fontSize: "16px",
        color: "#FFFFFF"
      });
    }

    // Update position
    this.players[id].setPosition(x, y);
    this.players[id].name.setPosition(x, y - 20);
  }

  // Handle presence changes (joins/leaves/updates)
  handlePresenceDiff(diff) {
    for (const [id, {metas: [player]}] of Object.entries(diff.joins)) {
      if (id != this.currentPlayer.userId) {  // Skip self
        this.addPlayer(player);
      }
    }

    // Players who left
    for (const id of Object.keys(diff.leaves)) {
      if (id != this.currentPlayer.userId) {  // Skip self
        this.players[id]?.destroy(); // Remove sprite
        this.players[id]?.name?.destroy(); // Remove label
        delete this.players[id];
      }
    }
  }
}

let socket = new Socket("/socket", { params: { token: "ABCE" } });
socket.connect();

let channel = socket.channel("room:lobby", {});
let presence = new Presence(channel)

window.addEventListener("beforeunload", () => {
  channel.leave();
});

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
  scene: GameScene,
};

new Phaser.Game(config);
