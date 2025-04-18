import PacketWriter from '../packet_writer';

export default class WebrtcOfferPacket {
  constructor() {
    this.writer = new PacketWriter();
  }

  build(offer) {
    this.writer.string(offer.sdp);
    return this.writer.build();
  }
}

