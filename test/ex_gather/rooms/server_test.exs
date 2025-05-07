defmodule ExGather.Rooms.ServerTest do
  use ExGather.DataCase, async: false
  use Mimic

  alias ExGather.Room.Server
  alias ExGather.Room.Player
  alias ExGatherWeb.Packets

  import ExMachina, only: [sequence: 2]
  import ExRTCTestHelper

  @video_track_id 1
  @audio_track_id 2

  @player_id 1
  @renegotiator_id 2

  setup :set_mimic_global
  setup :verify_on_exit!

  defp call(args, state \\ %Server{}),
    do: Server.handle_call(args, {self(), %{}}, state)

  defp cast(args, state),
    do: Server.handle_cast(args, state)

  setup do
    user = insert(:user)
    player = Map.take(user, [:id, :username])

    {:ok, room} = GenServer.start(Server, name: :"room:#{sequence(:room, & &1)}")
    %{player: player, room: room, server_state: %Server{}}
  end

  describe "retain" do
    test "ok", %{player: player} do
      assert {:reply, {:ok, retained, players}, state} =
               call({:join, player})

      assert %Player{
               x: 4,
               y: 16,
               dir_x: 0,
               dir_y: 3,
               state: 0,
               rtc_pid: nil,
               rtc_ready: false,
               rtc_audio_enabled: false,
               rtc_camera_enabled: false,
               rtc_tracks: %{}
             } = retained

      assert retained.username == player.username
      assert retained.id == player.id

      assert %{video: video_track, audio: audio_track} = retained.rtc_tracks
      assert video_track.id
      assert audio_track.id

      assert Enum.member?(players, retained) == true
      assert state.players == Enum.into(players, %{}, fn player -> {player.id, player} end)
    end
  end

  describe "leave" do
    setup %{server_state: state} do
      state = put_in(state.players[1], %Player{id: 1})
      state = put_in(state.players[2], %Player{id: 2})

      %{server_state: state}
    end

    test "ok", %{server_state: state} do
      assert {:reply, :ok, state} = call({:leave, 1}, state)
      refute state.players[1]
      assert state.players[2]
    end
  end

  describe "update_player" do
    setup %{server_state: state} do
      state = put_in(state.players[1], %Player{id: 1, rtc_ready: false})

      %{server_state: state}
    end

    test "ok", %{server_state: state} do
      assert {:noreply, state} = cast({:update_player, 1, %{rtc_ready: true}}, state)
      assert state.players[1].rtc_ready
    end
  end

  describe "exrtc" do
    setup %{server_state: state} do
      state =
        put_in(state.players[@player_id], %Player{
          id: @player_id,
          socket_pid: self(),
          rtc_tracks: %{audio: %{id: @audio_track_id}, video: %{id: @video_track_id}}
        })

      %{server_state: state}
    end

    test "ok - offer", %{server_state: state} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()
      assert {:noreply, state} = cast({:exrtc_offer, @player_id, rtc_pid, sdp_offer()}, state)

      # GenServer asks Room Channel to push answer
      answer = Packets.WebrtcAnswer.build(sdp_offer())
      assert_receive {:push, "exrtc_answer", ^answer}

      assert state_player = state.players[@player_id]
      assert state_player.rtc_pid == rtc_pid
      refute state_player.rtc_ready
    end

    test "ok - renegotiated offer", %{server_state: state} do
      expect_exrtc_offer_negotiation()

      # First offer
      rtc_pid = :c.pid(0, 255, 0)
      assert {:noreply, state} = cast({:exrtc_offer, @player_id, rtc_pid, sdp_offer()}, state)

      # Second offer closes the previous PID
      expect_peer_closure(rtc_pid)

      rtc_pid = self()
      assert {:noreply, state} = cast({:exrtc_offer, @player_id, rtc_pid, sdp_offer()}, state)
      assert state.players[@player_id].rtc_pid == rtc_pid
    end

    test "ok - offer with renegotiation", %{server_state: state} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      assert {:noreply, state} = cast({:exrtc_offer, @player_id, rtc_pid, sdp_offer()}, state)

      # Second user negotiates

      # Expects `Renegotiator` tracks being attached to `Player`
      expect_exrtc_add_track()

      # Expects lookup on `Player` tracks to check if `Renegotiator` one are already presenter
      expect_exrtc_get_sender()

      state =
        put_in(state.players[2], %Player{
          id: @renegotiator_id,
          socket_pid: self(),
          rtc_tracks: %{audio: %{id: @audio_track_id}, video: %{id: @video_track_id}}
        })

      assert {:noreply, state} =
               cast({:exrtc_offer, @renegotiator_id, rtc_pid, sdp_offer()}, state)

      # GenServer asks `Renegotiator` to renegotiate
      assert_receive {:push, "exrtc_renegotiate", ""}

      # When `Renegotiator` leave the room, tracks get removed from `Player`
      expect_exrtc_remove_track()

      assert {:reply, :ok, state} = call({:leave, @player_id}, state)

      refute state.players[1]
      assert state.players[2]
    end

    test "ok - offer no renegotiation", %{server_state: state} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      assert {:noreply, state} =
               cast({:exrtc_offer, @player_id, rtc_pid, sdp_offer()}, state)

      # Second user negotiates

      # Expects `Renegotiator` tracks being attached to `Player`
      expect_exrtc_add_track()

      track_id =
        state.players[@player_id].rtc_tracks.video.id

      # Expects lookup on `Renegotiator` tracks to check if `Player` one are already presenter
      expect_exrtc_get_sender(%{id: track_id})

      state =
        put_in(state.players[@renegotiator_id], %Player{
          id: 2,
          socket_pid: self(),
          rtc_tracks: %{video: %{id: @video_track_id}, audio: %{id: @audio_track_id}}
        })

      assert {:noreply, _state} =
               cast({:exrtc_offer, @renegotiator_id, rtc_pid, sdp_offer()}, state)

      # GenServer doesn't asks renegotiation because `Renegotiator` already has `Player` tracks
      refute_receive {:push, "exrtc_renegotiate", %{}}
    end

    test "ok - rtc ice", %{server_state: state} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      expect_webrtc_ice_negotiation()

      state = put_in(state.players[@player_id], %Player{id: @player_id, rtc_pid: rtc_pid})
      assert {:noreply, _state} = cast({:exrtc_ice, @player_id, ice_candidate_payload()}, state)
    end

    test "ok - forward rtp", %{server_state: state} do
      expect_exrtc_offer_negotiation()

      sender_rtc_pid = self()
      receiver_rtc_pid = :c.pid(0, 255, 0)

      state =
        put_in(state.players[@player_id], %Player{
          id: @player_id,
          rtc_pid: sender_rtc_pid,
          rtc_ready: true,
          rtc_tracks: %{video: %{id: @video_track_id}, audio: %{id: @audio_track_id}}
        })

      state =
        put_in(state.players[@renegotiator_id], %Player{
          id: @renegotiator_id,
          rtc_pid: receiver_rtc_pid,
          rtc_ready: true
        })

      expect_exrtc_get_receiver()
      expect_exrtc_send_rtp(receiver_rtc_pid, @video_track_id, "rtp-packet")

      {:noreply, _state} = cast({:exrtc_send_rtp, @player_id, "video-id", "rtp-packet"}, state)

      # Audio
      expect_exrtc_get_receiver()
      expect_exrtc_send_rtp(receiver_rtc_pid, @audio_track_id, "rtp-packet")

      {:noreply, _state} = cast({:exrtc_send_rtp, @player_id, "audio-id", "rtp-packet"}, state)
    end
  end

  describe "player_chat" do
    test "ok - public chat", %{server_state: state} do
      state =
        put_in(state.players, %{
          1 => %Player{id: 1, socket_pid: self()},
          2 => %Player{id: 2, socket_pid: nil}
        })

      sender_id = 1
      msg_type = 0
      msg = "Hello, world"

      {:noreply, _state} = cast({:player_chat, sender_id, nil, msg_type, msg}, state)

      packet = Packets.ChatMsg.build(sender_id, msg_type, msg)
      assert_receive {:broadcast, "player_chat", ^packet}
    end

    test "ok - whisper", %{server_state: state} do
      state =
        put_in(state.players, %{
          1 => %Player{id: 1, socket_pid: nil},
          2 => %Player{id: 2, socket_pid: self()}
        })

      sender_id = 1
      msg_type = 2
      dest_id = 2
      msg = "Hello, world"

      {:noreply, _state} = cast({:player_chat, sender_id, dest_id, msg_type, msg}, state)

      packet = Packets.ChatMsg.build(sender_id, msg_type, msg)
      assert_receive {:push, "player_chat", ^packet}
    end
  end
end
