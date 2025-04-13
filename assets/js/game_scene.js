import Phaser from "phaser";

import MapManager from "./managers/map_manager";
import ActorsManager from "./managers/actors_manager";
import SocketManager from "./managers/socket_manager";
import SpritesManager from "./managers/sprites_manager";
import RTCManager from "./managers/rtc_manager";
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
      //this.rtcManager = new RTCManager(this);
    });

    // Visual debug
    this.physics.world.createDebugGraphic();
  }

  update(time, delta) {
    this.player?.update(time, delta);
    this.actorsManager?.update();
  }

  handlePackets() {
    // Listen for presence events
    this.socketManager.channel.on("room_state", data => {
      this.actorsManager.init(data.players);

      this.socketManager.push("exrtc_start", {});
    });

    this.socketManager.channel.on("player_join", player => {
      this.actorsManager.spawn(player);
      //this.rtcManager.handleNewPeer(player.id);
    });

    this.socketManager.channel.on("player_left", player => {
      this.actorsManager.remove(player);
      //this.rtcManager.handleDisconnect(player.id);
    });

    // Listen for movement updates
    this.socketManager.channel.on("player_moved", data => {
      this.actorsManager.move(data.player_id, data);
    });

    // Listen for RTC negotiation
    this.socketManager.channel.on("webrtc_offer", data => {
      let { player_id, offer } = data;
      //this.rtcManager.handleOffer(player_id, offer);
    });

    this.socketManager.channel.on("webrtc_answer", data => {
      let { player_id, answer } = data;
      //this.rtcManager.handleAnswer(player_id, answer);
    });

    this.socketManager.channel.on("webrtc_candidate", data => {
      let { player_id, candidate } = data;
      //this.rtcManager.handleIceCandidate(player_id, candidate);
    });

    this.socketManager.channel.on("webrtc_audio", data => {
      //this.videoPlayersManager.toggleSource(data.player_id, data.audio_enabled, "audio");
    });

    this.socketManager.channel.on("exrtc_ready", data => {
      this.exRTCManager = new ExRTCManager(this);
    });

    this.socketManager.channel.on("exrtc_renegotiate", data => {
      this.exRTCManager.peer.close();
      this.exRTCManager.init();
    });

    this.socketManager.channel.on("exrtc_ice", data => {
      this.exRTCManager.handleIce(data.ice);
    });

    this.socketManager.channel.on("exrtc_answer", data => {
      this.exRTCManager.handleAnswer(data.answer);
    });

    this.socketManager.socket.onClose((event) => {
      window.location.reload();
    });
  }


  showClickMarker(position) {
    // Remove previous marker if exists
    if (this.clickMarker) this.clickMarker.destroy();

    // Create new marker (green circle with slight transparency)
    this.clickMarker = this.add.graphics();
    this.clickMarker.fillStyle(0x00ff00, 0.5);
    this.clickMarker.fillCircle(position.x, position.y, 8);

    // Fade out after 1 second
    this.time.delayedCall(1000, () => {
      if (this.clickMarker) {
        this.clickMarker.destroy();
        this.clickMarker = null;
      }
    });
  }
}
