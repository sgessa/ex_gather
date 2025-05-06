import PacketWriter from './packet_writer';
import PacketReader from './packet_reader';

export default class ChatMsgPacket {
  build(type, dest, msg) {
    let writer = new PacketWriter();
    writer.uint8(type);
    writer.int64(dest);
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

