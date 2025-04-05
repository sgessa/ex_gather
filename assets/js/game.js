import {Socket, Presence} from "phoenix"
import Phaser from "phaser";
import CurrentPlayer from "./current_player";
import RemotePlayer from "./remote_player";

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

    // Listen for movement updates
    channel.on("player_moved", payload => {
      const { id, x, y, dir, state } = payload;
      const player = this.players[id];

      if (player) {
        // Apply tween for smooth movement
        this.tweens.add({
          targets: player.sprite,
          x: x,
          y: y,
          duration: 100, // Matches network update rate
          ease: 'Linear'
        });

        // Update animation
        if (player.state !== state || player.direction !== dir) {
          player.sprite.play(`${state}_${dir}`);
        }

        player.direction = dir;
        player.state = state;
      }
    });

    channel.join().
      receive("ok", data => {
        this.currentPlayer = new CurrentPlayer(this, channel, data.player);
        this.spawnPlayers(data.presence_state); // Render existing players
      });
  }

  update() {
    if (this.currentPlayer) {
      this.currentPlayer.handleUpdate();
    }

    for (const player of Object.values(this.players)) {
      player.handleUpdate();
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
  addPlayer(playerInfo) {
    const { id, username, x, y, dir, state } = playerInfo;

    // Create sprite (if not exists)
    if (!this.players[id]) {
      this.players[id] = new RemotePlayer(this, username, x, y, dir, state);
    }

    // Update position
    let player = this.players[id];
    player.sprite.setPosition(x, y);
    player.name.setPosition(x, y - 20);
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
      this.players[id]?.destroy();
      delete this.players[id];
    }
  }
}

token = document.querySelector("meta[name='auth-token']").getAttribute("content");
socket = new Socket("/socket", { params: { token: token } });
socket.connect();

let channel = socket.channel("room:lobby", {x: 100, y: 100, dir: "down", state: "idle"});
presence = new Presence(channel)

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

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("game-container")) {
    console.log("Game container found, starting game...");
    new Phaser.Game(config);
  }
});
