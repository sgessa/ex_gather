export default class PacketWriter {
  constructor() {
    this.buffer = new ArrayBuffer(0);
    this.view = new DataView(this.buffer);
    this.length = 0;
  }

  // Returns the final binary buffer
  build() {
    return this.buffer.slice(0, this.length);
  }

  // Appends an 8-bit unsigned integer
  uint8(value) {
    this.ensureCapacity(1);
    this.view.setUint8(this.length, value);
    this.length += 1;
    return this;
  }

  // Appends an 16-bit unsigned integer
  uint16(value) {
    this.ensureCapacity(2);
    this.view.setUint16(this.length, value);
    this.length += 2;
    return this;
  }

  // Appends a 64-bit unsigned integer (little-endian)
  uint64(value) {
    this.ensureCapacity(8);
    this.view.setBigUint64(this.length, BigInt(value), true);
    this.length += 8;
    return this;
  }

  // Appends a 32-bit signed integer (little-endian)
  int32(value) {
    this.ensureCapacity(4);
    this.view.setInt32(this.length, value, true);
    this.length += 4;
    return this;
  }

  bool(value) {
    this.ensureCapacity(1);
    this.view.setUint8(this.length, value ? 1 : 0);
    this.length += 1;
    return this;
  }

  // Appends a string (length-prefixed with 32-bit unsigned integer)
  string(value) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    this.ensureCapacity(4 + bytes.length);
    this.view.setUint32(this.length, bytes.length, true);
    this.length += 4;
    new Uint8Array(this.buffer, this.length, bytes.length).set(bytes);
    this.length += bytes.length;
    return this;
  }

  // Ensures the buffer has enough capacity, resizing if needed
  ensureCapacity(additional) {
    const required = this.length + additional;
    if (required > this.buffer.byteLength) {
      const newCapacity = Math.max(required, this.buffer.byteLength * 2 || 16);
      const newBuffer = new ArrayBuffer(newCapacity);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer);
    }
  }
}
