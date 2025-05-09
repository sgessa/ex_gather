defmodule ExGatherWeb.Packets.ChatMsg do
  @moduledoc """
  This module defines the chat message packet.
  """

  defstruct [:type, :msg, :rcpt]

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
    {rcpt, packet} = parse_recipient(type, packet)
    {msg, _packet} = PacketReader.string(packet)

    struct(__MODULE__, %{type: type, msg: msg, rcpt: rcpt})
  end

  defp parse_recipient(2, packet) do
    PacketReader.uint64(packet)
  end

  defp parse_recipient(_type, packet) do
    {nil, packet}
  end
end
