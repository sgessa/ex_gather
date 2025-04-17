import PacketReader from "../packet_reader";
import PacketWriter from "../packet_writer";

export default class WebrtcIceCandidatePacket {
  build(candidate) {
    let writer = new PacketWriter();
    writer.string(candidate.candidate);
    writer.uint16(candidate.sdpMLineIndex);
    writer.string(candidate.sdpMid);
    writer.string(candidate.usernameFragment);
    return writer.build();
  }

  parse(packet) {
    let reader = new PacketReader(packet);

    return {
      candidate: reader.readString(),
      sdpMLineIndex: reader.readUint16(),
      sdpMid: reader.readString(),
      usernameFragment: reader.readString()
    };
  }
}


