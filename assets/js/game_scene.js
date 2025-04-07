import Phaser from "phaser";

import MapManager from "./managers/map_manager";
import ActorsManager from "./managers/actors_manager";
import SocketManager from "./managers/socket_manager";
import SpritesManager from "./managers/sprites_manager";
import RTCManager from "./managers/rtc_manager";

import PlayerController from "./controllers/player_controller";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.player = null;

    this.mapManager = new MapManager(this);
    this.actorsManager = new ActorsManager(this);
    this.spritesManager = new SpritesManager(this);
    this.rtcManager = new RTCManager(this);
    this.socketManager = new SocketManager();
  }

  preload() {
    this.mapManager.preload();
    this.spritesManager.preload();
  }

  create() {
    this.mapManager.create();

    this.socketManager.init((data) => {
      this.player = new PlayerController(this, this.socketManager.channel, data.player);
      this.handlePackets();
      this.rtcManager.init();
    });
  }

  update() {
    this.player?.update();
    this.actorsManager?.update();
  }

  handlePackets() {
    // Listen for presence events
    this.socketManager.channel.on("room_state", data => {
      this.actorsManager.init(data.players);
    });

    this.socketManager.channel.on("player_join", player => {
      this.actorsManager.spawn(player);
    });

    this.socketManager.channel.on("player_left", player => {
      this.actorsManager.remove(player);
    });

    // Listen for movement updates
    this.socketManager.channel.on("player_moved", data => {
      this.actorsManager.move(data.id, data);
    });

    // Listen for RTC negotiation
    this.socketManager.channel.on("answer", data => {
      this.rtcManager.handleAnswer(data);
    });

    this.socketManager.channel.on("ice", data => {
      this.rtcManager.handleIceCandidate(data);
    });
  }
}