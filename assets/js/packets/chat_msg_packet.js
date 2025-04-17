import PacketWriter from './packet_writer';
import PacketReader from './packet_reader';

export default class ChatMsgPacket {
  constructor() {
  }

  build(type, msg) {
    let writer = new PacketWriter();
    writer.uint8(type);
    writer.string(msg);

    return writer.build();
  }

  parse(packet) {
    let reader = new PacketReader(packet);

    return {
      player_id: reader.readUint64(),
      type: reader.readUint8(),
      msg: reader.readString()
    }
  }
}

