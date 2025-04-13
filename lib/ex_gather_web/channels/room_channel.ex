defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  alias ExGather.Room.RTC
  alias ExGatherWeb.RoomJSON

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

    {:ok, %{player: RoomJSON.player(player)}, socket}
  end

  @impl true
  def handle_info({:after_join, player, players}, socket) do
    push(socket, "room_state", RoomJSON.room_state(players))
    broadcast_from!(socket, "player_join", RoomJSON.player(player))

    {:noreply, socket}
  end

  def handle_info({:push, event, data}, socket) do
    push(socket, event, data)
    {:noreply, socket}
  end

  def handle_info({:ex_webrtc, _from, msg}, socket) do
    handle_webrtc_msg(msg, socket)
  end

  def handle_info({:DOWN, _pid, :process, _ppid, :normal}, socket) do
    {:noreply, socket}
  end

  defp handle_webrtc_msg({:ice_candidate, candidate}, socket) do
    candidate = ExWebRTC.ICECandidate.to_json(candidate)
    push(socket, "exrtc_ice", %{"ice" => candidate})

    {:noreply, socket}
  end

  defp handle_webrtc_msg({:rtcp, packets}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:exrtc_send_pli, sender.id, packets})

    {:noreply, socket}
  end

  defp handle_webrtc_msg({:rtp, client_track_id, nil, packet}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:exrtc_audio, sender.id, client_track_id, packet})
    {:noreply, socket}
  end

  defp handle_webrtc_msg(_msg, socket), do: {:noreply, socket}

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("player_move", movement, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    # Broadcast to all other players in the room
    broadcast_from!(socket, "player_moved", Map.put(movement, "player_id", player.id))

    GenServer.cast(room_server, {:update_player, player.id, movement})

    {:noreply, assign(socket, :player, player)}
  end

  def handle_in("exrtc_offer", %{"offer" => offer}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    {:ok, rtc_pid} = RTC.start_link()

    GenServer.cast(room_server, {:exrtc_offer, player.id, rtc_pid, offer})
    {:noreply, socket}
  end

  def handle_in("exrtc_ice", %{"ice" => ice}, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:exrtc_ice, player.id, ice})
    {:noreply, socket}
  end

  def handle_in("webrtc_audio", params, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:update_player, sender.id, params})
    broadcast_from!(socket, "webrtc_audio", Map.put(params, "player_id", sender.id))

    {:noreply, socket}
  end

  def handle_in("webrtc_offer", %{"offer" => offer, "player_id" => rctp_id}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(
      room_server,
      {:push_to, rctp_id, "webrtc_offer", %{"player_id" => sender.id, "offer" => offer}}
    )

    {:noreply, socket}
  end

  def handle_in("webrtc_answer", %{"player_id" => recpt_id, "answer" => answer}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(
      room_server,
      {:push_to, recpt_id, "webrtc_answer", %{"player_id" => sender.id, "answer" => answer}}
    )

    {:noreply, socket}
  end

  def handle_in("webrtc_candidate", %{"player_id" => recpt_id, "candidate" => candidate}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(
      room_server,
      {:push_to, recpt_id, "webrtc_candidate",
       %{"player_id" => sender.id, "candidate" => candidate}}
    )

    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    :ok = GenServer.call(room_server, {:leave, player.id})

    # Automatically called on disconnect
    broadcast_from!(socket, "player_left", %{id: player.id})

    :ok
  end
end
