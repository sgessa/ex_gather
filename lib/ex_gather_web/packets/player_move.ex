defmodule ExGatherWeb.Packets.PlayerMove do
  alias ExGatherWeb.PacketReader
  alias ExGather.Room.Player

  def parse(packet) do
    {x, packet} = PacketReader.int32(packet)
    {y, packet} = PacketReader.int32(packet)
    {dir_x, packet} = PacketReader.uint8(packet)
    {dir_y, packet} = PacketReader.uint8(packet)
    {state, _packet} = PacketReader.uint8(packet)

    %{
      x: x,
      y: y,
      dir_x: Player.Direction.cast!(dir_x),
      dir_y: Player.Direction.cast!(dir_y),
      state: Player.State.cast!(state)
    }
  end
end
