defmodule ExGatherWeb.PacketReader do
  @spec uint8(binary()) :: {integer(), binary()}
  def uint8(packet) do
    <<value::little-unsigned-integer-size(8), rest::binary>> = packet
    {value, rest}
  end

  @spec uint16(binary()) :: {integer(), binary()}
  def uint16(packet) do
    <<value::little-unsigned-integer-size(16), rest::binary>> = packet
    {value, rest}
  end

  @spec uint64(binary()) :: {integer(), binary()}
  def uint64(packet) do
    <<value::little-unsigned-integer-size(64), rest::binary>> = packet
    {value, rest}
  end

  @spec int32(binary()) :: {integer(), binary()}
  def int32(packet) do
    <<value::little-integer-size(32), rest::binary>> = packet
    {value, rest}
  end

  @spec int64(binary()) :: {integer(), binary()}
  def int64(packet) do
    <<value::little-signed-integer-size(64), rest::binary>> = packet
    {value, rest}
  end

  @spec bool(binary()) :: {boolean(), binary()}
  def bool(packet) do
    <<value::little-unsigned-integer-size(8), rest::binary>> = packet

    case value do
      0 -> {false, rest}
      1 -> {true, rest}
    end
  end

  @spec string(binary()) :: {String.t(), binary()} | {nil, binary()}
  def string(packet) do
    <<length::little-unsigned-integer-size(32), rest::bytes>> = packet

    if length > 0 do
      <<value::bytes-size(length), rest::bytes>> = rest
      {value, rest}
    else
      {nil, rest}
    end
  end
end
