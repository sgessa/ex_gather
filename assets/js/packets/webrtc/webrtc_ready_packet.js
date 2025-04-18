import PacketReader from "../packet_reader";

export default class WebrtcReadyPacket {
  constructor(packet) {
    this.reader = new PacketReader(packet);
  }

  parse() {
    return this.reader.readUint64();
  }
}


