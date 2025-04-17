defmodule ExGatherWeb.Packets.WebrtcOffer do
  alias ExGatherWeb.PacketReader

  def parse(packet) do
    {sdp, _packet} = PacketReader.string(packet)

    %{"type" => "offer", "sdp" => sdp}
  end
end
