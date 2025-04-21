defmodule ExGather.Room.RTC do
  require Logger

  alias ExWebRTC.{
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

  @video_codecs [
    %RTPCodecParameters{
      payload_type: 96,
      mime_type: "video/VP8",
      clock_rate: 90_000
    }
  ]

  #
  # Peer Connection
  #

  def start_peer() do
    {:ok, pc} =
      PeerConnection.start_link(
        ice_servers: @ice_servers,
        audio_codecs: @audio_codecs,
        video_codecs: @video_codecs
      )

    Process.monitor(pc)

    {:ok, pc}
  end

  def close_peer(rtc_pid) when is_pid(rtc_pid) do
    ExWebRTC.PeerConnection.close(rtc_pid)
    Process.exit(rtc_pid, :kill)
  end

  def close_peer(_pid), do: :ok

  #
  # Tracks
  #

  # Links 3rd player track to current player's peer connection
  def create_stream_tracks() do
    audio_stream_id = MediaStreamTrack.generate_stream_id()
    video_stream_id = MediaStreamTrack.generate_stream_id()

    audio_track = MediaStreamTrack.new(:audio, [audio_stream_id])
    video_track = MediaStreamTrack.new(:video, [video_stream_id])

    {:ok, %{audio: audio_track, video: video_track}}
  end

  def attach_tracks_to_peer(pc, %{audio: audio_track, video: video_track}) do
    {:ok, video_sender} = PeerConnection.add_track(pc, video_track)
    {:ok, audio_sender} = PeerConnection.add_track(pc, audio_track)

    {:ok, %{audio: audio_sender, video: video_sender}}
  end

  def detach_tracks_from_peer(pc, %{audio: audio_track, video: video_track}) do
    PeerConnection.remove_track(pc, video_track.id)
    PeerConnection.remove_track(pc, audio_track.id)
  end

  def find_input_track(pc, id) do
    pc
    |> ExWebRTC.PeerConnection.get_transceivers()
    |> Enum.find(&(&1.receiver.track.id == id))
  end

  def find_output_tracks(pc, %{video: video, audio: audio}) do
    pc
    |> ExWebRTC.PeerConnection.get_transceivers()
    |> Enum.find(&(&1.sender.track && &1.sender.track.id in [video.id, audio.id]))
    |> case do
      nil -> false
      _ -> true
    end
  end

  #
  # Negotiation
  #

  def handle_offer(pc, offer) do
    :ok = PeerConnection.set_remote_description(pc, offer)

    {:ok, answer} = PeerConnection.create_answer(pc)
    :ok = PeerConnection.set_local_description(pc, answer)

    {:ok, SessionDescription.to_json(answer)}
  end

  def handle_ice(pc, candidate) do
    if pc && Process.alive?(pc) do
      PeerConnection.add_ice_candidate(pc, candidate)
    end

    :ok
  end

  #
  # Stream forwarding
  #

  def forward_rtp(to, track_id, packet) do
    Enum.each(
      to,
      &ExWebRTC.PeerConnection.send_rtp(
        &1,
        track_id,
        packet
      )
    )
  end
end
