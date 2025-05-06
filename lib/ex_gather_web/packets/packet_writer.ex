defmodule ExGatherWeb.PacketWriter do
  @spec build() :: binary()
  def build do
    <<>>
  end

  @spec int64(binary(), integer()) :: binary()
  def int64(packet, value) do
    <<packet::bytes, value::little-signed-integer-size(64)>>
  end

  @spec uint64(binary(), integer()) :: binary()
  def uint64(packet, value) do
    <<packet::bytes, value::little-unsigned-integer-size(64)>>
  end

  @spec uint16(binary(), integer()) :: binary()
  def uint16(packet, value) do
    <<packet::bytes, value::little-unsigned-integer-size(16)>>
  end

  @spec uint8(binary(), integer()) :: binary()
  def uint8(packet, value) do
    <<packet::bytes, value::little-unsigned-integer-size(8)>>
  end

  @spec int32(binary(), integer()) :: binary()
  def int32(packet, value) do
    <<packet::bytes, value::little-integer-size(32)>>
  end

  @spec bool(binary(), boolean()) :: binary()
  def bool(packet, true), do: packet <> <<1>>
  def bool(packet, false), do: packet <> <<0>>

  @spec string(binary(), String.t()) :: binary()
  def string(packet, value) do
    value = if value, do: value, else: ""
    <<packet::bytes, byte_size(value)::little-unsigned-integer-size(32), value::binary>>
  end

  def append(packet, binary) do
    <<packet::bytes, binary::bytes>>
  end

  def reduce(packet, enum, fun) do
    Enum.reduce(enum, packet, fun)
  end
end
