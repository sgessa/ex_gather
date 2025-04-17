import PacketReader from "./packet_reader"

export default class RoomStatePacket {
  constructor(packet) {
    this.reader = new PacketReader(packet);
  }

  parse() {
    // TODO: Reuse logic from player_packet.js
    const dir = {
      0: "left",
      1: "right",
      2: "up",
      3: "down"
    };

    const states = {
      0: "idle",
      1: "walk",
    };


    const players = [];
    const playerCount = this.reader.readUint8();

    for (let i = 0; i < playerCount; i++) {
      const player = {
        id: this.reader.readUint64(),
        x: this.reader.readInt32(),
        y: this.reader.readInt32(),
        dirX: dir[this.reader.readUint8()],
        dirY: dir[this.reader.readUint8()],
        state: states[this.reader.readUint8()],
        username: this.reader.readString(),
        rtcAudioEnabled: this.reader.readBool(),
        rtcCameraEnabled: this.reader.readBool(),
        rtcTracks: {
          audioId: this.reader.readString(),
          videoId: this.reader.readString()
        }
      };

      players.push(player);
    }

    return players;
  }
}
