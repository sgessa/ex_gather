import Phaser from "phaser";

import MapManager from "./managers/map_manager";
import ActorsManager from "./managers/actors_manager";
import SocketManager from "./managers/socket_manager";
import SpritesManager from "./managers/sprites_manager";
import VideoPlayersManager from "./managers/video_players_manager";
import StreamController from "./controllers/stream_controller";
import PlayerController from "./controllers/player_controller";
import ExRTCManager from "./managers/ex_rtc_manager";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.player = null;

    this.socketManager = new SocketManager();
    this.mapManager = new MapManager(this);
    this.actorsManager = new ActorsManager(this);
    this.spritesManager = new SpritesManager(this);
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

      // Initialize after connection network dependant managers
      this.videoPlayersManager = new VideoPlayersManager(this);
      this.streamController = new StreamController(this);
    });

    // Visual debug
    this.physics.world.createDebugGraphic();
  }

  update(time, delta) {
    this.player?.update(time, delta);
    this.actorsManager?.update();
  }

  handlePackets() {
    // Room flow
    this.socketManager.channel.on("room_state", data => {
      this.actorsManager.init(data.players);
      this.rtcManager = new ExRTCManager(this);
    });

    this.socketManager.channel.on("player_join", player => {
      this.actorsManager.spawn(player);
    });

    this.socketManager.channel.on("player_left", player => {
      this.actorsManager.remove(player);
    });

    this.socketManager.socket.onClose((event) => {
      window.location.reload();
    });

    // Listen for movement updates
    this.socketManager.channel.on("player_moved", data => {
      this.actorsManager.move(data.player_id, data);
    });

    // WebRTC peer negotiation
    this.socketManager.channel.on("exrtc_toggle_stream", data => {
      if (data.rtc_audio_enabled !== undefined) {
        this.videoPlayersManager.toggleSource(data.player_id, data.rtc_audio_enabled, "audio");
      }

      if (data.rtc_camera_enabled !== undefined) {
        this.videoPlayersManager.toggleSource(data.player_id, data.rtc_camera_enabled, "video");
      }
    });

    this.socketManager.channel.on("exrtc_renegotiate", data => {
      this.rtcManager.init();
    });

    this.socketManager.channel.on("exrtc_ice", data => {
      this.rtcManager.handleIce(data.ice);
    });

    this.socketManager.channel.on("exrtc_answer", data => {
      this.rtcManager.handleAnswer(data.answer);
    });
  }
}
