defmodule ExGatherWeb.Packets.WebrtcIceCandidate do
  alias ExGatherWeb.PacketWriter
  alias ExGatherWeb.PacketReader

  def build(candidate) do
    PacketWriter.build()
    |> PacketWriter.string(candidate.candidate)
    |> PacketWriter.uint16(candidate.sdp_m_line_index)
    |> PacketWriter.string(candidate.sdp_mid)
    |> PacketWriter.string(candidate.username_fragment)
  end

  def parse(packet) do
    {candidate, packet} = PacketReader.string(packet)
    {sdp_m_line_index, packet} = PacketReader.uint16(packet)
    {sdp_mid, packet} = PacketReader.string(packet)
    {username_fragment, _packet} = PacketReader.string(packet)

    struct(
      ExWebRTC.ICECandidate,
      candidate: candidate,
      sdp_m_line_index: sdp_m_line_index,
      sdp_mid: sdp_mid,
      username_fragment: username_fragment
    )
  end
end
