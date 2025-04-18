defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  alias ExGather.Room.RTC
  alias ExGatherWeb.Packets

  @impl true
  def join("room:" <> _room = room_name, _payload, socket) do
    player = socket.assigns.player
    room_server = :"#{room_name}"

    socket =
      socket
      |> assign(:player, player)
      |> assign(:room_server, room_server)

    {:ok, player, players} = GenServer.call(room_server, {:join, player})
    send(self(), {:after_join, player, players})

    {:ok, {:binary, Packets.Player.build(player)}, socket}
  end

  @impl true
  def handle_info({:after_join, player, players}, socket) do
    players = Map.values(players)
    push(socket, "room_state", {:binary, Packets.RoomState.build(players)})

    broadcast_from!(socket, "player_join", {:binary, Packets.Player.build(player)})

    {:noreply, socket}
  end

  def handle_info({:push, event, packet}, socket) do
    push(socket, event, {:binary, packet})
    {:noreply, socket}
  end

  def handle_info({:ex_webrtc, _from, msg}, socket) do
    handle_exrtc(msg, socket)
  end

  def handle_info({:DOWN, _pid, :process, _ppid, :normal}, socket) do
    {:noreply, socket}
  end

  defp handle_exrtc({:ice_candidate, candidate}, socket) do
    packet = Packets.WebrtcIceCandidate.build(candidate)
    push(socket, "exrtc_ice", {:binary, packet})

    {:noreply, socket}
  end

  defp handle_exrtc({:rtp, client_track_id, nil, packet}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:exrtc_send_rtp, sender.id, client_track_id, packet})
    {:noreply, socket}
  end

  defp handle_exrtc(_msg, socket), do: {:noreply, socket}

  @impl true
  def handle_in("player_move", {:binary, packet}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    movement = Packets.PlayerMove.parse(packet)

    # Broadcast to all other players in the room
    broadcast_from!(
      socket,
      "player_moved",
      {:binary, Packets.PlayerMoved.build(player.id, movement)}
    )

    GenServer.cast(room_server, {:update_player, player.id, movement})

    {:noreply, assign(socket, :player, player)}
  end

  def handle_in("player_chat", {:binary, packet}, socket) do
    player = socket.assigns.player

    # Broadcast to all other players in the room
    %{"type" => type, "msg" => msg} = Packets.ChatMsg.parse(packet)
    packet = Packets.ChatMsg.build(player.id, type, msg)

    broadcast_from!(socket, "player_chat", {:binary, packet})

    {:noreply, socket}
  end

  def handle_in("exrtc_offer", {:binary, packet}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    offer = Packets.WebrtcOffer.parse(packet)

    {:ok, rtc_pid} = RTC.start_link()
    GenServer.cast(room_server, {:exrtc_offer, player.id, rtc_pid, offer})

    {:noreply, socket}
  end

  def handle_in("exrtc_ice", {:binary, packet}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    candidate = Packets.WebrtcIceCandidate.parse(packet)
    GenServer.cast(room_server, {:exrtc_ice, player.id, candidate})

    {:noreply, socket}
  end

  def handle_in("exrtc_toggle_stream", {:binary, packet}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    params = Packets.WebrtcToggleStream.parse(packet)
    GenServer.cast(room_server, {:update_player, sender.id, params})

    packet =
      Packets.WebrtcToggleStream.build(
        sender.id,
        params["rtc_audio_enabled"],
        params["rtc_camera_enabled"]
      )

    broadcast_from!(socket, "exrtc_toggle_stream", {:binary, packet})

    {:noreply, socket}
  end

  def handle_in("exrtc_ready", _params, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:update_player, sender.id, %{rtc_ready: true}})
    packet = Packets.WebrtcReady.build(sender.id)
    broadcast_from!(socket, "exrtc_ready", {:binary, packet})

    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    :ok = GenServer.call(room_server, {:leave, player.id})

    # Automatically called on disconnect
    packet = Packets.PlayerLeft.build(player.id)
    broadcast_from!(socket, "player_left", {:binary, packet})

    :ok
  end
end
