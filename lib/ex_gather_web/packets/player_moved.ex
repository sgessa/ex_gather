defmodule ExGatherWeb.Packets.PlayerMoved do
  alias ExGatherWeb.PacketWriter

  def build(player_id, movement) do
    PacketWriter.build()
    |> PacketWriter.uint64(player_id)
    |> PacketWriter.int32(movement.x)
    |> PacketWriter.int32(movement.y)
    |> PacketWriter.uint8(movement.dir_x)
    |> PacketWriter.uint8(movement.dir_y)
    |> PacketWriter.uint8(movement.state)
  end
end
