import PacketReader from "./packet_reader";
import { PLAYER_DIR, PLAYER_STATE } from "../const/player_const";

export default class PlayerPacket {
  constructor(packet) {
    this.reader = new PacketReader(packet);
  }

  parse() {
    return {
      id: this.reader.readUint64(),
      x: this.reader.readInt32(),
      y: this.reader.readInt32(),
      dirX: PLAYER_DIR[this.reader.readUint8()],
      dirY: PLAYER_DIR[this.reader.readUint8()],
      state: PLAYER_STATE[this.reader.readUint8()],
      username: this.reader.readString(),
      rtcAudioEnabled: this.reader.readBool(),
      rtcCameraEnabled: this.reader.readBool(),
      rtcTracks: {
        audioId: this.reader.readString(),
        videoId: this.reader.readString()
      }
    };
  }
}
