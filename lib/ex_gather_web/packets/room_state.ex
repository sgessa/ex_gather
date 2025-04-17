defmodule ExGatherWeb.Packets.RoomState do
  alias ExGatherWeb.PacketWriter
  alias ExGatherWeb.Packets

  @spec build([any()]) :: binary()
  def build(players) when is_list(players) do
    length = length(players)

    PacketWriter.build()
    |> PacketWriter.uint8(length)
    |> PacketWriter.reduce(players, fn player, acc ->
      PacketWriter.append(acc, Packets.Player.build(player))
    end)
  end
end
