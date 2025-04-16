defmodule ExGather.Rooms.ServerTest do
  use ExGather.DataCase, async: false
  use Mimic

  alias ExGather.Room.Server
  alias ExGather.Room.Player

  import ExMachina, only: [sequence: 2]
  import ExRTCTestHelper

  setup :set_mimic_global
  setup :verify_on_exit!

  setup do
    user = insert(:user)
    player = Map.take(user, [:id, :username])

    {:ok, room} = GenServer.start(Server, name: :"room:#{sequence(:room, & &1)}")
    %{player: player, room: room}
  end

  describe "retain" do
    test "ok", %{player: player, room: room} do
      assert {:ok, retained, players} = GenServer.call(room, {:join, player})

      assert %Player{
               x: 4,
               y: 16,
               dir_x: "left",
               dir_y: "down",
               state: "idle",
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

      assert Map.get(players, retained.id) == retained
      assert :sys.get_state(room).players == players
    end
  end

  describe "leave" do
    setup %{player: player, room: room} do
      exiter = insert(:user) |> Map.take([:id, :username])

      GenServer.call(room, {:join, player})
      GenServer.call(room, {:join, exiter})

      %{exiter: exiter}
    end

    test "ok", %{exiter: exiter, player: player, room: room} do
      assert :ok = GenServer.call(room, {:leave, exiter.id})

      state = :sys.get_state(room)
      refute state.players[exiter.id]
      assert state.players[player.id]
    end
  end

  describe "update_player" do
    setup %{player: player, room: room} do
      GenServer.call(room, {:join, player})
      :ok
    end

    test "ok", %{player: player, room: room} do
      assert :ok = GenServer.cast(room, {:update_player, player.id, %{rtc_ready: true}})
      assert :sys.get_state(room).players[player.id].rtc_ready
    end
  end

  describe "exrtc" do
    test "ok - offer", %{player: player, room: room} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()
      GenServer.call(room, {:join, player})
      assert :ok = GenServer.cast(room, {:exrtc_offer, player.id, rtc_pid, sdp_offer()})

      # GenServer asks Room Channel to push answer
      assert_receive {:push, "exrtc_answer",
                      %{"answer" => %{"sdp" => "a\nb\n\r", "type" => "offer"}}}

      assert state_player = :sys.get_state(room).players[player.id]
      assert state_player.rtc_pid == rtc_pid
      refute state_player.rtc_ready
    end

    test "ok - renegotiated offer", %{player: player, room: room} do
      expect_exrtc_offer_negotiation()

      # First offer
      rtc_pid = :c.pid(0, 255, 0)
      GenServer.call(room, {:join, player})
      assert :ok = GenServer.cast(room, {:exrtc_offer, player.id, rtc_pid, sdp_offer()})

      # Second offer closes the previous PID
      expect_peer_closure(rtc_pid)

      rtc_pid = self()
      assert :ok = GenServer.cast(room, {:exrtc_offer, player.id, rtc_pid, sdp_offer()})
      assert :ok = GenServer.call(room, {:leave, player.id})
    end

    test "ok - offer with renegotiation", %{player: player, room: room} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      renegotiator = insert(:user) |> Map.take([:id, :username])
      GenServer.call(room, {:join, renegotiator})
      assert :ok = GenServer.cast(room, {:exrtc_offer, renegotiator.id, rtc_pid, sdp_offer()})

      # Expects `Renegotiator` tracks being attached to `Player`
      expect_exrtc_add_track()

      # Expects lookup on `Player` tracks to check if `Renegotiator` one are already presenter
      expect_exrtc_get_sender()

      # Second user negotiates
      GenServer.call(room, {:join, player})
      assert :ok = GenServer.cast(room, {:exrtc_offer, player.id, rtc_pid, sdp_offer()})

      # GenServer asks `Renegotiator` to renegotiate
      assert_receive {:push, "exrtc_renegotiate", %{}}

      # When `Renegotiator` leave the room, tracks get removed from `Player`
      expect_exrtc_remove_track()
      assert :ok = GenServer.call(room, {:leave, renegotiator.id})
    end

    test "ok - offer no renegotiation", %{player: player, room: room} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      renegotiator = insert(:user) |> Map.take([:id, :username])
      GenServer.call(room, {:join, renegotiator})
      assert :ok = GenServer.cast(room, {:exrtc_offer, renegotiator.id, rtc_pid, sdp_offer()})

      # Expects `Renegotiator` tracks being attached to `Player`
      expect_exrtc_add_track()

      # Second user negotiates
      GenServer.call(room, {:join, player})

      track_id =
        :sys.get_state(room).players[player.id].rtc_tracks.video.id

      # Expects lookup on `Renegotiator` tracks to check if `Player` one are already presenter
      expect_exrtc_get_sender(%{id: track_id})

      assert :ok = GenServer.cast(room, {:exrtc_offer, player.id, rtc_pid, sdp_offer()})

      # GenServer doesn't asks renegotiation because `Renegotiator` already has `Player` tracks
      refute_receive {:push, "exrtc_renegotiate", %{}}
    end

    test "ok - rtc ice", %{player: player, room: room} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      GenServer.call(room, {:join, player})
      GenServer.cast(room, {:exrtc_offer, player.id, rtc_pid, sdp_offer()})
      GenServer.cast(room, {:update_player, player.id, %{rtc_ready: true}})

      expect_webrtc_ice_negotiation()

      assert :ok = GenServer.cast(room, {:exrtc_ice, player.id, ice_candidate_payload()})
      assert :ok = GenServer.call(room, {:leave, player.id})
    end

    test "ok - forward rtp", %{player: sender, room: room} do
      expect_exrtc_offer_negotiation()

      rtc_pid = self()

      # First user negotiates
      receiver = insert(:user) |> Map.take([:id, :username])
      GenServer.call(room, {:join, receiver})
      assert :ok = GenServer.cast(room, {:exrtc_offer, receiver.id, rtc_pid, sdp_offer()})

      expect_exrtc_add_track()
      expect_exrtc_get_sender()

      # Second user negotiates
      GenServer.call(room, {:join, sender})
      assert :ok = GenServer.cast(room, {:exrtc_offer, sender.id, rtc_pid, sdp_offer()})

      receiver_state = :sys.get_state(room).players[receiver.id]
      sender_state = :sys.get_state(room).players[sender.id]

      # Ensure receiver is ready
      GenServer.cast(room, {:update_player, receiver.id, %{rtc_ready: true}})

      # Video
      expect_exrtc_get_receiver()

      expect_exrtc_send_rtp(
        receiver_state.rtc_pid,
        sender_state.rtc_tracks.video.id,
        "rtp-packet"
      )

      GenServer.cast(room, {:exrtc_send_rtp, sender.id, "video-id", "rtp-packet"})

      # Audio
      expect_exrtc_get_receiver()

      expect_exrtc_send_rtp(
        receiver_state.rtc_pid,
        sender_state.rtc_tracks.audio.id,
        "rtp-packet"
      )

      GenServer.cast(room, {:exrtc_send_rtp, sender.id, "audio-id", "rtp-packet"})
    end
  end
end
