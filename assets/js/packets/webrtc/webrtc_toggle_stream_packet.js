import PacketWriter from '../packet_writer';
import PacketReader from '../packet_reader';

export default class WebrtcToggleStreamPacket {

  build(audioEnabled, cameraEnabled) {
    let writer = new PacketWriter();
    writer.bool(audioEnabled);
    writer.bool(cameraEnabled);

    return writer.build();
  }

  parse(packet) {
    let reader = new PacketReader(packet);

    return {
      playerId: reader.readUint64(),
      rtcAudioEnabled: reader.readBool(),
      rtcCameraEnabled: reader.readBool()
    };
  }

}

