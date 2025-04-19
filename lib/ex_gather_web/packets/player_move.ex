defmodule ExGatherWeb.Packets.PlayerMove do
  alias ExGatherWeb.PacketReader

  defstruct [
    :x,
    :y,
    :dir_x,
    :dir_y,
    :state
  ]

  def parse(packet) do
    {x, packet} = PacketReader.int32(packet)
    {y, packet} = PacketReader.int32(packet)
    {dir_x, packet} = PacketReader.uint8(packet)
    {dir_y, packet} = PacketReader.uint8(packet)
    {state, _packet} = PacketReader.uint8(packet)

    struct(__MODULE__, %{
      x: x,
      y: y,
      dir_x: dir_x,
      dir_y: dir_y,
      state: state
    })
  end
end
