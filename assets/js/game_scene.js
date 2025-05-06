import Phaser from "phaser";

import MapManager from "./managers/map_manager";
import ActorsManager from "./managers/actors_manager";
import SocketManager from "./managers/socket_manager";
import SpritesManager from "./managers/sprites_manager";
import VideoPlayersManager from "./managers/video_players_manager";
import StreamController from "./controllers/stream_controller";
import PlayerController from "./controllers/player_controller";
import ChatManager from "./managers/chat_manager";
import ExRTCManager from "./managers/ex_rtc_manager";
import RoomStatePacket from "./packets/room_state_packet";
import PlayerPacket from "./packets/player_packet";
import PlayerLeftPacket from "./packets/player/player_left_packet";
import ChatMsgPacket from "./packets/chat_msg_packet";
import PlayerMovedPacket from "./packets/player/player_moved_packet";
import WebrtcAnswerPacket from "./packets/webrtc/webrtc_answer_packet";
import WebrtcIceCandidatePacket from "./packets/webrtc/webrtc_ice_candidate_packet";
import WebrtcReadyPacket from "./packets/webrtc/webrtc_ready_packet";
import WebrtcToggleStreamPacket from "./packets/webrtc/webrtc_toggle_stream_packet";

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

    this.socketManager.init((playerPacket) => {
      this.player = new PlayerController(this, this.socketManager.channel, playerPacket);
      this.handlePackets();

      // Initialize after connection network dependant managers
      this.videoPlayersManager = new VideoPlayersManager(this);
      this.streamController = new StreamController(this);
      this.chatManager = new ChatManager(this);
    });

    // Visual debug
    // this.physics.world.createDebugGraphic();
  }

  update(time, delta) {
    this.player?.update(time, delta);
    this.actorsManager?.update();
  }

  handlePackets() {
    // Room flow
    this.socketManager.channel.on("room_state", data => {
      const packet = new RoomStatePacket(data);
      this.actorsManager.init(packet.parse());
      this.chatManager.init();
      this.rtcManager = new ExRTCManager(this);
    });

    this.socketManager.channel.on("player_join", data => {
      const packet = new PlayerPacket(data).parse();
      this.actorsManager.spawn(packet);
      this.chatManager.addDest(packet.id);
    });

    this.socketManager.channel.on("player_left", data => {
      const packet = new PlayerLeftPacket(data);
      const id = packet.parse();

      this.actorsManager.remove(id);
      this.chatManager.removeDest(id);
    });

    this.socketManager.socket.onClose((event) => {
      window.location.reload();
    });

    // Listen for movement updates
    this.socketManager.channel.on("player_moved", data => {
      const packet = new PlayerMovedPacket(data);
      this.actorsManager.move(packet.parse());
    });

    // Listen for chat messages
    this.socketManager.channel.on("player_chat", data => {
      const packet = new ChatMsgPacket();
      const { player_id, type, msg } = packet.parse(data);
      this.chatManager.handleMessage(player_id, type, msg);
    });

    // WebRTC peer negotiation
    this.socketManager.channel.on("exrtc_toggle_stream", data => {
      const packet = new WebrtcToggleStreamPacket();
      const { playerId, rtcAudioEnabled, rtcCameraEnabled } = packet.parse(data);

      let actor = this.actorsManager.actors[playerId];

      if (actor.rtcAudioEnabled !== rtcAudioEnabled) {
        this.videoPlayersManager.toggleSource(playerId, rtcAudioEnabled, "audio");
        actor.audioEnabled = rtcAudioEnabled;
      }

      if (actor.rtcCameraEnabled !== rtcCameraEnabled) {
        this.videoPlayersManager.toggleSource(playerId, rtcCameraEnabled, "video");
        actor.cameraEnabled = rtcCameraEnabled;
      }
    });

    this.socketManager.channel.on("exrtc_renegotiate", data => {
      this.rtcManager.init();
    });

    this.socketManager.channel.on("exrtc_ice", data => {
      const packet = new WebrtcIceCandidatePacket();
      this.rtcManager.handleIce(packet.parse(data));
    });

    this.socketManager.channel.on("exrtc_answer", data => {
      const packet = new WebrtcAnswerPacket(data);
      this.rtcManager.handleAnswer(packet.parse());
    });

    this.socketManager.channel.on("exrtc_ready", data => {
      const packet = new WebrtcReadyPacket(data);
      this.rtcManager.handleReady(packet.parse());
    })
  }
}
