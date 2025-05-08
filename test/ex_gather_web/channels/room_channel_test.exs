defmodule ExGatherWeb.RoomChannelTest do
  use ExGatherWeb.ChannelCase
  use Mimic.DSL

  alias ExGather.Room
  alias ExGatherWeb.Packets
  alias ExGatherWeb.PacketWriter

  @player %Room.Player{
    id: 1,
    username: "test",
    rtc_tracks: %{
      audio: %ExWebRTC.MediaStreamTrack{
        id: 0,
        kind: :audio,
        streams: ["audio_stream_1"],
        rids: nil
      },
      video: %ExWebRTC.MediaStreamTrack{
        id: 1,
        kind: :video,
        streams: ["video_stream_1"],
        rids: nil
      }
    }
  }
  @player2 %Room.Player{
    id: 2,
    username: "test2",
    rtc_tracks: %{
      audio: %ExWebRTC.MediaStreamTrack{
        id: 2,
        kind: :audio,
        streams: ["audio_stream_2"],
        rids: nil
      },
      video: %ExWebRTC.MediaStreamTrack{
        id: 3,
        kind: :video,
        streams: ["video_stream_2"],
        rids: nil
      }
    }
  }

  setup :set_mimic_global

  setup do
    player_info = Map.take(@player, [:id, :username])

    expect(Room.Server.call(:"room:lobby", {:join, ^player_info})) do
      {:ok, @player, [@player2]}
    end

    token = Phoenix.Token.sign(ExGatherWeb.Endpoint, "user", %{id: 1, username: "test"})
    {:ok, socket} = Phoenix.ChannelTest.connect(ExGatherWeb.UserSocket, %{"token" => token})
    {:ok, _payload, socket} = subscribe_and_join(socket, "room:lobby")

    %{socket: socket}
  end

  describe "join" do
    test "successfully joins the channel", %{socket: socket} do
      assert socket.assigns.player == %{id: 1, username: "test"}
      assert socket.assigns.room_server == :"room:lobby"

      packet = Packets.RoomState.build([@player2])
      assert_push "room_state", {:binary, ^packet}

      packet = Packets.Player.build(@player)
      assert_broadcast "player_join", {:binary, ^packet}
    end

    test "error - invalid token" do
      :error =
        Phoenix.ChannelTest.connect(ExGatherWeb.UserSocket, %{"token" => "invalid-token"})
    end
  end

  describe "player_move" do
    test "broadcasts player move", %{socket: socket} do
      player_id = @player.id

      movement = %{
        x: @player.x,
        y: @player.y,
        dir_x: 0,
        dir_y: 2,
        state: 0
      }

      packet =
        PacketWriter.build()
        |> PacketWriter.int32(movement.x)
        |> PacketWriter.int32(movement.y)
        |> PacketWriter.uint8(movement.dir_x)
        |> PacketWriter.uint8(movement.dir_y)
        |> PacketWriter.uint8(movement.state)

      expect(Room.Server.cast(:"room:lobby", {:update_player, ^player_id, ^movement}), do: :ok)

      push(socket, "player_move", {:binary, packet})

      packet = Packets.PlayerMoved.build(@player.id, movement)
      assert_broadcast "player_moved", {:binary, ^packet}
    end
  end

  describe "player_chat" do
    test "broadcasts player chat message", %{socket: socket} do
      player_id = @player.id
      msg_type = 0
      message = "Hello, world!"

      packet =
        PacketWriter.build()
        |> PacketWriter.uint8(msg_type)
        |> PacketWriter.string(message)

      expect(
        Room.Server.cast(:"room:lobby", {:player_chat, ^player_id, nil, ^msg_type, ^message})
      ) do
        :ok
      end

      ref = push(socket, "player_chat", {:binary, packet})
      assert_reply ref, :ok
    end

    test "whispers player chat message", %{socket: socket} do
      player_id = @player.id
      msg_type = 2
      dest_id = 2
      message = "Hello, world!"

      packet =
        PacketWriter.build()
        |> PacketWriter.uint8(msg_type)
        |> PacketWriter.uint64(dest_id)
        |> PacketWriter.string(message)

      expect(
        Room.Server.cast(:"room:lobby", {:player_chat, ^player_id, ^dest_id, ^msg_type, ^message})
      ) do
        :ok
      end

      ref = push(socket, "player_chat", {:binary, packet})
      assert_reply ref, :ok
    end
  end

  describe "exrtc_offer" do
    test "handles WebRTC offer", %{socket: socket} do
      player_id = @player.id
      offer = %ExWebRTC.SessionDescription{type: :offer, sdp: "long sdp string"}
      packet = PacketWriter.build() |> PacketWriter.string(offer.sdp)

      expect(ExWebRTC.PeerConnection.start_link(_codecs), do: {:ok, "rtc_pid"})

      expect(Room.Server.cast(:"room:lobby", {:exrtc_offer, ^player_id, "rtc_pid", ^offer})) do
        {:ok, @player}
      end

      ref = push(socket, "exrtc_offer", {:binary, packet})
      assert_reply ref, :ok
    end
  end

  describe "exrtc_ice" do
    test "handles WebRTC ICE candidate", %{socket: socket} do
      player_id = @player.id

      ice_candidate = %{
        candidate: "candidate",
        sdp_m_line_index: 0,
        sdp_mid: "mid",
        username_fragment: "frag"
      }

      packet = Packets.WebrtcIceCandidate.build(ice_candidate)
      parsed_candidate = Packets.WebrtcIceCandidate.parse(packet)

      expect(Room.Server.cast(:"room:lobby", {:exrtc_ice, ^player_id, ^parsed_candidate})) do
        :ok
      end

      ref = push(socket, "exrtc_ice", {:binary, packet})
      assert_reply ref, :ok
    end
  end

  describe "exrtc_toggle_stream" do
    test "toggles RTC stream", %{socket: socket} do
      player_id = @player.id

      params = %{
        rtc_audio_enabled: true,
        rtc_camera_enabled: false
      }

      <<_::little-unsigned-integer-size(64), packet::binary>> =
        Packets.WebrtcToggleStream.build(player_id, true, false)

      expect(Room.Server.cast(:"room:lobby", {:update_player, ^player_id, ^params}), do: :ok)

      ref = push(socket, "exrtc_toggle_stream", {:binary, packet})
      assert_reply ref, :ok

      packet = Packets.WebrtcToggleStream.build(player_id, true, false)
      assert_broadcast "exrtc_toggle_stream", {:binary, ^packet}
    end
  end

  describe "exrtc_ready" do
    test "sets RTC ready state", %{socket: socket} do
      player_id = @player.id

      expect(Room.Server.cast(:"room:lobby", {:update_player, ^player_id, %{rtc_ready: true}}),
        do: :ok
      )

      ref = push(socket, "exrtc_ready", %{})
      assert_reply ref, :ok

      packet = Packets.WebrtcReady.build(player_id)
      assert_broadcast "exrtc_ready", {:binary, ^packet}
    end
  end

  describe "terminate" do
    test "leaves the channel", %{socket: socket} do
      player_id = @player.id

      Process.unlink(socket.channel_pid)

      expect(Room.Server.call(:"room:lobby", {:leave, ^player_id}), do: :ok)
      :ok = close(socket)

      packet = Packets.PlayerLeft.build(player_id)
      assert_broadcast "player_left", {:binary, ^packet}
    end
  end

  describe "handle_info" do
    test "handle push message", %{socket: socket} do
      send(socket.channel_pid, {:push, "hello", "Hello World!"})
      assert_push "hello", {:binary, "Hello World!"}
    end

    test "handle broadcast message", %{socket: socket} do
      send(socket.channel_pid, {:broadcast, "hello", "Hello World!"})
      assert_broadcast "hello", {:binary, "Hello World!"}
    end

    test "handle ex_webrtc RTP nessage", %{socket: socket} do
      player_id = @player.id
      client_track_id = 1
      packet = "Hello World"
      msg = {:rtp, client_track_id, nil, packet}

      expect(
        Room.Server.cast(:"room:lobby", {:exrtc_send_rtp, ^player_id, ^client_track_id, ^packet}),
        do: :ok
      )

      send(socket.channel_pid, {:ex_webrtc, self(), msg})

      refute_push "exrtc_send_rtp", _packet
    end

    test "handle ex_webrtc ICE message", %{socket: socket} do
      ice_candidate = %{
        candidate: "candidate",
        sdp_m_line_index: 0,
        sdp_mid: "mid",
        username_fragment: "frag"
      }

      packet = Packets.WebrtcIceCandidate.build(ice_candidate)
      msg = {:ice_candidate, ice_candidate}

      send(socket.channel_pid, {:ex_webrtc, self(), msg})

      assert_push "exrtc_ice", {:binary, ^packet}
    end

    test "handle invalid ex_webrtc message", %{socket: socket} do
      send(socket.channel_pid, {:ex_webrtc, self(), :invalid})
      refute_push "exrtc_ice", _packet
      refute_push "exrtc_send_rtp", _packet
    end
  end
end
