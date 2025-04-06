defmodule ExGather.Room.RTC do
  require Logger

  alias ExWebRTC.{
    ICECandidate,
    MediaStreamTrack,
    PeerConnection,
    RTPCodecParameters,
    SessionDescription
  }

  @ice_servers [%{urls: "stun:stun.l.google.com:19302"}]

  @audio_codecs [
    %RTPCodecParameters{
      payload_type: 111,
      mime_type: "audio/opus",
      clock_rate: 48_000,
      channels: 2
    }
  ]

  #
  # Start client
  #

  def start() do
    try do
      {:ok, pc} =
        PeerConnection.start_link(
          ice_servers: @ice_servers,
          audio_codecs: @audio_codecs
        )

      Process.monitor(pc)

      stream_id = MediaStreamTrack.generate_stream_id()
      audio_track = MediaStreamTrack.new(:audio, [stream_id])
      {:ok, _sender} = PeerConnection.add_track(pc, audio_track)

      {:ok, %{pid: pc, track: audio_track}}
    rescue
      _ -> :error
    end
  end

  #
  # Negotiation
  #

  def handle_offer(data, pc) do
    offer = SessionDescription.from_json(data)
    :ok = PeerConnection.set_remote_description(pc, offer)

    {:ok, answer} = PeerConnection.create_answer(pc)
    :ok = PeerConnection.set_local_description(pc, answer)

    {:ok, SessionDescription.to_json(answer)}
  end

  def handle_ice(data, pc) do
    candidate = ICECandidate.from_json(data)
    PeerConnection.add_ice_candidate(pc, candidate)
  end
end
