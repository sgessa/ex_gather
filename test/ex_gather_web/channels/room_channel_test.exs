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

    {:ok, _, socket} =
      ExGatherWeb.UserSocket
      |> socket("user_id", %{player: player_info})
      |> subscribe_and_join(ExGatherWeb.RoomChannel, "room:lobby")

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
      message = "Hello, world!"

      packet =
        PacketWriter.build()
        |> PacketWriter.uint8(0)
        |> PacketWriter.string(message)

      push(socket, "player_chat", {:binary, packet})

      packet = Packets.ChatMsg.build(@player.id, 0, message)
      assert_broadcast "player_chat", {:binary, ^packet}
    end
  end

  describe "exrtc_offer" do
    test "handles WebRTC offer", %{socket: socket} do
      player_id = @player.id
      offer = %{"type" => "offer", "sdp" => "long sdp string"}
      packet = PacketWriter.build() |> PacketWriter.string(offer["sdp"])

      expect(Room.RTC.start_peer(), do: {:ok, "rtc_pid"})

      expect(Room.Server.cast(:"room:lobby", {:exrtc_offer, ^player_id, "rtc_pid", ^offer})) do
        {:ok, @player}
      end

      ref = push(socket, "exrtc_offer", {:binary, packet})
      assert_reply ref, :ok
    end
  end
end
