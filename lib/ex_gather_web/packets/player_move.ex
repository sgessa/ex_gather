defmodule ExGatherWeb.Packets.PlayerMove do
  alias ExGatherWeb.PacketReader

  def parse(packet) do
    {x, packet} = PacketReader.int32(packet)
    {y, packet} = PacketReader.int32(packet)
    {dir_x, packet} = PacketReader.uint8(packet)
    {dir_y, packet} = PacketReader.uint8(packet)
    {state, _packet} = PacketReader.uint8(packet)

    %{
      x: x,
      y: y,
      dir_x: dir_x,
      dir_y: dir_y,
      state: state
    }
  end
end
