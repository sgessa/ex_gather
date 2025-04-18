defmodule ExGatherWeb.Packets.WebrtcToggleStream do
  alias ExGatherWeb.PacketWriter
  alias ExGatherWeb.PacketReader

  def build(player_id, audio_enabled, camera_enabled) do
    PacketWriter.build()
    |> PacketWriter.uint64(player_id)
    |> PacketWriter.bool(audio_enabled)
    |> PacketWriter.bool(camera_enabled)
  end

  def parse(packet) do
    {audio_enabled, packet} = PacketReader.bool(packet)
    {camera_enabled, _packet} = PacketReader.bool(packet)

    %{
      "rtc_audio_enabled" => audio_enabled,
      "rtc_camera_enabled" => camera_enabled
    }
  end
end
