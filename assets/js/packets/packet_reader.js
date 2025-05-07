export default class PacketReader {
  constructor(packet) {
    this.view = new DataView(packet);
    this.offset = 0;
  }

  readUint8() {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readUint16() {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readUint64() {
    const value = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    return Number(value);
  }

  readInt32() {
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readBool() {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value === 1;
  }

  readString() {
    const length = this.view.getUint32(this.offset, true);
    this.offset += 4;
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }
}
