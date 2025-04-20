defmodule ExGatherWeb.Packets.ChatMsg do
  @moduledoc """
  This module handles the chat message packets.
  """

  alias ExGatherWeb.PacketReader
  alias ExGatherWeb.PacketWriter

  def build(player_id, type, msg) do
    PacketWriter.build()
    |> PacketWriter.uint64(player_id)
    |> PacketWriter.uint8(type)
    |> PacketWriter.string(msg)
  end

  def parse(packet) do
    {type, packet} = PacketReader.uint8(packet)
    {dest, packet} = PacketReader.uint8(packet)
    {msg, _packet} = PacketReader.string(packet)

    %{"type" => type, "msg" => msg, "dest" => dest}
  end
end
