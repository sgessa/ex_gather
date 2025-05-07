import PacketWriter from './packet_writer';
import PacketReader from './packet_reader';
import { CHAT_TYPE } from '../const/chat_const';

export default class ChatMsgPacket {
  build(type, rcpt, msg) {
    let writer = new PacketWriter();
    writer.uint8(type);

    if (type === CHAT_TYPE.WHISPER) {
      writer.uint64(rcpt);
    }

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

