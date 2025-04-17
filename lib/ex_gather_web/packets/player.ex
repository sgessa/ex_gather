defmodule ExGatherWeb.Packets.Player do
  @moduledoc """
  This module handles the player data packets.
  """

  alias ExGatherWeb.PacketWriter

  def build(player) do
    %{audio: audio, video: video} = player.rtc_tracks

    PacketWriter.build()
    |> PacketWriter.uint64(player.id)
    |> PacketWriter.int32(player.x)
    |> PacketWriter.int32(player.y)
    |> PacketWriter.uint8(player.dir_x)
    |> PacketWriter.uint8(player.dir_y)
    |> PacketWriter.uint8(player.state)
    |> PacketWriter.string(player.username)
    |> PacketWriter.bool(player.rtc_audio_enabled)
    |> PacketWriter.bool(player.rtc_camera_enabled)
    |> PacketWriter.string(hd(audio.streams))
    |> PacketWriter.string(hd(video.streams))
  end
end
