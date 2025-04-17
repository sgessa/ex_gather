import PacketWriter from '../packet_writer';

export default class PlayerMovePacket {
  constructor() {
    this.writer = new PacketWriter();
  }

  build(x, y, dirX, dirY, state) {
    this.writer.int32(x);
    this.writer.int32(y);
    this.writer.uint8(dirX === 'left' ? 0 : 1);
    this.writer.uint8(dirY === 'up' ? 2 : 3);
    this.writer.uint8(state === 'idle' ? 0 : 1);
    return this.writer.build();
  }
}
