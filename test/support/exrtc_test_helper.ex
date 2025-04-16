defmodule ExRTCTestHelper do
  use ExUnit.Case
  use Mimic

  def expect_peer_closure(rtc_pid) do
    ExWebRTC.PeerConnection
    |> expect(:close, fn pid ->
      assert pid == rtc_pid
      :ok
    end)
  end

  def expect_exrtc_send_rtp(to, track_id, packet) do
    ExWebRTC.PeerConnection
    |> expect(:send_rtp, fn out_to, out_track_id, out_packet ->
      assert out_to == to
      assert out_track_id == track_id
      assert out_packet == packet
    end)
  end

  def expect_exrtc_get_sender(track \\ nil) do
    ExWebRTC.PeerConnection
    |> expect(:get_transceivers, fn _pid ->
      [%{sender: %{track: track}}]
    end)
  end

  def expect_exrtc_get_receiver() do
    ExWebRTC.PeerConnection
    |> expect(:get_transceivers, fn _pid ->
      [
        %{receiver: %{track: %{id: "audio-id"}}, kind: :audio},
        %{receiver: %{track: %{id: "video-id"}}, kind: :video}
      ]
    end)
  end

  def expect_exrtc_add_track() do
    ExWebRTC.PeerConnection
    |> expect(:add_track, 2, fn _pc_pid, _track_id ->
      {:ok, %{}}
    end)
  end

  def expect_exrtc_remove_track() do
    ExWebRTC.PeerConnection
    |> expect(:remove_track, 2, fn _pc, _track_id -> :ok end)
  end

  def expect_exrtc_offer_negotiation() do
    ExWebRTC.PeerConnection
    |> stub(:set_remote_description, fn _pc, _offer -> :ok end)

    ExWebRTC.PeerConnection
    |> stub(:create_answer, fn _pc ->
      {:ok, %ExWebRTC.SessionDescription{type: :offer, sdp: sdp_offer()["sdp"]}}
    end)

    ExWebRTC.PeerConnection
    |> stub(:set_local_description, fn _pc, _answer -> :ok end)
  end

  def expect_webrtc_ice_negotiation() do
    ExWebRTC.PeerConnection
    |> expect(:add_ice_candidate, fn _pc, _candidate -> :ok end)
  end

  def sdp_offer(),
    do: %{"sdp" => "a\nb\n\r", "type" => "offer"}

  def ice_candidate(),
    do: %ExWebRTC.ICECandidate{
      sdp_mid: "a\nb\n\r",
      username_fragment: "a",
      candidate: "b",
      sdp_m_line_index: 1
    }

  def ice_candidate_payload(),
    do: ice_candidate() |> ExWebRTC.ICECandidate.to_json()
end
