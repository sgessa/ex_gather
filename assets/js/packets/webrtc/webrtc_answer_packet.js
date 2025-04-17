import PacketReader from "../packet_reader";

export default class WebrtcAnswerPacket {
  constructor(packet) {
    this.reader = new PacketReader(packet);
  }

  parse() {
    return {
      type: "answer",
      sdp: this.reader.readString()
    };
  }
}


