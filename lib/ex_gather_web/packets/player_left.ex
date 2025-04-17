defmodule ExGatherWeb.Packets.PlayerLeft do
  alias ExGatherWeb.PacketWriter

  def build(player_id) do
    PacketWriter.build()
    |> PacketWriter.uint64(player_id)
  end
end
