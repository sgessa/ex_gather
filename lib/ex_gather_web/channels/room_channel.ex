defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  alias ExGather.Room
  alias ExGatherWeb.Packets

  @impl true
  def join("room:" <> _room = room_name, _payload, socket) do
    player = socket.assigns.player
    room_server = :"#{room_name}"

    {:ok, player, players} = Room.Server.call(room_server, {:join, player})
    send(self(), {:after_join, player, players})

    socket = assign(socket, :room_server, room_server)
    packet = Packets.Player.build(player)
    {:ok, {:binary, packet}, socket}
  end

  @impl true
  def handle_info({:after_join, player, players}, socket) do
    push(socket, "room_state", {:binary, Packets.RoomState.build(players)})
    broadcast_from!(socket, "player_join", {:binary, Packets.Player.build(player)})
    {:noreply, socket}
  end

  def handle_info({:push, event, packet}, socket) do
    push(socket, event, {:binary, packet})
    {:noreply, socket}
  end

  def handle_info({:broadcast, event, packet}, socket) do
    broadcast_from(socket, event, {:binary, packet})
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

    Room.Server.cast(room_server, {:exrtc_send_rtp, sender.id, client_track_id, packet})
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

    Room.Server.cast(room_server, {:update_player, player.id, movement})
    {:noreply, assign(socket, :player, player)}
  end

  def handle_in("player_chat", {:binary, packet}, socket) do
    room_server = socket.assigns.room_server
    player = socket.assigns.player

    %{type: type, msg: msg, dest: dest} = Packets.ChatMsg.parse(packet)
    Room.Server.cast(room_server, {:player_chat, player.id, dest, type, msg})

    {:reply, :ok, socket}
  end

  def handle_in("exrtc_offer", {:binary, packet}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    offer = Packets.WebrtcOffer.parse(packet)

    {:ok, rtc_pid} = Room.RTC.start_peer()
    Room.Server.cast(room_server, {:exrtc_offer, player.id, rtc_pid, offer})

    {:reply, :ok, socket}
  end

  def handle_in("exrtc_ice", {:binary, packet}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    candidate = Packets.WebrtcIceCandidate.parse(packet)
    Room.Server.cast(room_server, {:exrtc_ice, player.id, candidate})

    {:reply, :ok, socket}
  end

  def handle_in("exrtc_toggle_stream", {:binary, packet}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    params = Packets.WebrtcToggleStream.parse(packet)
    Room.Server.cast(room_server, {:update_player, sender.id, params})

    packet =
      Packets.WebrtcToggleStream.build(
        sender.id,
        params.rtc_audio_enabled,
        params.rtc_camera_enabled
      )

    broadcast_from!(socket, "exrtc_toggle_stream", {:binary, packet})

    {:reply, :ok, socket}
  end

  def handle_in("exrtc_ready", _params, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    Room.Server.cast(room_server, {:update_player, sender.id, %{rtc_ready: true}})
    packet = Packets.WebrtcReady.build(sender.id)
    broadcast_from!(socket, "exrtc_ready", {:binary, packet})

    {:reply, :ok, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    :ok = Room.Server.call(room_server, {:leave, player.id})

    # Automatically called on disconnect
    packet = Packets.PlayerLeft.build(player.id)
    broadcast_from!(socket, "player_left", {:binary, packet})

    :ok
  end
end
