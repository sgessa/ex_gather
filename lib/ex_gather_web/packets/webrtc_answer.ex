defmodule ExGatherWeb.Packets.WebrtcAnswer do
  alias ExGatherWeb.PacketWriter

  def build(answer) do
    PacketWriter.build()
    |> PacketWriter.string(answer["sdp"])
  end
end
